/**
 * Dataset Service for Nexora
 * Handles client-side storage, sample datasets, CSV/JSON parsing, type inference,
 * and Axios FormData communication with the Backend API.
 */

import api from './api';

// Initial empty catalog - strictly real datasets uploaded by user
const INITIAL_DATASETS = [];

const STORAGE_KEY = 'nexora_datasets_catalog';

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

  // Check unique values for categorical
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

  // Normalize line breaks
  const rawLines = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const lines = rawLines.filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    throw new Error('CSV file is empty.');
  }

  // Regex to split CSV with quotes handling
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
      rowObj[header] = val;
    });
    rows.push(rowObj);
  }

  // Calculate column metadata & inferred types
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
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
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

      const serverDataset = response.data?.dataset;
      if (serverDataset) {
        // Cache in catalog
        datasetService.saveDataset(serverDataset);
      }

      return {
        success: true,
        source: 'backend',
        message: response.data?.message || 'Dataset uploaded successfully to Nexora Backend!',
        dataset: serverDataset,
      };
    } catch (error) {
      // Diagnostic check for network/backend offline
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
   * Fetch datasets from backend API (with fallback to local storage)
   */
  fetchDatasets: async () => {
    try {
      const res = await api.get('/datasets');
      const list = res.data?.data || res.data?.datasets;
      if (Array.isArray(list)) {
        return list;
      }
      return datasetService.getDatasets();
    } catch {
      return datasetService.getDatasets();
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
          // Filter out legacy demo preloaded datasets
          const demoIds = ['ds-churn-101', 'ds-housing-202'];
          const realOnly = parsed.filter((d) => !demoIds.includes(d.id));
          if (realOnly.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(realOnly));
          }
          return realOnly;
        }
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Remove all datasets from local storage
   */
  clearAllDatasets: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    return [];
  },

  /**
   * Get single dataset by ID
   */
  getDatasetById: (id) => {
    const datasets = datasetService.getDatasets();
    return datasets.find((d) => d.id === id) || null;
  },

  /**
   * Add a new dataset locally
   */
  saveDataset: (dataset) => {
    const datasets = datasetService.getDatasets();
    const newEntry = {
      ...dataset,
      id: dataset.id || `ds-${Date.now()}`,
      uploadedAt: dataset.uploadedAt || new Date().toISOString(),
      status: dataset.status || 'Ready',
    };
    // Prevent duplicate entries by id
    const filtered = datasets.filter((d) => d.id !== newEntry.id);
    const updated = [newEntry, ...filtered];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage limit exceeded, falling back to memory', e);
    }
    return newEntry;
  },

  /**
   * Delete dataset by ID (calls backend + removes from storage)
   */
  deleteDataset: async (id) => {
    try {
      await api.delete(`/datasets/${id}`);
    } catch {
      // Backend may be offline, continue removing from local storage
    }
    const datasets = datasetService.getDatasets();
    const updated = datasets.filter((d) => d.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    return updated;
  },

  /**
   * Get sample datasets for testing
   */
  getSampleDatasets: () => INITIAL_DATASETS,
};

export default datasetService;
