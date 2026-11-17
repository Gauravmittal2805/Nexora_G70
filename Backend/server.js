const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const connectDB = require('./config/db');
const { verifyB2Connection, isB2Configured } = require('./config/s3Client');

const authRoutes = require('./routes/authRoutes');
const datasetRoutes = require('./routes/datasetRoutes');
const healthRoutes = require('./routes/healthRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB Database
connectDB();

// 2. Verify Backblaze B2 bucket connection on startup
if (isB2Configured()) {
  verifyB2Connection().then((status) => {
    if (status.connected) {
      console.log(`✅ Backblaze B2 Bucket Connected: "${status.bucket}" (${status.region})`);
    } else {
      console.warn(`⚠️ Backblaze B2 Connection Notice: ${status.message}`);
    }
  });
} else {
  console.log('ℹ️ Backblaze B2: Unconfigured in environment (Graceful local storage fallback active).');
}

// 3. Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static directory for uploaded datasets (when local storage fallback is used)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
    }
  });
});

// 4. Mount API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/datasets', datasetRoutes);
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

// Protected Dataset Routes (Requires JWT token, User-isolated datasets)
app.use('/api/datasets', datasetRoutes);

// Global Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Nexora Backend API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
