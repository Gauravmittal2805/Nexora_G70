/**
 * Dataset Service for Nexora
 * Handles client-side storage, sample datasets, CSV/JSON parsing, type inference,
 * and Axios FormData communication with the Backend API.
 */

import api from './api';

// Initial preloaded datasets with rich rows (first 10-20 records) for testing & offline mode
const INITIAL_DATASETS = [
  {
    id: 'ds-churn-101',
    datasetId: 'ds-churn-101',
    name: 'Customer_Churn_Analysis.csv',
    description: 'Telecom customer behavior and subscription dataset for churn prediction modeling.',
    format: 'CSV',
    fileType: 'csv',
    sizeBytes: 142850,
    fileSize: 142850,
    rowCount: 2500,
    columnCount: 8,
    uploadedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'Ready',
    tags: ['Telecom', 'Classification', 'Tabular'],
    columns: [
      { name: 'CustomerID', type: 'String', missingCount: 0 },
      { name: 'Age', type: 'Integer', missingCount: 0 },
      { name: 'Gender', type: 'Categorical', missingCount: 0 },
      { name: 'Tenure_Months', type: 'Integer', missingCount: 2 },
      { name: 'Monthly_Charges', type: 'Float', missingCount: 0 },
      { name: 'Total_Charges', type: 'Float', missingCount: 1 },
      { name: 'Contract_Type', type: 'Categorical', missingCount: 0 },
      { name: 'Churn', type: 'Boolean', missingCount: 0 },
    ],
    sampleRows: [
      { CustomerID: 'CUST-7021', Age: 34, Gender: 'Female', Tenure_Months: 12, Monthly_Charges: 65.40, Total_Charges: 784.80, Contract_Type: 'Month-to-month', Churn: 'No' },
      { CustomerID: 'CUST-8842', Age: 52, Gender: 'Male', Tenure_Months: 48, Monthly_Charges: 98.20, Total_Charges: 4713.60, Contract_Type: 'Two year', Churn: 'No' },
      { CustomerID: 'CUST-1094', Age: 29, Gender: 'Female', Tenure_Months: 3, Monthly_Charges: 79.85, Total_Charges: 239.55, Contract_Type: 'Month-to-month', Churn: 'Yes' },
      { CustomerID: 'CUST-4501', Age: 41, Gender: 'Male', Tenure_Months: 24, Monthly_Charges: 54.10, Total_Charges: 1298.40, Contract_Type: 'One year', Churn: 'No' },
      { CustomerID: 'CUST-9018', Age: 63, Gender: 'Female', Tenure_Months: 8, Monthly_Charges: 104.90, Total_Charges: 839.20, Contract_Type: 'Month-to-month', Churn: 'Yes' },
      { CustomerID: 'CUST-2231', Age: 38, Gender: 'Male', Tenure_Months: 36, Monthly_Charges: 45.00, Total_Charges: 1620.00, Contract_Type: 'One year', Churn: 'No' },
      { CustomerID: 'CUST-3189', Age: 47, Gender: 'Female', Tenure_Months: 60, Monthly_Charges: 112.50, Total_Charges: 6750.00, Contract_Type: 'Two year', Churn: 'No' },
      { CustomerID: 'CUST-5512', Age: 23, Gender: 'Male', Tenure_Months: 2, Monthly_Charges: 85.30, Total_Charges: 170.60, Contract_Type: 'Month-to-month', Churn: 'Yes' },
      { CustomerID: 'CUST-6043', Age: 31, Gender: 'Female', Tenure_Months: 18, Monthly_Charges: 70.15, Total_Charges: 1262.70, Contract_Type: 'Month-to-month', Churn: 'No' },
      { CustomerID: 'CUST-7789', Age: 56, Gender: 'Male', Tenure_Months: 42, Monthly_Charges: 93.00, Total_Charges: 3906.00, Contract_Type: 'One year', Churn: 'No' },
      { CustomerID: 'CUST-8102', Age: 45, Gender: 'Female', Tenure_Months: 15, Monthly_Charges: 62.50, Total_Charges: 937.50, Contract_Type: 'Month-to-month', Churn: 'No' },
      { CustomerID: 'CUST-9423', Age: 39, Gender: 'Male', Tenure_Months: 7, Monthly_Charges: 88.75, Total_Charges: 621.25, Contract_Type: 'Month-to-month', Churn: 'Yes' },
      { CustomerID: 'CUST-3310', Age: 61, Gender: 'Female', Tenure_Months: 54, Monthly_Charges: 108.20, Total_Charges: 5842.80, Contract_Type: 'Two year', Churn: 'No' },
      { CustomerID: 'CUST-4112', Age: 27, Gender: 'Male', Tenure_Months: 5, Monthly_Charges: 49.90, Total_Charges: 249.50, Contract_Type: 'Month-to-month', Churn: 'No' },
      { CustomerID: 'CUST-5678', Age: 35, Gender: 'Female', Tenure_Months: 29, Monthly_Charges: 75.40, Total_Charges: 2186.60, Contract_Type: 'One year', Churn: 'No' },
      { CustomerID: 'CUST-6901', Age: 49, Gender: 'Male', Tenure_Months: 11, Monthly_Charges: 91.10, Total_Charges: 1002.10, Contract_Type: 'Month-to-month', Churn: 'Yes' },
      { CustomerID: 'CUST-7234', Age: 33, Gender: 'Female', Tenure_Months: 22, Monthly_Charges: 58.00, Total_Charges: 1276.00, Contract_Type: 'One year', Churn: 'No' },
      { CustomerID: 'CUST-8890', Age: 58, Gender: 'Male', Tenure_Months: 66, Monthly_Charges: 119.45, Total_Charges: 7883.70, Contract_Type: 'Two year', Churn: 'No' },
    ],
  },
  {
    id: 'ds-housing-202',
    datasetId: 'ds-housing-202',
    name: 'Housing_Price_Index_2025.csv',
    description: 'Metropolitan residential real estate sales records with structural and location features.',
    format: 'CSV',
    fileType: 'csv',
    sizeBytes: 284910,
    fileSize: 284910,
    rowCount: 5400,
    columnCount: 7,
    uploadedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'Ready',
    tags: ['Real Estate', 'Regression', 'Geo'],
    columns: [
      { name: 'Property_ID', type: 'String', missingCount: 0 },
      { name: 'Square_Feet', type: 'Integer', missingCount: 0 },
      { name: 'Bedrooms', type: 'Integer', missingCount: 0 },
      { name: 'Bathrooms', type: 'Float', missingCount: 1 },
      { name: 'Neighborhood', type: 'Categorical', missingCount: 0 },
      { name: 'Year_Built', type: 'Integer', missingCount: 0 },
      { name: 'Price_USD', type: 'Float', missingCount: 0 },
    ],
    sampleRows: [
      { Property_ID: 'PROP-1001', Square_Feet: 1850, Bedrooms: 3, Bathrooms: 2.0, Neighborhood: 'Downtown', Year_Built: 2018, Price_USD: 425000 },
      { Property_ID: 'PROP-1002', Square_Feet: 2400, Bedrooms: 4, Bathrooms: 2.5, Neighborhood: 'Suburbs North', Year_Built: 2012, Price_USD: 510000 },
      { Property_ID: 'PROP-1003', Square_Feet: 1200, Bedrooms: 2, Bathrooms: 1.0, Neighborhood: 'East Bay', Year_Built: 1998, Price_USD: 295000 },
      { Property_ID: 'PROP-1004', Square_Feet: 3100, Bedrooms: 5, Bathrooms: 3.5, Neighborhood: 'West Hills', Year_Built: 2021, Price_USD: 749000 },
      { Property_ID: 'PROP-1005', Square_Feet: 1650, Bedrooms: 3, Bathrooms: 2.0, Neighborhood: 'Midtown', Year_Built: 2005, Price_USD: 380000 },
      { Property_ID: 'PROP-1006', Square_Feet: 2150, Bedrooms: 3, Bathrooms: 2.5, Neighborhood: 'Suburbs North', Year_Built: 2016, Price_USD: 460000 },
      { Property_ID: 'PROP-1007', Square_Feet: 2800, Bedrooms: 4, Bathrooms: 3.0, Neighborhood: 'Lakeside', Year_Built: 2019, Price_USD: 635000 },
      { Property_ID: 'PROP-1008', Square_Feet: 1400, Bedrooms: 2, Bathrooms: 1.5, Neighborhood: 'Old Town', Year_Built: 1985, Price_USD: 315000 },
      { Property_ID: 'PROP-1009', Square_Feet: 3600, Bedrooms: 5, Bathrooms: 4.0, Neighborhood: 'West Hills', Year_Built: 2023, Price_USD: 890000 },
      { Property_ID: 'PROP-1010', Square_Feet: 1950, Bedrooms: 3, Bathrooms: 2.0, Neighborhood: 'Downtown', Year_Built: 2014, Price_USD: 445000 },
      { Property_ID: 'PROP-1011', Square_Feet: 2250, Bedrooms: 4, Bathrooms: 2.5, Neighborhood: 'Lakeside', Year_Built: 2017, Price_USD: 530000 },
      { Property_ID: 'PROP-1012', Square_Feet: 1100, Bedrooms: 2, Bathrooms: 1.0, Neighborhood: 'East Bay', Year_Built: 1992, Price_USD: 275000 },
      { Property_ID: 'PROP-1013', Square_Feet: 2700, Bedrooms: 4, Bathrooms: 3.0, Neighborhood: 'Suburbs North', Year_Built: 2020, Price_USD: 585000 },
      { Property_ID: 'PROP-1014', Square_Feet: 1550, Bedrooms: 3, Bathrooms: 2.0, Neighborhood: 'Midtown', Year_Built: 2008, Price_USD: 365000 },
    ],
  },
  {
    id: 'ds-iot-303',
    datasetId: 'ds-iot-303',
    name: 'IoT_Telemetry_Sensors.json',
    description: 'Industrial sensor telemetry streams capturing environmental metrics and anomaly flags.',
    format: 'JSON',
    fileType: 'json',
    sizeBytes: 96420,
    fileSize: 96420,
    rowCount: 1800,
    columnCount: 6,
    uploadedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    status: 'Ready',
    tags: ['IoT', 'Time Series', 'Anomalies'],
    columns: [
      { name: 'device_id', type: 'String', missingCount: 0 },
      { name: 'temperature_c', type: 'Float', missingCount: 0 },
      { name: 'humidity_pct', type: 'Float', missingCount: 0 },
      { name: 'pressure_kpa', type: 'Float', missingCount: 0 },
      { name: 'status', type: 'Categorical', missingCount: 0 },
      { name: 'alert', type: 'Boolean', missingCount: 0 },
    ],
    sampleRows: [
      { device_id: 'DEV-101', temperature_c: 22.4, humidity_pct: 45.2, pressure_kpa: 101.3, status: 'ONLINE', alert: false },
      { device_id: 'DEV-102', temperature_c: 28.1, humidity_pct: 60.5, pressure_kpa: 100.8, status: 'ONLINE', alert: false },
      { device_id: 'DEV-103', temperature_c: 35.8, humidity_pct: 82.0, pressure_kpa: 98.4, status: 'WARNING', alert: true },
      { device_id: 'DEV-104', temperature_c: 19.5, humidity_pct: 40.1, pressure_kpa: 102.1, status: 'ONLINE', alert: false },
      { device_id: 'DEV-105', temperature_c: 39.2, humidity_pct: 88.4, pressure_kpa: 97.9, status: 'CRITICAL', alert: true },
      { device_id: 'DEV-106', temperature_c: 21.8, humidity_pct: 48.0, pressure_kpa: 101.5, status: 'ONLINE', alert: false },
      { device_id: 'DEV-107', temperature_c: 24.3, humidity_pct: 52.6, pressure_kpa: 101.0, status: 'ONLINE', alert: false },
      { device_id: 'DEV-108', temperature_c: 31.7, humidity_pct: 71.4, pressure_kpa: 99.2, status: 'WARNING', alert: true },
      { device_id: 'DEV-109', temperature_c: 20.1, humidity_pct: 43.8, pressure_kpa: 101.8, status: 'ONLINE', alert: false },
      { device_id: 'DEV-110', temperature_c: 23.5, humidity_pct: 50.2, pressure_kpa: 101.2, status: 'ONLINE', alert: false },
      { device_id: 'DEV-111', temperature_c: 41.0, humidity_pct: 91.2, pressure_kpa: 96.5, status: 'CRITICAL', alert: true },
      { device_id: 'DEV-112', temperature_c: 22.9, humidity_pct: 46.7, pressure_kpa: 101.4, status: 'ONLINE', alert: false },
    ],
  },
];

const STORAGE_KEY = 'nexora_datasets_catalog';

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
  };
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

  // Split CSV with quotes handling
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
        const normalizedList = rawList.map(normalizeDataset).filter(Boolean);
        // Sync local storage with latest backend catalog
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
   * Fetch dataset preview records (first 10-20 rows) from Backend API
   */
  getDatasetPreview: async (id, limit = 20) => {
    try {
      const res = await api.get(`/datasets/${id}/preview?limit=${limit}`);
      if (res.data && res.data.success) {
        return {
          success: true,
          columns: res.data.columns || [],
          rows: res.data.rows || [],
          totalRows: res.data.totalRows || res.data.rows?.length || 0,
          previewCount: res.data.previewCount || res.data.rows?.length || 0,
          name: res.data.name || res.data.fileName || 'Dataset Preview',
          isOffline: false,
        };
      }
    } catch (err) {
      console.warn(`Preview API call failed for dataset ${id}, falling back to local:`, err.message);
    }

    // Fallback: check locally stored dataset
    const dataset = datasetService.getDatasetById(id);
    if (dataset) {
      const sample = (dataset.sampleRows || []).slice(0, limit);
      return {
        success: true,
        columns: dataset.columns || [],
        rows: sample,
        totalRows: dataset.rowCount || sample.length,
        previewCount: sample.length,
        name: dataset.name,
        format: dataset.format,
        isOffline: true,
      };
    }

    throw new Error(`Dataset with ID "${id}" could not be found.`);
  },

  /**
   * Get all datasets from storage (with defaults fallback)
   */
  getDatasets: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeDataset);
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATASETS));
      return INITIAL_DATASETS.map(normalizeDataset);
    } catch {
      return INITIAL_DATASETS.map(normalizeDataset);
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
   * Reset to initial sample catalog
   */
  resetCatalog: () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATASETS));
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_DATASETS.map(normalizeDataset);
  },

  /**
   * Get sample datasets for testing
   */
  getSampleDatasets: () => INITIAL_DATASETS.map(normalizeDataset),
};

export default datasetService;
