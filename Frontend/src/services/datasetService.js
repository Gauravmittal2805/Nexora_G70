/**
 * Dataset Service for Nexora
 * Handles client-side storage, sample datasets, CSV/JSON parsing, type inference,
 * paginated preview queries, and visual field-mapping logic.
 */

import api from './api';

// Clean workspace: No mock or sample datasets
const INITIAL_DATASETS = [];

const STORAGE_KEY = 'nexora_datasets_catalog';

const MOCK_NAMES = new Set([
  'customer_churn_analysis.csv',
  'global_financial_metrics.csv',
  'housing_price_index_2025.csv',
  'iot_telemetry_sensors.json',
]);
const MOCK_IDS = new Set(['ds-churn-101', 'ds-financial-404', 'ds-housing-202', 'ds-iot-303']);

function isMockDataset(d) {
  if (!d) return true;
  const idStr = String(d.id || d.datasetId || '').toLowerCase();
  const nameStr = String(d.name || d.fileName || '').toLowerCase();
  if (MOCK_IDS.has(d.id) || MOCK_IDS.has(d.datasetId)) return true;
  if (MOCK_NAMES.has(nameStr)) return true;
  if (idStr.startsWith('ds-churn') || idStr.startsWith('ds-financial') || idStr.startsWith('ds-housing') || idStr.startsWith('ds-iot')) return true;
  return false;
}

/**
 * Standardize and normalize dataset structure from server / storage
 */
export function normalizeDataset(raw) {
  if (!raw) return null;
  const id = raw.id || raw.datasetId || `ds-${Date.now()}`;
  const name = raw.name || raw.fileName || 'Untitled Dataset';
  const format = (raw.format || (raw.fileType ? raw.fileType.toUpperCase() : 'CSV')).toUpperCase();
  const fileType = (raw.fileType || format).toLowerCase();
  const sizeBytes = Number(raw.sizeBytes ?? raw.fileSize ?? 0);
  const uploadedAt = raw.uploadedAt || raw.createdAt || new Date().toISOString();
  const rowCount = Number(raw.rowCount ?? raw.metadata?.rowCount ?? raw.sampleRows?.length ?? 0);
  const columnCount = Number(raw.columnCount ?? raw.metadata?.columnCount ?? raw.columns?.length ?? 0);

  return {
    id,
    datasetId: id,
    name,
    description: raw.description || '',
    format,
    fileType,
    sizeBytes,
    fileSize: sizeBytes,
    rowCount,
    columnCount,
    uploadedAt,
    createdAt: uploadedAt,
    status: raw.status || 'Ready',
    tags: Array.isArray(raw.tags) && raw.tags.length > 0 ? raw.tags : ['Tabular'],
    columns: raw.columns || raw.metadata?.columns || [],
    sampleRows: raw.sampleRows || raw.rows || [],
    storagePath: raw.storagePath || raw.storageUrl || '',
    mapping: raw.mapping || autoSuggestMapping(raw.columns || []),
  };
}

/**
 * Heuristic Auto-Mapping logic based on column names and data types
 */
export function autoSuggestMapping(columns = []) {
  if (!columns || columns.length === 0) {
    return { target: '', id: '', numerical: [], categorical: [], datetime: [], ignored: [] };
  }

  const colNames = columns.map((c) => c.name);

  // 1. Guess Target Column (prediction variable)
  const targetCol = colNames.find((n) =>
    /^(churn|target|label|price|fraud|status|alert|outcome|y|is_|bought|converted|success)/i.test(n) ||
    /(_churn|_target|_label|_price|_class|_flag)$/i.test(n)
  ) || (columns.find((c) => c.type === 'Boolean')?.name || '');

  // 2. Guess Entity ID Column
  const idCol = colNames.find((n) =>
    /^id$|(_id$)|(id_)|^pk$|(_pk$)|(code$)|(uuid$)|(key$)/i.test(n) && n !== targetCol
  ) || '';

  // 3. Classify remaining columns
  const numerical = [];
  const categorical = [];
  const datetime = [];
  const ignored = [];

  columns.forEach((col) => {
    const name = col.name;
    if (name === targetCol || name === idCol) return;

    if (col.type === 'DateTime' || /(date|time|year|timestamp|created|updated)/i.test(name)) {
      datetime.push(name);
    } else if (col.type === 'Integer' || col.type === 'Float') {
      numerical.push(name);
    } else if (col.type === 'Categorical' || col.type === 'Boolean' || col.type === 'String') {
      // Check if it looks like arbitrary free text or description to ignore
      if (/(description|comment|text|raw_|notes|url|link|address)/i.test(name)) {
        ignored.push(name);
      } else {
        categorical.push(name);
      }
    } else {
      categorical.push(name);
    }
  });

  return {
    target: targetCol,
    id: idCol,
    numerical,
    categorical,
    datetime,
    ignored,
  };
}

/**
 * Intelligent Source-to-Target mapping generator based on source dataset columns
 */
export function autoSuggestSourceToTargetMapping(columns = []) {
  if (!columns || columns.length === 0) return [];
  return columns.map((col, idx) => {
    const colName = col.name || String(col);
    const rawType = col.type || (col.dataType === 'number' ? 'Float' : col.dataType === 'boolean' ? 'Boolean' : col.dataType === 'date' ? 'DateTime' : 'String');
    const isId = /^(id|customer_?id|_id|uuid|key)$/i.test(colName);
    const isTarget = /^(target|label|churn|alert|status|outcome|flag)$/i.test(colName);
    return {
      id: `map-${colName}-${idx}`,
      targetField: colName,
      sourceField: colName,
      targetType: rawType,
      required: isId || isTarget,
      transformation: 'none',
      defaultValue: ''
    };
  });
}

/**
 * Infer data type of a column based on an array of values
 */
export function inferDataType(values) {
  const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNullValues.length === 0) return 'String';

  let isInt = true;
  let isFloat = true;
  let isBool = true;
  let isDate = true;

  for (const val of nonNullValues.slice(0, 50)) {
    const s = String(val).trim().toLowerCase();

    // Check boolean
    if (!['true', 'false', '0', '1', 'yes', 'no'].includes(s)) {
      isBool = false;
    }

    // Check integer
    if (!/^-?\d+$/.test(s)) {
      isInt = false;
    }

    // Check float
    if (!/^-?\d+(\.\d+)?$/.test(s)) {
      isFloat = false;
    }

    // Check date
    if (isNaN(Date.parse(s)) || /^\d+$/.test(s)) {
      isDate = false;
    }
  }

  if (isBool && nonNullValues.length > 0) return 'Boolean';
  if (isInt) return 'Integer';
  if (isFloat) return 'Float';
  if (isDate) return 'DateTime';

  const uniqueVals = new Set(nonNullValues);
  if (uniqueVals.size <= 8 && nonNullValues.length >= 10) return 'Categorical';

  return 'String';
}

/**
 * Parse CSV text into headers and row objects
 */
export function parseCSVText(csvContent, maxPreviewRows = 200) {
  if (!csvContent || typeof csvContent !== 'string') {
    throw new Error('Invalid CSV file content.');
  }

  const rawLines = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const lines = rawLines.filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    throw new Error('CSV file is empty.');
  }

  const splitLine = (text) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  const rawHeaders = splitLine(lines[0]);
  const headers = rawHeaders.map((h, i) => (h ? h : `Column_${i + 1}`));

  const rows = [];
  const previewSlice = lines.slice(1, maxPreviewRows + 1);

  for (const line of previewSlice) {
    const values = splitLine(line);
    const rowObj = {};
    headers.forEach((header, idx) => {
      let val = values[idx] !== undefined ? values[idx] : '';
      if (/^-?\d+$/.test(val)) {
        rowObj[header] = parseInt(val, 10);
      } else if (/^-?\d+(\.\d+)?$/.test(val)) {
        rowObj[header] = parseFloat(val);
      } else {
        rowObj[header] = val;
      }
    });
    rows.push(rowObj);
  }

  const columns = headers.map((header) => {
    const colValues = rows.map((r) => r[header]);
    const missingCount = colValues.filter((v) => v === '' || v === null || v === undefined).length;
    return {
      name: header,
      type: inferDataType(colValues),
      missingCount,
    };
  });

  return {
    headers,
    columns,
    rows,
    totalRowsEstimated: lines.length - 1,
  };
}

/**
 * Format bytes to human readable format (KB, MB, GB)
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format date to clean, localized string
 */
export function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateString);
  }
}

/**
 * Format relative time (e.g., "5 mins ago", "2 hours ago")
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export const datasetService = {
  /**
   * Upload dataset to Backend API using Axios and FormData
   * Supports real-time onUploadProgress tracking
   */
  uploadToBackend: async ({ file, metadata = {}, onUploadProgress }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.name) formData.append('name', metadata.name);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.format) formData.append('format', metadata.format);
    if (metadata.delimiter) formData.append('delimiter', metadata.delimiter);
    if (metadata.tags) formData.append('tags', JSON.stringify(metadata.tags));
    if (metadata.hasHeaders !== undefined) formData.append('hasHeaders', String(metadata.hasHeaders));

    try {
      const response = await api.post('/datasets/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onUploadProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onUploadProgress(percent);
          }
        },
      });

      const serverDataset = normalizeDataset(response.data?.dataset || response.data?.data);
      if (serverDataset) {
        datasetService.saveDataset(serverDataset);
      }

      return {
        success: true,
        source: 'Nexora Backend API',
        message: response.data?.message || 'Dataset uploaded successfully to Nexora Backend!',
        dataset: serverDataset,
      };
    } catch (error) {
      const isConnectionRefused =
        error.message?.includes('Network Error') ||
        error.code === 'ERR_NETWORK' ||
        error.originalError?.code === 'ECONNREFUSED' ||
        error.status === 404;

      if (isConnectionRefused) {
        const enriched = new Error(
          'Backend server is not reachable on port 5000. Saved to local storage catalog.'
        );
        enriched.isOffline = true;
        enriched.originalError = error;
        throw enriched;
      }

      throw error;
    }
  },

  /**
   * Fetch datasets from backend API with fallback to local storage
   */
  fetchDatasets: async () => {
    try {
      const res = await api.get('/datasets');
      const rawList = res.data?.datasets || res.data?.data || (Array.isArray(res.data) ? res.data : null);

      if (Array.isArray(rawList)) {
        const realRaw = rawList.filter((d) => !isMockDataset(d));
        const normalizedList = realRaw.map(normalizeDataset).filter(Boolean);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedList));
        } catch (e) {
          console.warn('LocalStorage sync warning:', e);
        }
        const result = [...normalizedList];
        result.datasets = normalizedList;
        result.isOffline = false;
        result.success = true;
        return result;
      }

      const cached = datasetService.getDatasets();
      const result = [...cached];
      result.datasets = cached;
      result.isOffline = false;
      result.success = true;
      return result;
    } catch (err) {
      console.warn('Backend API unreachable, loading offline dataset catalog:', err.message);
      const cached = datasetService.getDatasets();
      const result = [...cached];
      result.datasets = cached;
      result.isOffline = true;
      result.success = true;
      result.error = err.message;
      return result;
    }
  },

  /**
   * Fetch paginated dataset preview records from Backend API
   * Supports ?page=1&limit=10 queries with server pagination metadata
   */
  getDatasetPreview: async (id, { page = 1, limit = 10 } = {}) => {
    try {
      const res = await api.get(`/datasets/${id}/preview?page=${page}&limit=${limit}`);
      if (res.data && res.data.success) {
        return {
          success: true,
          columns: res.data.columns || [],
          rows: res.data.rows || [],
          totalRows: res.data.totalRows || res.data.rows?.length || 0,
          previewCount: res.data.previewCount || res.data.rows?.length || 0,
          pagination: res.data.pagination || {
            page,
            limit,
            totalPages: Math.ceil((res.data.totalRows || res.data.rows?.length || 1) / limit),
            totalCount: res.data.totalRows || res.data.rows?.length || 0,
            hasNextPage: false,
            hasPrevPage: page > 1,
          },
          name: res.data.name || res.data.fileName || 'Dataset Preview',
          format: res.data.format || 'CSV',
          fileSizeBytes: res.data.fileSizeBytes,
          isOffline: false,
        };
      }
    } catch (err) {
      console.warn(`Preview API call failed for dataset ${id}, falling back to local paginated slice:`, err.message);
    }

    // Fallback: check locally stored dataset and perform client pagination
    const dataset = datasetService.getDatasetById(id);
    if (dataset) {
      const allRows = dataset.sampleRows || [];
      const validLimit = Math.max(1, limit);
      const totalAvailable = allRows.length;
      const totalPages = Math.max(1, Math.ceil(totalAvailable / validLimit));
      const validPage = Math.min(Math.max(1, page), totalPages);
      const startIndex = (validPage - 1) * validLimit;
      const slice = allRows.slice(startIndex, startIndex + validLimit);

      return {
        success: true,
        columns: dataset.columns || [],
        rows: slice,
        totalRows: dataset.rowCount || totalAvailable,
        previewCount: slice.length,
        pagination: {
          page: validPage,
          limit: validLimit,
          totalPages,
          totalCount: totalAvailable,
          hasNextPage: validPage < totalPages,
          hasPrevPage: validPage > 1,
        },
        name: dataset.name,
        format: dataset.format,
        fileSizeBytes: dataset.sizeBytes,
        isOffline: true,
      };
    }

    throw new Error(`Dataset with ID "${id}" could not be found.`);
  },

  /**
   * Fetch complete dataset profiling metrics (types, nulls, unique values, summary stats)
   * GET /api/datasets/:id/profile
   */
  getDatasetProfile: async (id, { refresh = false } = {}) => {
    try {
      const url = `/datasets/${id}/profile${refresh ? "?refresh=true" : ""}`;
      const res = await api.get(url);
      if (res.data && res.data.success) {
        return res.data;
      }
      return res.data;
    } catch (err) {
      console.warn(`Dataset profile API call failed for ${id}:`, err.message);
      throw err;
    }
  },

  /**
   * Get field mapping for dataset (from backend or local)
   */
  getFieldMapping: async (id) => {
    try {
      const res = await api.get(`/datasets/${id}/mapping`);
      if (res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend get mapping error (falling back to local):', err?.message);
    }

    const ds = datasetService.getDatasetById(id);
    if (ds) {
      const cols = ds.columns || ds.metadata?.columns || [];
      const autoMappings = autoSuggestSourceToTargetMapping(cols);
      return {
        success: true,
        datasetId: ds.id || ds.datasetId || id,
        name: ds.name || ds.fileName,
        fileName: ds.fileName || ds.name,
        fileSize: ds.fileSize || ds.sizeBytes || 0,
        rowCount: ds.rowCount || ds.metadata?.rowCount || 0,
        columnCount: cols.length,
        format: ds.format || ds.fileType || 'CSV',
        columns: cols,
        fieldMappings: ds.mapping?.fieldMappings || autoMappings,
        destinations: ds.mapping?.destinations || [],
        connections: ds.mapping?.connections || [],
        mapping: ds.mapping || autoSuggestMapping(cols),
        validation: { isValid: true, errorCount: 0, warningCount: 0, errors: [], warnings: [] }
      };
    }
    return null;
  },

  /**
   * Save field mapping for dataset
   */
  saveFieldMapping: async (id, mappingPayload, options = {}) => {
    let result = null;
    const queryParam = options.strict ? '?strict=true' : '';
    try {
      const res = await api.post(`/datasets/${id}/mapping${queryParam}`, { mapping: mappingPayload });
      if (res.data && res.data.success) {
        result = res.data;
      }
    } catch (err) {
      console.warn('Backend save mapping error:', err.message);
      if (err.data && (err.data.errors || err.data.validation)) {
        const enriched = new Error(err.data.message || 'Mapping validation failed');
        enriched.validation = err.data.validation || { errors: err.data.errors, warnings: err.data.warnings };
        enriched.errors = err.data.errors || [];
        enriched.warnings = err.data.warnings || [];
        throw enriched;
      }
      throw err;
    }

    const ds = datasetService.getDatasetById(id);
    if (ds) {
      ds.mapping = mappingPayload;
      datasetService.saveDataset(ds);
    }
    return result || { success: true, mapping: mappingPayload };
  },

  /**
   * Validate field mapping against dataset schema
   */
  validateFieldMapping: async (id, mappingPayload) => {
    try {
      const res = await api.post(`/datasets/${id}/mapping/validate`, { mapping: mappingPayload });
      if (res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend validate mapping error:', err.message);
      if (err.data) return err.data;
    }
    return null;
  },

  /**
   * Apply transformations and project dataset preview rows using field mapping
   */
  transformDatasetRows: async (id, payload = {}) => {
    try {
      const res = await api.post(`/datasets/${id}/transform`, payload);
      return res.data;
    } catch (err) {
      console.warn('Backend transform dataset rows error:', err.message);
      throw err;
    }
  },

  /**
   * Get all datasets from storage (fresh and clean, no mock/fake datasets)
   */
  getDatasets: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Purge any legacy mock datasets if they remain in localStorage
          const realDatasets = parsed.filter((d) => !isMockDataset(d));
          if (realDatasets.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(realDatasets));
          }
          return realDatasets.map(normalizeDataset);
        }
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Get single dataset by ID
   */
  getDatasetById: (id) => {
    const datasets = datasetService.getDatasets();
    return datasets.find((d) => d.id === id || d.datasetId === id) || null;
  },

  /**
   * Add or update a dataset locally
   */
  saveDataset: (dataset) => {
    const normalized = normalizeDataset(dataset);
    const datasets = datasetService.getDatasets();
    const filtered = datasets.filter((d) => d.id !== normalized.id && d.datasetId !== normalized.id);
    const updated = [normalized, ...filtered];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage limit exceeded, falling back to memory', e);
    }
    return normalized;
  },

  /**
   * Delete dataset by ID (calls backend + removes from storage)
   */
  deleteDataset: async (id) => {
    try {
      await api.delete(`/datasets/${id}`);
    } catch (err) {
      console.warn('Backend delete error (removing locally):', err.message);
    }
    const datasets = datasetService.getDatasets();
    const updated = datasets.filter((d) => d.id !== id && d.datasetId !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    return updated;
  },

  /**
   * Reset to empty catalog (clears stored datasets)
   */
  resetCatalog: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn(e);
    }
    return [];
  },

  /**
   * Get sample datasets (empty: mock datasets removed)
   */
  getSampleDatasets: () => [],
};

export default datasetService;
