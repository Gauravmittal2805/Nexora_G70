/**
 * Dataset Service for Nexora
 * Handles client-side storage, sample datasets, CSV parsing, and type inference.
 */

// Initial preloaded datasets so user can test UI immediately
const INITIAL_DATASETS = [
  {
    id: 'ds-churn-101',
    name: 'Customer_Churn_Analysis.csv',
    description: 'Telecom customer behavior and subscription dataset for churn prediction modeling.',
    format: 'CSV',
    sizeBytes: 142850,
    rowCount: 2500,
    columnCount: 8,
    uploadedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'Ready',
    tags: ['Telecom', 'Classification', 'Tabular'],
    columns: [
      { name: 'CustomerID', type: 'String', missingCount: 0 },
      { name: 'Age', type: 'Integer', missingCount: 0 },
      { name: 'Gender', type: 'Categorical', missingCount: 0 },
      { name: 'Tenure_Months', type: 'Integer', missingCount: 2 },
      { name: 'Monthly_Charges', type: 'Float', missingCount: 0 },
      { name: 'Total_Charges', type: 'Float', missingCount: 5 },
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
    ],
  },
  {
    id: 'ds-housing-202',
    name: 'Housing_Price_Index_2025.csv',
    description: 'Metropolitan residential real estate sales records with structural and location features.',
    format: 'CSV',
    sizeBytes: 284910,
    rowCount: 5400,
    columnCount: 7,
    uploadedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
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
    ],
  },
];

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
   * Get all datasets from storage (with defaults fallback)
   */
  getDatasets: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      // Initialize with defaults
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATASETS));
      return INITIAL_DATASETS;
    } catch {
      return INITIAL_DATASETS;
    }
  },

  /**
   * Get single dataset by ID
   */
  getDatasetById: (id) => {
    const datasets = datasetService.getDatasets();
    return datasets.find((d) => d.id === id) || null;
  },

  /**
   * Add a new dataset
   */
  saveDataset: (dataset) => {
    const datasets = datasetService.getDatasets();
    const newEntry = {
      ...dataset,
      id: dataset.id || `ds-${Date.now()}`,
      uploadedAt: dataset.uploadedAt || new Date().toISOString(),
      status: dataset.status || 'Ready',
    };
    const updated = [newEntry, ...datasets];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage limit exceeded, falling back to memory', e);
    }
    return newEntry;
  },

  /**
   * Delete dataset by ID
   */
  deleteDataset: (id) => {
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
