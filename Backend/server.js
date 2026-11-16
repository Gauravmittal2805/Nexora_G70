const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth Routes (MongoDB backed)
app.use('/api/auth', authRoutes);

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

// Clean initial catalog: No preloaded mock datasets
let datasetsCatalog = [];

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
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;
  res.json({
    status: isDbConnected ? 'healthy' : 'degraded',
    service: 'Nexora Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      connected: isDbConnected,
      name: mongoose.connection.name || 'Nexora',
      host: mongoose.connection.host || '127.0.0.1'
    }
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

// Get paginated dataset preview: ?page=1&limit=10
app.get('/api/datasets/:id/preview', (req, res) => {
  const { id } = req.params;
  const dataset = datasetsCatalog.find((d) => d.id === id || d.datasetId === id);
  if (!dataset) {
    return res.status(404).json({ success: false, message: 'Dataset not found.' });
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit || req.query.pageSize, 10) || 10), 100);

  let allAvailableRows = dataset.sampleRows || [];

  // If local file exists, parse more rows for extended pagination
  if (dataset.storagePath && fs.existsSync(dataset.storagePath)) {
    try {
      const fileExt = path.extname(dataset.storagePath).toLowerCase();
      const fileContent = fs.readFileSync(dataset.storagePath, 'utf-8');
      if (fileExt === '.csv' || fileExt === '.tsv') {
        const delimiter = fileExt === '.tsv' ? '\t' : (dataset.delimiter || ',');
        const parsed = parseCSV(fileContent, delimiter);
        if (parsed.rows && parsed.rows.length > 0) {
          allAvailableRows = parsed.rows;
        }
      }
    } catch {
      // Fallback to sampleRows
    }
  }

  const totalAvailable = allAvailableRows.length;
  const totalPages = Math.max(1, Math.ceil(totalAvailable / limit));
  const validPage = Math.min(page, totalPages);
  const startIndex = (validPage - 1) * limit;
  const paginatedRows = allAvailableRows.slice(startIndex, startIndex + limit);

  return res.json({
    success: true,
    datasetId: dataset.id || dataset.datasetId,
    name: dataset.name,
    format: dataset.format,
    fileSizeBytes: dataset.sizeBytes,
    totalRows: dataset.rowCount || totalAvailable,
    totalAvailableRows: totalAvailable,
    columns: dataset.columns,
    pagination: {
      page: validPage,
      limit,
      totalPages,
      totalCount: totalAvailable,
      hasNextPage: validPage < totalPages,
      hasPrevPage: validPage > 1,
    },
    previewCount: paginatedRows.length,
    rows: paginatedRows,
  });
});

// Get comprehensive dataset profiling statistics and column metadata
app.get('/api/datasets/:id/profile', (req, res) => {
  const { id } = req.params;
  const dataset = datasetsCatalog.find((d) => d.id === id || d.datasetId === id);
  if (!dataset) {
    return res.status(404).json({ success: false, message: 'Dataset not found.' });
  }

  const rows = dataset.sampleRows || [];
  const rowCount = dataset.rowCount || rows.length || 0;
  const columns = dataset.columns || [];
  const columnCount = columns.length;

  let totalMissingCells = 0;
  const profiledColumns = columns.map((col, idx) => {
    const colName = col.name;
    const colType = col.type || col.dataType || 'String';

    let nullCount =
      typeof col.missingCount === 'number'
        ? col.missingCount
        : typeof col.nullCount === 'number'
        ? col.nullCount
        : 0;
    if (nullCount === 0 && rows.length > 0) {
      nullCount = rows.filter(
        (r) => r[colName] === null || r[colName] === undefined || r[colName] === ''
      ).length;
    }
    totalMissingCells += nullCount;

    const values = rows
      .map((r) => r[colName])
      .filter((v) => v !== null && v !== undefined && v !== '');
    const distinctSet = new Set(values.map(String));
    const sampleValues =
      col.sampleValues && col.sampleValues.length > 0
        ? col.sampleValues
        : Array.from(distinctSet).slice(0, 5);

    let min = null,
      max = null,
      mean = null;
    if (colType === 'Integer' || colType === 'Float' || colType === 'number') {
      const numVals = values.map(Number).filter((v) => !isNaN(v));
      if (numVals.length > 0) {
        min = Math.min(...numVals);
        max = Math.max(...numVals);
        mean = Number((numVals.reduce((a, b) => a + b, 0) / numVals.length).toFixed(2));
      }
    }

    const missingPercentage =
      rowCount > 0 ? Number(((nullCount / rowCount) * 100).toFixed(1)) : 0;

    return {
      id: idx + 1,
      name: colName,
      dataType: colType,
      nullCount,
      missingCount: nullCount,
      missingPercentage,
      distinctCount: distinctSet.size,
      sampleValues,
      stats: { min, max, mean },
    };
  });

  const totalCells = rowCount * columnCount;
  const completenessScore =
    totalCells > 0
      ? Math.max(
          0,
          Math.min(100, Math.round(((totalCells - totalMissingCells) / totalCells) * 100))
        )
      : 100;
  const columnsWithMissing = profiledColumns.filter((c) => c.nullCount > 0).length;

  const typeCounts = profiledColumns.reduce((acc, c) => {
    const t = String(c.dataType).toLowerCase();
    if (t.includes('int') || t.includes('float') || t === 'number')
      acc.numeric = (acc.numeric || 0) + 1;
    else if (t.includes('cat')) acc.categorical = (acc.categorical || 0) + 1;
    else if (t.includes('date') || t.includes('time')) acc.datetime = (acc.datetime || 0) + 1;
    else if (t.includes('bool')) acc.boolean = (acc.boolean || 0) + 1;
    else acc.text = (acc.text || 0) + 1;
    return acc;
  }, {});

  return res.json({
    success: true,
    profile: {
      datasetId: dataset.id || dataset.datasetId,
      name: dataset.name,
      fileName: dataset.fileName || dataset.name,
      format: dataset.format,
      fileSizeBytes: dataset.sizeBytes || 0,
      rowCount,
      columnCount,
      totalCells,
      totalMissingCells,
      completenessScore,
      columnsWithMissing,
      cleanColumnsCount: columnCount - columnsWithMissing,
      typeCounts,
      createdAt: dataset.uploadedAt || dataset.createdAt || new Date().toISOString(),
      status: dataset.status || 'Ready',
      tags: dataset.tags || ['Tabular'],
      columns: profiledColumns,
      previewRows: rows.slice(0, 20),
    },
  });
});

// Get field mapping for dataset
app.get('/api/datasets/:id/mapping', (req, res) => {
  const { id } = req.params;
  const dataset = datasetsCatalog.find((d) => d.id === id || d.datasetId === id);
  if (!dataset) {
    return res.status(404).json({ success: false, message: 'Dataset not found.' });
  }

  return res.json({
    success: true,
    datasetId: dataset.id || dataset.datasetId,
    name: dataset.name,
    columns: dataset.columns,
    mapping: dataset.mapping || {
      target: '',
      id: '',
      numerical: [],
      categorical: [],
      datetime: [],
      ignored: [],
    },
  });
});

// Save field mapping for dataset
app.post('/api/datasets/:id/mapping', (req, res) => {
  const { id } = req.params;
  const dataset = datasetsCatalog.find((d) => d.id === id || d.datasetId === id);
  if (!dataset) {
    return res.status(404).json({ success: false, message: 'Dataset not found.' });
  }

  const { mapping } = req.body;
  if (!mapping || typeof mapping !== 'object') {
    return res.status(400).json({ success: false, message: 'Invalid mapping object provided.' });
  }

  dataset.mapping = {
    target: mapping.target || '',
    id: mapping.id || '',
    numerical: Array.isArray(mapping.numerical) ? mapping.numerical : [],
    categorical: Array.isArray(mapping.categorical) ? mapping.categorical : [],
    datetime: Array.isArray(mapping.datetime) ? mapping.datetime : [],
    ignored: Array.isArray(mapping.ignored) ? mapping.ignored : [],
    updatedAt: new Date().toISOString(),
  };

  return res.json({
    success: true,
    message: `Field mapping saved successfully for "${dataset.name}".`,
    mapping: dataset.mapping,
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

    // Default heuristic mapping
    const colNames = parsed.columns.map((c) => c.name);
    const targetGuess = colNames.find((n) => /churn|target|label|price|status|alert|fraud/i.test(n)) || '';
    const idGuess = colNames.find((n) => /id$|^id|_id$/i.test(n)) || '';
    const numCols = parsed.columns
      .filter((c) => (c.type === 'Integer' || c.type === 'Float') && c.name !== idGuess && c.name !== targetGuess)
      .map((c) => c.name);
    const catCols = parsed.columns
      .filter((c) => (c.type === 'Categorical' || c.type === 'String') && c.name !== idGuess && c.name !== targetGuess)
      .map((c) => c.name);

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
      sampleRows: parsed.rows.slice(0, 50),
      storagePath: filePath,
      mapping: {
        target: targetGuess,
        id: idGuess,
        numerical: numCols,
        categorical: catCols,
        datetime: [],
        ignored: [],
      },
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
