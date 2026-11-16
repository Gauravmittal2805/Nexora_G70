const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Storage directory setup
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer file upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExts = ['.csv', '.json', '.xlsx', '.tsv'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext) || file.mimetype === 'text/csv' || file.mimetype === 'application/json') {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${ext}. Supported: ${allowedExts.join(', ')}`));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: fileFilter,
});

// Rich initial catalog with realistic sample datasets (first 10-20 records)
let datasetsCatalog = [
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

// Helper: Infer data type
function inferType(values) {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'String';

  let isInt = true;
  let isFloat = true;
  let isBool = true;

  for (const v of nonNull.slice(0, 50)) {
    const s = String(v).trim().toLowerCase();
    if (!['true', 'false', '0', '1', 'yes', 'no'].includes(s)) isBool = false;
    if (!/^-?\d+$/.test(s)) isInt = false;
    if (!/^-?\d+(\.\d+)?$/.test(s)) isFloat = false;
  }

  if (isBool) return 'Boolean';
  if (isInt) return 'Integer';
  if (isFloat) return 'Float';
  return 'String';
}

// Helper: Parse CSV
function parseCSV(content, delimiter = ',') {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], columns: [], rows: [], totalRows: 0 };

  const splitLine = (text) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"' || char === "'") inQuotes = !inQuotes;
      else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  const headers = splitLine(lines[0]);
  const rows = [];
  for (const line of lines.slice(1, 101)) {
    const values = splitLine(line);
    const obj = {};
    headers.forEach((h, idx) => {
      let rawVal = values[idx] !== undefined ? values[idx] : '';
      if (/^-?\d+$/.test(rawVal)) {
        obj[h] = parseInt(rawVal, 10);
      } else if (/^-?\d+(\.\d+)?$/.test(rawVal)) {
        obj[h] = parseFloat(rawVal);
      } else {
        obj[h] = rawVal;
      }
    });
    rows.push(obj);
  }

  const columns = headers.map((h) => {
    const colVals = rows.map((r) => r[h]);
    return {
      name: h,
      type: inferType(colVals),
      missingCount: colVals.filter((v) => v === '' || v === null || v === undefined).length,
    };
  });

  return { headers, columns, rows, totalRows: lines.length - 1 };
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Nexora Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Get all datasets
app.get('/api/datasets', (req, res) => {
  res.json({
    success: true,
    total: datasetsCatalog.length,
    datasets: datasetsCatalog,
  });
});

// Get dataset by ID
app.get('/api/datasets/:id', (req, res) => {
  const { id } = req.params;
  const dataset = datasetsCatalog.find((d) => d.id === id || d.datasetId === id);
  if (!dataset) {
    return res.status(404).json({ success: false, message: 'Dataset not found.' });
  }
  res.json({
    success: true,
    dataset,
  });
});

// Get dataset preview (returns first 10-20 or requested limit rows)
app.get('/api/datasets/:id/preview', (req, res) => {
  const { id } = req.params;
  const dataset = datasetsCatalog.find((d) => d.id === id || d.datasetId === id);
  if (!dataset) {
    return res.status(404).json({ success: false, message: 'Dataset not found.' });
  }

  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const rows = (dataset.sampleRows || []).slice(0, limit);

  res.json({
    success: true,
    datasetId: dataset.id || dataset.datasetId,
    name: dataset.name,
    format: dataset.format,
    totalRows: dataset.rowCount,
    columns: dataset.columns,
    previewCount: rows.length,
    rows: rows,
  });
});

// Upload dataset endpoint
app.post('/api/datasets/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No dataset file provided in request.' });
    }

    const {
      name,
      description,
      format,
      delimiter = ',',
      tags,
      hasHeaders = 'true',
    } = req.body;

    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const fileSize = req.file.size;
    const fileExt = path.extname(originalName).toLowerCase();

    let parsed = { headers: [], columns: [], rows: [], totalRows: 0 };

    if (fileExt === '.csv' || fileExt === '.tsv') {
      const activeDelimiter = fileExt === '.tsv' ? '\t' : delimiter;
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      parsed = parseCSV(fileContent, activeDelimiter);
    } else if (fileExt === '.json') {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const rawJson = JSON.parse(fileContent);
      const arr = Array.isArray(rawJson) ? rawJson : rawJson.data || [rawJson];
      if (arr.length > 0 && typeof arr[0] === 'object') {
        const headers = Object.keys(arr[0]);
        parsed = {
          headers,
          columns: headers.map((h) => ({
            name: h,
            type: typeof arr[0][h] === 'number' ? 'Float' : typeof arr[0][h] === 'boolean' ? 'Boolean' : 'String',
            missingCount: 0,
          })),
          rows: arr.slice(0, 100),
          totalRows: arr.length,
        };
      }
    }

    // Parse tags array if passed as JSON string
    let parsedTags = ['Tabular'];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch {
        parsedTags = [String(tags)];
      }
    }

    const datasetId = `ds-${Date.now()}`;
    const detectedFormat = (format || fileExt.replace('.', '')).toUpperCase();

    const newDataset = {
      id: datasetId,
      datasetId: datasetId,
      name: name || originalName,
      description: description || 'Ingested via Nexora Dataset Upload API',
      format: detectedFormat,
      fileType: detectedFormat.toLowerCase(),
      sizeBytes: fileSize,
      fileSize: fileSize,
      rowCount: parsed.totalRows || parsed.rows.length,
      columnCount: parsed.columns.length,
      uploadedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'Ready',
      tags: parsedTags,
      columns: parsed.columns,
      sampleRows: parsed.rows.slice(0, 20),
      storagePath: filePath,
    };

    // Prepend to catalog
    datasetsCatalog.unshift(newDataset);

    return res.status(201).json({
      success: true,
      message: `Dataset "${newDataset.name}" successfully uploaded and indexed!`,
      dataset: newDataset,
    });
  } catch (error) {
    console.error('Upload processing error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while processing dataset upload.',
    });
  }
});

// Delete dataset endpoint
app.delete('/api/datasets/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = datasetsCatalog.length;
  datasetsCatalog = datasetsCatalog.filter((d) => d.id !== id && d.datasetId !== id);

  if (datasetsCatalog.length === initialLen) {
    return res.status(404).json({ success: false, message: 'Dataset not found.' });
  }

  res.json({ success: true, message: 'Dataset deleted successfully.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Nexora Backend API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
