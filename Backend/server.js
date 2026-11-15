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

// In-memory / initial datasets
let datasetsCatalog = [
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
      obj[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(obj);
  }

  const columns = headers.map((h) => {
    const colVals = rows.map((r) => r[h]);
    return {
      name: h,
      type: inferType(colVals),
      missingCount: colVals.filter((v) => v === '' || v === null).length,
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
            type: typeof arr[0][h] === 'number' ? 'Float' : 'String',
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
    const newDataset = {
      id: datasetId,
      name: name || originalName,
      description: description || 'Ingested via Nexora Dataset Upload API',
      format: (format || fileExt.replace('.', '')).toUpperCase(),
      sizeBytes: fileSize,
      rowCount: parsed.totalRows || parsed.rows.length,
      columnCount: parsed.columns.length,
      uploadedAt: new Date().toISOString(),
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
  datasetsCatalog = datasetsCatalog.filter((d) => d.id !== id);

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
app.listen(PORT, () => {
  console.log(`Nexora Backend API running on http://localhost:${PORT}`);
});
