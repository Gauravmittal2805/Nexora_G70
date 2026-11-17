const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Dataset = require('../models/Dataset');
const { parseCsvStream, parseJsonStream } = require('../utils/streamParsers');
const { uploadDatasetFile, getDownloadUrl, deleteDatasetFile, LOCAL_STORAGE_DIR } = require('../utils/b2Storage');
const { profileDataset, profileInMemoryRecords } = require('../utils/datasetProfiler');
const { validateFieldMappings } = require('../utils/mappingValidator');

/**
 * Helper to find a dataset by either its custom datasetId (UUID) or Mongo _id
 * STRICTLY restricted by userId to ensure user isolation.
 */
const SAMPLE_DATASETS = [
  {
    datasetId: 'ds-churn-101',
    name: 'Customer_Churn_Analysis.csv',
    fileName: 'Customer_Churn_Analysis.csv',
    description: 'Telecom customer behavior and subscription dataset for churn prediction modeling.',
    fileType: 'csv',
    fileSize: 142850,
    storageUrl: 'https://s3.us-west-004.backblazeb2.com/nexora-datasets/datasets/sample/Customer_Churn_Analysis.csv',
    status: 'ready',
    tags: ['Telecom', 'Classification', 'Tabular'],
    storage: { provider: 'backblaze_b2', bucket: 'nexora-datasets', key: 'datasets/sample/Customer_Churn_Analysis.csv' },
    metadata: {
      rowCount: 2500,
      columnCount: 8,
      delimiter: ',',
      columns: [
        { name: 'CustomerID', dataType: 'string', nullCount: 0, sampleValues: ['CUST-7021', 'CUST-8842'] },
        { name: 'Age', dataType: 'number', nullCount: 0, sampleValues: [34, 52] },
        { name: 'Gender', dataType: 'string', nullCount: 0, sampleValues: ['Female', 'Male'] },
        { name: 'Tenure_Months', dataType: 'number', nullCount: 2, sampleValues: [12, 48] },
        { name: 'Monthly_Charges', dataType: 'number', nullCount: 0, sampleValues: [65.4, 98.2] },
        { name: 'Total_Charges', dataType: 'number', nullCount: 1, sampleValues: [784.8, 4713.6] },
        { name: 'Contract_Type', dataType: 'string', nullCount: 0, sampleValues: ['Month-to-month', 'Two year'] },
        { name: 'Churn', dataType: 'boolean', nullCount: 0, sampleValues: ['No', 'Yes'] }
      ]
    },
    previewData: [
      { CustomerID: 'CUST-7021', Age: 34, Gender: 'Female', Tenure_Months: 12, Monthly_Charges: 65.4, Total_Charges: 784.8, Contract_Type: 'Month-to-month', Churn: 'No' },
      { CustomerID: 'CUST-8842', Age: 52, Gender: 'Male', Tenure_Months: 48, Monthly_Charges: 98.2, Total_Charges: 4713.6, Contract_Type: 'Two year', Churn: 'No' },
      { CustomerID: 'CUST-1094', Age: 29, Gender: 'Female', Tenure_Months: 3, Monthly_Charges: 79.85, Total_Charges: 239.55, Contract_Type: 'Month-to-month', Churn: 'Yes' },
      { CustomerID: 'CUST-4501', Age: 41, Gender: 'Male', Tenure_Months: 24, Monthly_Charges: 54.1, Total_Charges: 1298.4, Contract_Type: 'One year', Churn: 'No' },
      { CustomerID: 'CUST-9018', Age: 63, Gender: 'Female', Tenure_Months: 8, Monthly_Charges: 104.9, Total_Charges: 839.2, Contract_Type: 'Month-to-month', Churn: 'Yes' },
      { CustomerID: 'CUST-2231', Age: 38, Gender: 'Male', Tenure_Months: 36, Monthly_Charges: 45.0, Total_Charges: 1620.0, Contract_Type: 'One year', Churn: 'No' },
      { CustomerID: 'CUST-3189', Age: 47, Gender: 'Female', Tenure_Months: 60, Monthly_Charges: 112.5, Total_Charges: 6750.0, Contract_Type: 'Two year', Churn: 'No' },
      { CustomerID: 'CUST-5512', Age: 23, Gender: 'Male', Tenure_Months: 2, Monthly_Charges: 85.3, Total_Charges: 170.6, Contract_Type: 'Month-to-month', Churn: 'Yes' },
      { CustomerID: 'CUST-6043', Age: 31, Gender: 'Female', Tenure_Months: 18, Monthly_Charges: 70.15, Total_Charges: 1262.7, Contract_Type: 'Month-to-month', Churn: 'No' },
      { CustomerID: 'CUST-7789', Age: 56, Gender: 'Male', Tenure_Months: 42, Monthly_Charges: 93.0, Total_Charges: 3906.0, Contract_Type: 'One year', Churn: 'No' },
      { CustomerID: 'CUST-8102', Age: 45, Gender: 'Female', Tenure_Months: 15, Monthly_Charges: 62.5, Total_Charges: 937.5, Contract_Type: 'Month-to-month', Churn: 'No' },
      { CustomerID: 'CUST-9423', Age: 39, Gender: 'Male', Tenure_Months: 7, Monthly_Charges: 88.75, Total_Charges: 621.25, Contract_Type: 'Month-to-month', Churn: 'Yes' },
      { CustomerID: 'CUST-3310', Age: 61, Gender: 'Female', Tenure_Months: 54, Monthly_Charges: 108.2, Total_Charges: 5842.8, Contract_Type: 'Two year', Churn: 'No' },
      { CustomerID: 'CUST-4112', Age: 27, Gender: 'Male', Tenure_Months: 5, Monthly_Charges: 49.9, Total_Charges: 249.5, Contract_Type: 'Month-to-month', Churn: 'No' },
      { CustomerID: 'CUST-5678', Age: 35, Gender: 'Female', Tenure_Months: 29, Monthly_Charges: 75.4, Total_Charges: 2186.6, Contract_Type: 'One year', Churn: 'No' },
      { CustomerID: 'CUST-6901', Age: 49, Gender: 'Male', Tenure_Months: 11, Monthly_Charges: 91.1, Total_Charges: 1002.1, Contract_Type: 'Month-to-month', Churn: 'Yes' },
      { CustomerID: 'CUST-7234', Age: 33, Gender: 'Female', Tenure_Months: 22, Monthly_Charges: 58.0, Total_Charges: 1276.0, Contract_Type: 'One year', Churn: 'No' },
      { CustomerID: 'CUST-8890', Age: 58, Gender: 'Male', Tenure_Months: 66, Monthly_Charges: 119.45, Total_Charges: 7883.7, Contract_Type: 'Two year', Churn: 'No' },
      { CustomerID: 'CUST-9124', Age: 42, Gender: 'Female', Tenure_Months: 19, Monthly_Charges: 73.2, Total_Charges: 1390.8, Contract_Type: 'Month-to-month', Churn: 'No' },
      { CustomerID: 'CUST-9582', Age: 26, Gender: 'Male', Tenure_Months: 4, Monthly_Charges: 81.6, Total_Charges: 326.4, Contract_Type: 'Month-to-month', Churn: 'Yes' }
    ]
  },
  {
    datasetId: 'ds-financial-404',
    name: 'Global_Financial_Metrics.csv',
    fileName: 'Global_Financial_Metrics.csv',
    description: 'Corporate valuation, balance sheet ratios, and market performance metrics across global equities.',
    fileType: 'csv',
    fileSize: 512400,
    storageUrl: 'https://s3.us-west-004.backblazeb2.com/nexora-datasets/datasets/sample/Global_Financial_Metrics.csv',
    status: 'ready',
    tags: ['Finance', 'Multi-Column', 'Valuation'],
    storage: { provider: 'backblaze_b2', bucket: 'nexora-datasets', key: 'datasets/sample/Global_Financial_Metrics.csv' },
    metadata: {
      rowCount: 3800,
      columnCount: 8,
      delimiter: ',',
      columns: [
        { name: 'Company_ID', dataType: 'string', nullCount: 0, sampleValues: ['EQ-001'] },
        { name: 'Ticker', dataType: 'string', nullCount: 0, sampleValues: ['NVDA'] },
        { name: 'Sector', dataType: 'string', nullCount: 0, sampleValues: ['Technology'] },
        { name: 'Market_Cap_B', dataType: 'number', nullCount: 0, sampleValues: [3250.4] },
        { name: 'PE_Ratio', dataType: 'number', nullCount: 0, sampleValues: [58.2] },
        { name: 'Debt_to_Equity', dataType: 'number', nullCount: 0, sampleValues: [0.42] },
        { name: 'ESG_Score', dataType: 'number', nullCount: 0, sampleValues: [84] },
        { name: 'Outperform', dataType: 'boolean', nullCount: 0, sampleValues: [true] }
      ]
    },
    previewData: [
      { Company_ID: 'EQ-001', Ticker: 'NVDA', Sector: 'Technology', Market_Cap_B: 3250.4, PE_Ratio: 58.2, Debt_to_Equity: 0.42, ESG_Score: 84, Outperform: true },
      { Company_ID: 'EQ-002', Ticker: 'MSFT', Sector: 'Technology', Market_Cap_B: 3100.8, PE_Ratio: 34.6, Debt_to_Equity: 0.38, ESG_Score: 89, Outperform: true },
      { Company_ID: 'EQ-003', Ticker: 'TSM', Sector: 'Technology', Market_Cap_B: 890.5, PE_Ratio: 24.1, Debt_to_Equity: 0.28, ESG_Score: 78, Outperform: true },
      { Company_ID: 'EQ-004', Ticker: 'JNJ', Sector: 'Healthcare', Market_Cap_B: 385.2, PE_Ratio: 16.8, Debt_to_Equity: 0.52, ESG_Score: 82, Outperform: false },
      { Company_ID: 'EQ-005', Ticker: 'ASML', Sector: 'Technology', Market_Cap_B: 320.1, PE_Ratio: 41.5, Debt_to_Equity: 0.35, ESG_Score: 91, Outperform: true },
      { Company_ID: 'EQ-006', Ticker: 'XOM', Sector: 'Energy', Market_Cap_B: 475.6, PE_Ratio: 13.4, Debt_to_Equity: 0.18, ESG_Score: 64, Outperform: false },
      { Company_ID: 'EQ-007', Ticker: 'SAP', Sector: 'Technology', Market_Cap_B: 260.4, PE_Ratio: 37.8, Debt_to_Equity: 0.44, ESG_Score: 87, Outperform: true },
      { Company_ID: 'EQ-008', Ticker: 'NVO', Sector: 'Healthcare', Market_Cap_B: 540.2, PE_Ratio: 42.1, Debt_to_Equity: 0.22, ESG_Score: 85, Outperform: true },
      { Company_ID: 'EQ-009', Ticker: 'JPM', Sector: 'Financials', Market_Cap_B: 610.5, PE_Ratio: 12.2, Debt_to_Equity: 1.25, ESG_Score: 76, Outperform: true },
      { Company_ID: 'EQ-010', Ticker: 'TM', Sector: 'Consumer', Market_Cap_B: 295.8, PE_Ratio: 9.8, Debt_to_Equity: 1.1, ESG_Score: 73, Outperform: false }
    ]
  },
  {
    datasetId: 'ds-iot-303',
    name: 'IoT_Telemetry_Sensors.json',
    fileName: 'IoT_Telemetry_Sensors.json',
    description: 'Industrial sensor telemetry streams capturing environmental metrics and anomaly flags.',
    fileType: 'json',
    fileSize: 96420,
    storageUrl: 'https://s3.us-west-004.backblazeb2.com/nexora-datasets/datasets/sample/IoT_Telemetry_Sensors.json',
    status: 'ready',
    tags: ['IoT', 'Time Series', 'Anomalies'],
    storage: { provider: 'backblaze_b2', bucket: 'nexora-datasets', key: 'datasets/sample/IoT_Telemetry_Sensors.json' },
    metadata: {
      rowCount: 1800,
      columnCount: 6,
      delimiter: null,
      columns: [
        { name: 'device_id', dataType: 'string', nullCount: 0, sampleValues: ['DEV-101'] },
        { name: 'temperature_c', dataType: 'number', nullCount: 0, sampleValues: [22.4] },
        { name: 'humidity_pct', dataType: 'number', nullCount: 0, sampleValues: [45.2] },
        { name: 'pressure_kpa', dataType: 'number', nullCount: 0, sampleValues: [101.3] },
        { name: 'status', dataType: 'string', nullCount: 0, sampleValues: ['ONLINE'] },
        { name: 'alert', dataType: 'boolean', nullCount: 0, sampleValues: [false] }
      ]
    },
    previewData: [
      { device_id: 'DEV-101', temperature_c: 22.4, humidity_pct: 45.2, pressure_kpa: 101.3, status: 'ONLINE', alert: false },
      { device_id: 'DEV-102', temperature_c: 28.1, humidity_pct: 60.5, pressure_kpa: 100.8, status: 'ONLINE', alert: false },
      { device_id: 'DEV-103', temperature_c: 35.8, humidity_pct: 82.0, pressure_kpa: 98.4, status: 'WARNING', alert: true },
      { device_id: 'DEV-104', temperature_c: 19.5, humidity_pct: 40.1, pressure_kpa: 102.1, status: 'ONLINE', alert: false },
      { device_id: 'DEV-105', temperature_c: 39.2, humidity_pct: 88.4, pressure_kpa: 97.9, status: 'CRITICAL', alert: true },
      { device_id: 'DEV-106', temperature_c: 21.8, humidity_pct: 48.0, pressure_kpa: 101.5, status: 'ONLINE', alert: false },
      { device_id: 'DEV-107', temperature_c: 24.3, humidity_pct: 52.6, pressure_kpa: 101.0, status: 'ONLINE', alert: false },
      { device_id: 'DEV-108', temperature_c: 31.7, humidity_pct: 71.4, pressure_kpa: 99.2, status: 'WARNING', alert: true },
      { device_id: 'DEV-109', temperature_c: 20.1, humidity_pct: 43.8, pressure_kpa: 101.8, status: 'ONLINE', alert: false },
      { device_id: 'DEV-110', temperature_c: 23.5, humidity_pct: 50.2, pressure_kpa: 101.2, status: 'ONLINE', alert: false }
    ]
  }
];

/**
 * Helper to query a dataset by datasetId (UUID) or Mongo _id
 */
const findDataset = async (id, userId = null) => {
  // If MongoDB connection is active
  if (mongoose.connection.readyState === 1) {
    const conditions = [{ datasetId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      conditions.push({ _id: id });
    }

    const query = { $or: conditions };
    if (userId) {
      // If user scoped, find matching user or datasets without explicit user
      query.$and = [
        { $or: [{ userId }, { userId: { $exists: false } }, { userId: null }] }
      ];
    }

    const found = await Dataset.findOne(query);
    if (found) return found;
  }

  // Fallback to sample catalog
  return SAMPLE_DATASETS.find(d => d.datasetId === id || d.id === id) || null;
};

const findUserDataset = findDataset;

/**
 * Format a dataset document for API responses
 */
const formatDatasetResponse = (d) => {
  const doc = d.toObject ? d.toObject() : d;
  const id = doc.datasetId || doc.id || String(doc._id || '');
  return {
    id,
    datasetId: id,
    _id: doc._id || id,
    name: doc.name || doc.fileName,
    fileName: doc.fileName || doc.name,
    description: doc.description || '',
    format: (doc.fileType || 'csv').toUpperCase(),
    fileType: (doc.fileType || 'csv').toLowerCase(),
    fileSize: doc.fileSize || doc.sizeBytes || 0,
    sizeBytes: doc.fileSize || doc.sizeBytes || 0,
    storageUrl: doc.storageUrl || '',
    storage: doc.storage || { provider: 'backblaze_b2' },
    status: doc.status || 'ready',
    tags: doc.tags || ['Tabular'],
    rowCount: doc.metadata?.rowCount || doc.rowCount || 0,
    columnCount: doc.metadata?.columnCount || doc.columnCount || 0,
    columns: doc.metadata?.columns || doc.columns || [],
    metadata: doc.metadata || {
      rowCount: doc.rowCount || 0,
      columnCount: doc.columnCount || 0,
      columns: doc.columns || [],
      delimiter: doc.delimiter || ','
    },
    mapping: doc.mapping || null,
    createdAt: doc.createdAt || new Date().toISOString(),
    uploadedAt: doc.createdAt || doc.uploadedAt || new Date().toISOString()
  };
};

/**
 * @desc    Upload CSV/JSON file to Backblaze B2 and save storage URL in MongoDB
 * @route   POST /api/datasets/upload
 * @access  Private (Authenticated users only)
 */
const uploadDataset = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a CSV or JSON file to upload'
    });
  }

  const tempFilePath = req.file.path;
  const fileName = req.file.originalname;
  const ext = path.extname(fileName).toLowerCase();
  const fileSize = req.file.size;
  const mimeType = req.file.mimetype;

  // Validate format (CSV or JSON only)
  let fileType;
  if (ext === '.csv') {
    fileType = 'csv';
  } else if (ext === '.json') {
    fileType = 'json';
  } else if (ext === '.jsonl') {
    fileType = 'jsonl';
  } else {
    if (fs.existsSync(tempFilePath)) {
      try { await fs.promises.unlink(tempFilePath); } catch {}
    }
    return res.status(400).json({
      success: false,
      message: 'Invalid file format. Only CSV and JSON files are supported.'
    });
  }

  const datasetId = `ds-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const datasetName = (req.body.name && req.body.name.trim()) || path.parse(fileName).name;
  const description = (req.body.description && req.body.description.trim()) || '';
  const userIdentifier = req.user ? String(req.user._id) : 'public';
  const storageKey = `datasets/${userIdentifier}/${Date.now()}_${path.basename(fileName)}`;

  // Parse tags if provided
  let tags = ['Tabular'];
  if (req.body.tags) {
    if (Array.isArray(req.body.tags)) {
      tags = req.body.tags;
    } else if (typeof req.body.tags === 'string') {
      try {
        tags = JSON.parse(req.body.tags);
      } catch {
        tags = req.body.tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }
  }

  try {
    // 1. Stream-parse file to infer column types, compute row counts, and extract the first 20 preview rows
    let parseResult;
    if (fileType === 'csv') {
      parseResult = await parseCsvStream(tempFilePath, 20);
    } else {
      parseResult = await parseJsonStream(tempFilePath, fileType === 'jsonl', 20);
    }

    // 2. Perform deep dataset profiling (data types, missing/null counts, unique values)
    let profileResult = null;
    try {
      profileResult = await profileDataset(tempFilePath, fileType);
      profileResult.profiledAt = new Date();
    } catch (profErr) {
      console.warn('Initial profiling warning (will fallback on demand):', profErr.message);
    }

    // 3. Upload file to Backblaze B2 (or local fallback storage)
    const storageResult = await uploadDatasetFile({
      filePath: tempFilePath,
      key: storageKey,
      mimeType
    });

    // 4. Compute heuristic default field mapping
    const colNames = (parseResult.columns || []).map((c) => c.name);
    const targetGuess = colNames.find((n) => /churn|target|label|price|status|alert|fraud|outcome|class/i.test(n)) || '';
    const idGuess = colNames.find((n) => /id$|^id|_id$/i.test(n)) || '';
    const numCols = (parseResult.columns || [])
      .filter((c) => c.dataType === 'number' && c.name !== idGuess && c.name !== targetGuess)
      .map((c) => c.name);
    const catCols = (parseResult.columns || [])
      .filter((c) => (c.dataType === 'string' || c.dataType === 'boolean') && c.name !== idGuess && c.name !== targetGuess)
      .map((c) => c.name);

    const defaultMapping = {
      target: targetGuess,
      id: idGuess,
      numerical: numCols,
      categorical: catCols,
      datetime: [],
      ignored: []
    };

    // 5. Create Dataset document in MongoDB bound to req.user._id
    const dataset = await Dataset.create({
      datasetId,
      userId: req.user ? req.user._id : undefined,
      fileName,
      fileType,
      fileSize,
      storageUrl: storageResult.storageUrl,
      name: datasetName,
      description,
      mimeType,
      storage: {
        provider: storageResult.provider,
        bucket: storageResult.bucket,
        key: storageResult.key,
        localPath: storageResult.localPath,
        eTag: storageResult.eTag
      },
      status: 'ready',
      metadata: {
        rowCount: parseResult.rowCount,
        columnCount: parseResult.columnCount,
        columns: parseResult.columns,
        delimiter: parseResult.delimiter || ','
      },
      previewData: parseResult.previewData,
      tags,
      mapping: defaultMapping,
      profile: profileResult,
      createdAt: new Date()
    });

    // 6. Clean up temporary multer spool file
    if (fs.existsSync(tempFilePath)) {
      await fs.promises.unlink(tempFilePath).catch(() => {});
    }

    const formattedDataset = {
      id: dataset.datasetId,
      datasetId: dataset.datasetId,
      userId: dataset.userId,
      name: dataset.name,
      fileName: dataset.fileName,
      description: dataset.description,
      format: dataset.fileType.toUpperCase(),
      fileType: dataset.fileType,
      sizeBytes: dataset.fileSize,
      fileSize: dataset.fileSize,
      rowCount: dataset.metadata.rowCount,
      columnCount: dataset.metadata.columnCount,
      columns: (dataset.metadata.columns || []).map((c) => ({
        name: c.name,
        type: c.dataType === 'number' ? 'Float' : c.dataType === 'boolean' ? 'Boolean' : 'String',
        missingCount: c.nullCount || 0
      })),
      storageUrl: dataset.storageUrl,
      createdAt: dataset.createdAt,
      uploadedAt: dataset.createdAt,
      metadata: dataset.metadata,
      tags: dataset.tags,
      status: 'Ready',
      mapping: dataset.mapping
    };

    return res.status(201).json({
      success: true,
      message: 'Dataset uploaded and saved successfully',
      dataset: formattedDataset,
      data: formattedDataset
    });
  } catch (error) {
    if (fs.existsSync(tempFilePath)) {
      try { await fs.promises.unlink(tempFilePath); } catch {}
    }

    console.error('Dataset Upload Error:', error);
    const isMalformed = error.message && (
      error.message.includes('Malformed') ||
      error.message.includes('Parsing failed') ||
      error.message.includes('CSV Parsing failed')
    );

    return res.status(isMalformed ? 400 : 500).json({
      success: false,
      message: `Failed to process and upload dataset: ${error.message}`
    });
  }
};

/**
 * @desc    Fetch uploaded datasets from MongoDB (with pagination, search, and filtering)
 * @route   GET /api/datasets
 * @access  Private (User can only access their own datasets)
 */
const getDatasets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const skip = (page - 1) * limit;

    let totalCount = 0;
    let datasets = [];

    if (mongoose.connection.readyState === 1) {
      const query = {};

      if (req.user) {
        query.$or = [
          { userId: req.user._id },
          { userId: { $exists: false } },
          { userId: null }
        ];
      }

      if (req.query.fileType) {
        query.fileType = req.query.fileType.toLowerCase();
      }

      if (req.query.status) {
        query.status = req.query.status.toLowerCase();
      }

      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search.trim(), 'i');
        query.$or = [
          { fileName: searchRegex },
          { name: searchRegex },
          { description: searchRegex },
          { tags: searchRegex }
        ];
      }

      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      const sort = { [sortBy]: sortOrder };

      totalCount = await Dataset.countDocuments(query);

      // If database is empty, seed or return initial sample datasets
      if (totalCount === 0 && !req.query.search && !req.query.fileType) {
        datasets = SAMPLE_DATASETS;
        totalCount = SAMPLE_DATASETS.length;
      } else {
        const dbDatasets = await Dataset.find(query)
          .select('-previewData')
          .sort(sort)
          .skip(skip)
          .limit(limit);

        datasets = dbDatasets.map(formatDatasetResponse);
      }
    } else {
      // Fallback to sample catalog if MongoDB offline
      datasets = SAMPLE_DATASETS.map(formatDatasetResponse);
      totalCount = datasets.length;
    }

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    const formatted = datasets.map((d) => ({
      id: d.datasetId,
      datasetId: d.datasetId,
      userId: d.userId,
      name: d.name || d.fileName,
      fileName: d.fileName,
      description: d.description || '',
      format: (d.fileType || 'csv').toUpperCase(),
      fileType: d.fileType,
      sizeBytes: d.fileSize,
      fileSize: d.fileSize,
      rowCount: d.metadata?.rowCount || 0,
      columnCount: d.metadata?.columnCount || 0,
      columns: (d.metadata?.columns || []).map((c) => ({
        name: c.name,
        type: c.dataType === 'number' ? 'Float' : c.dataType === 'boolean' ? 'Boolean' : 'String',
        missingCount: c.nullCount || 0
      })),
      storageUrl: d.storageUrl,
      createdAt: d.createdAt,
      uploadedAt: d.createdAt,
      tags: d.tags || [],
      status: 'Ready',
      mapping: d.mapping
    }));

    return res.status(200).json({
      success: true,
      total: totalCount,
      totalCount: totalCount,
      datasets: formatted,
      data: formatted,
      pagination: {
        currentPage: page,
        page,
        limit,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dataset details by datasetId or _id
 * @route   GET /api/datasets/:id
 * @access  Private (Restricted to dataset owner)
 */
const getDatasetById = async (req, res, next) => {
  try {
    const dataset = await findDataset(req.params.id, req.user ? req.user._id : null);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found.'
      });
    }

    const formatted = {
      id: dataset.datasetId,
      datasetId: dataset.datasetId,
      userId: dataset.userId,
      fileName: dataset.fileName,
      name: dataset.name || dataset.fileName,
      description: dataset.description,
      fileType: dataset.fileType,
      format: (dataset.fileType || 'csv').toUpperCase(),
      fileSize: dataset.fileSize,
      sizeBytes: dataset.fileSize,
      storageUrl: dataset.storageUrl,
      rowCount: dataset.metadata?.rowCount || 0,
      columnCount: dataset.metadata?.columnCount || 0,
      columns: (dataset.metadata?.columns || []).map((c) => ({
        name: c.name,
        type: c.dataType === 'number' ? 'Float' : c.dataType === 'boolean' ? 'Boolean' : 'String',
        missingCount: c.nullCount || 0
      })),
      createdAt: dataset.createdAt,
      uploadedAt: dataset.createdAt,
      tags: dataset.tags,
      status: 'Ready',
      mapping: dataset.mapping
    };

    return res.status(200).json({
      success: true,
      dataset: formatted,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Read CSV/JSON file using streaming with pagination and return requested preview records
 * @route   GET /api/datasets/:id/preview
 * @access  Private (Restricted to dataset owner)
 */
const getDatasetPreview = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const dataset = await findUserDataset(req.params.id, req.user ? req.user._id : null);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }

    const allRows = dataset.previewData || [];
    const totalAvailable = allRows.length;
    const totalPages = Math.max(1, Math.ceil(totalAvailable / limit));
    const validPage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (validPage - 1) * limit;
    const paginatedRows = allRows.slice(startIndex, startIndex + limit);

    return res.status(200).json({
      success: true,
      datasetId: dataset.datasetId,
      name: dataset.name || dataset.fileName,
      fileName: dataset.fileName,
      format: (dataset.fileType || 'csv').toUpperCase(),
      fileSizeBytes: dataset.fileSize,
      totalRows: dataset.metadata?.rowCount || totalAvailable,
      totalAvailableRows: totalAvailable,
      columns: (dataset.metadata?.columns || []).map((c) => ({
        name: c.name,
        type: c.dataType === 'number' ? 'Float' : c.dataType === 'boolean' ? 'Boolean' : 'String',
        missingCount: c.nullCount || 0
      })),
      pagination: {
        page: validPage,
        limit,
        totalPages,
        totalCount: totalAvailable,
        hasNextPage: validPage < totalPages,
        hasPrevPage: validPage > 1
      },
      previewCount: paginatedRows.length,
      rows: paginatedRows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dataset profiling results (Data types, missing counts, unique values, stats)
 * @route   GET /api/datasets/:id/profile
 * @access  Private (Restricted to dataset owner)
 */
const getDatasetProfile = async (req, res, next) => {
  try {
    const dataset = await findUserDataset(req.params.id, req.user ? req.user._id : null);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }

    const forceRefresh = req.query.refresh === 'true' || req.query.recompute === 'true';

    // If already profiled and no refresh is requested, return cached profile
    if (dataset.profile && !forceRefresh) {
      return res.status(200).json({
        success: true,
        datasetId: dataset.datasetId,
        fileName: dataset.fileName,
        name: dataset.name || dataset.fileName,
        fileType: dataset.fileType,
        fileSize: dataset.fileSize,
        ...dataset.profile
      });
    }

    // Compute profile from the dataset's stored file or preview data
    let profileResult = null;
    const localPath = dataset.storage?.localPath;

    if (localPath && fs.existsSync(localPath)) {
      profileResult = await profileDataset(localPath, dataset.fileType);
    } else if (dataset.previewData && dataset.previewData.length > 0) {
      profileResult = profileInMemoryRecords(dataset.previewData);
    } else {
      // Reconstruct fallback profile from metadata columns
      const totalRecs = dataset.metadata?.rowCount || 0;
      const cols = (dataset.metadata?.columns || []).map((c) => {
        const nulls = c.nullCount || 0;
        const nonNulls = Math.max(0, totalRecs - nulls);
        const typeMap = {
          number: 'Number',
          boolean: 'Boolean',
          date: 'Date',
          string: 'String'
        };
        const resolvedType = typeMap[c.dataType] || 'String';
        const sampleArr = c.sampleValues || [];

        return {
          name: c.name,
          dataType: resolvedType,
          totalRecords: totalRecs,
          nonNullCount: nonNulls,
          nullCount: nulls,
          missingCount: nulls,
          missingPercentage: totalRecs > 0 ? Number(((nulls / totalRecs) * 100).toFixed(2)) : 0,
          distinctCount: sampleArr.length,
          isUnique: totalRecs > 0 && sampleArr.length === totalRecs,
          uniqueValues: sampleArr.slice(0, 50),
          uniqueValuesCount: Math.min(sampleArr.length, 50),
          hasMoreUniqueValues: sampleArr.length > 50,
          stats: {},
          sampleValues: sampleArr.slice(0, 5)
        };
      });

      let totalMissing = 0;
      const typeSummary = { String: 0, Number: 0, Boolean: 0, Date: 0 };
      cols.forEach((col) => {
        totalMissing += col.missingCount;
        typeSummary[col.dataType] = (typeSummary[col.dataType] || 0) + 1;
      });

      profileResult = {
        totalRecords: totalRecs,
        totalColumns: cols.length,
        columns: cols,
        summary: {
          totalRecords: totalRecs,
          totalColumns: cols.length,
          totalCells: totalRecs * cols.length,
          missingCells: totalMissing,
          overallMissingPercentage: totalRecs * cols.length > 0
            ? Number(((totalMissing / (totalRecs * cols.length)) * 100).toFixed(2))
            : 0,
          columnDataTypes: typeSummary
        }
      };
    }

    // Persist computed profile to document
    const finalProfile = {
      ...profileResult,
      profiledAt: new Date().toISOString()
    };
    dataset.profile = finalProfile;
    await dataset.save();

    return res.status(200).json({
      success: true,
      datasetId: dataset.datasetId,
      fileName: dataset.fileName,
      name: dataset.name || dataset.fileName,
      fileType: dataset.fileType,
      fileSize: dataset.fileSize,
      ...finalProfile
    });
  } catch (error) {
    console.error('Dataset Profile API Error:', error);
    next(error);
  }
};

/**
 * Helper to extract standardized column definitions from dataset
 */
const extractDatasetColumns = (dataset) => {
  const rawCols = dataset.metadata?.columns || dataset.columns || [];
  return rawCols.map((c) => ({
    name: c.name,
    type: c.type || (c.dataType === 'number' ? 'Float' : c.dataType === 'boolean' ? 'Boolean' : c.dataType === 'date' ? 'DateTime' : 'String'),
    dataType: c.dataType || 'string',
    nullCount: c.nullCount || c.missingCount || 0,
    missingCount: c.nullCount || c.missingCount || 0,
    sampleValues: c.sampleValues || []
  }));
};

/**
 * Normalizes, validates, and synchronizes Source-to-Target mapping structures
 */
const normalizeAndSyncMapping = (dataset, inputMapping = {}) => {
  const columns = extractDatasetColumns(dataset);
  const existingMapping = dataset.mapping || {};

  let fieldMappings = Array.isArray(inputMapping.fieldMappings)
    ? inputMapping.fieldMappings
    : Array.isArray(existingMapping.fieldMappings) && existingMapping.fieldMappings.length > 0
    ? existingMapping.fieldMappings
    : [];

  // If no fieldMappings, check if destinations or connections exist
  if (fieldMappings.length === 0) {
    const destinations = inputMapping.destinations || existingMapping.destinations || [];
    const connections = inputMapping.connections || existingMapping.connections || [];

    if (destinations.length > 0 || connections.length > 0) {
      fieldMappings = destinations.map((d) => {
        const conn = connections.find((c) => c.destField === d.name);
        return {
          id: d.id || `map-${d.name}`,
          targetField: d.name,
          sourceField: conn?.sourceField || '',
          targetType: d.type || 'String',
          required: Boolean(d.required),
          transformation: conn?.transformation || 'none',
          defaultValue: d.defaultValue || null
        };
      });
    } else {
      // Auto-initialize standard 1:1 mapping from source columns
      fieldMappings = columns.map((col) => {
        const isId = /^(id|customer_?id|_id|uuid|key)$/i.test(col.name);
        const isTarget = /^(target|label|churn|alert|status|outcome)$/i.test(col.name);
        return {
          id: `map-${col.name}`,
          targetField: col.name,
          sourceField: col.name,
          targetType: col.type || 'String',
          required: isId || isTarget,
          transformation: 'none',
          defaultValue: null
        };
      });
    }
  }

  // Sanitize field mappings
  fieldMappings = fieldMappings.map((m, idx) => ({
    id: m.id || `map-${m.targetField || idx}`,
    targetField: String(m.targetField || '').trim(),
    sourceField: String(m.sourceField || '').trim(),
    targetType: m.targetType || 'String',
    required: Boolean(m.required),
    transformation: m.transformation || 'none',
    defaultValue: m.defaultValue !== undefined ? m.defaultValue : null
  }));

  // Sync destinations
  const destinations = fieldMappings.map((m) => ({
    id: `dest-${m.targetField}`,
    name: m.targetField,
    type: m.targetType,
    required: m.required
  }));

  // Sync connections
  const connections = fieldMappings
    .filter((m) => m.sourceField)
    .map((m) => ({
      id: `conn-${m.sourceField}-${m.targetField}`,
      sourceField: m.sourceField,
      destField: m.targetField,
      transformation: m.transformation || 'none'
    }));

  // Derive standard ML mappings
  let target = inputMapping.target || existingMapping.target || '';
  let id = inputMapping.id || existingMapping.id || '';

  if (!target) {
    const targetMap = fieldMappings.find((m) => /^(target|label|churn|alert|status)$/i.test(m.targetField));
    if (targetMap && targetMap.sourceField) target = targetMap.sourceField;
  }
  if (!id) {
    const idMap = fieldMappings.find((m) => /id$|^id|_id$/i.test(m.targetField));
    if (idMap && idMap.sourceField) id = idMap.sourceField;
  }

  const numerical = fieldMappings
    .filter((m) => {
      const t = (m.targetType || '').toLowerCase();
      return (t === 'integer' || t === 'float' || t === 'number') && m.sourceField && m.sourceField !== target && m.sourceField !== id;
    })
    .map((m) => m.sourceField);

  const categorical = fieldMappings
    .filter((m) => {
      const t = (m.targetType || '').toLowerCase();
      return (t === 'string' || t === 'boolean') && m.sourceField && m.sourceField !== target && m.sourceField !== id && !numerical.includes(m.sourceField);
    })
    .map((m) => m.sourceField);

  const mappedSources = new Set(fieldMappings.filter((m) => m.sourceField).map((m) => m.sourceField));
  const ignored = columns.filter((c) => !mappedSources.has(c.name)).map((c) => c.name);

  // Run full validation
  const validation = validateFieldMappings(fieldMappings, columns);

  const fullMapping = {
    target,
    id,
    numerical,
    categorical,
    datetime: Array.isArray(inputMapping.datetime) ? inputMapping.datetime : (existingMapping.datetime || []),
    ignored,
    fieldMappings,
    destinations,
    connections,
    validationSummary: {
      isValid: validation.isValid,
      errorCount: validation.errorCount,
      warningCount: validation.warningCount
    },
    updatedAt: new Date()
  };

  return { columns, fieldMappings, destinations, connections, fullMapping, validation };
};

/**
 * @desc    Get field mapping for dataset
 * @route   GET /api/datasets/:id/mapping
 * @access  Private / Public
 */
const getFieldMapping = async (req, res, next) => {
  try {
    const dataset = await findDataset(req.params.id, req.user ? req.user._id : null);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }

    const { columns, fieldMappings, destinations, connections, fullMapping, validation } =
      normalizeAndSyncMapping(dataset, dataset.mapping || {});

    return res.status(200).json({
      success: true,
      datasetId: dataset.datasetId || dataset.id,
      name: dataset.name || dataset.fileName,
      fileName: dataset.fileName || dataset.name,
      fileSize: dataset.fileSize || dataset.sizeBytes || 0,
      rowCount: dataset.metadata?.rowCount || dataset.rowCount || 0,
      columnCount: dataset.metadata?.columnCount || dataset.columnCount || 0,
      format: (dataset.fileType || 'csv').toUpperCase(),
      columns,
      fieldMappings,
      destinations,
      connections,
      mapping: fullMapping,
      validation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Save/update dataset field mapping
 * @route   POST /api/datasets/:id/mapping
 * @access  Private / Public
 */
const saveFieldMapping = async (req, res, next) => {
  try {
    const dataset = await findDataset(req.params.id, req.user ? req.user._id : null);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }

    const mappingPayload = req.body.mapping || req.body;
    if (!mappingPayload || typeof mappingPayload !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid mapping object provided'
      });
    }

    const { columns, fieldMappings, destinations, connections, fullMapping, validation } =
      normalizeAndSyncMapping(dataset, mappingPayload);

    // If request specifies strict mode and has blocking errors
    if (req.query?.strict === 'true' && !validation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Field mapping validation failed with ${validation.errorCount} error(s).`,
        errors: validation.errors,
        warnings: validation.warnings,
        validation
      });
    }

    dataset.mapping = fullMapping;

    if (dataset.save && typeof dataset.save === 'function') {
      if (dataset.markModified) {
        dataset.markModified('mapping');
      }
      await dataset.save();
    }

    return res.status(200).json({
      success: true,
      message: `Field mapping saved successfully for "${dataset.name || dataset.fileName}".`,
      datasetId: dataset.datasetId || dataset.id,
      columns,
      fieldMappings,
      destinations,
      connections,
      mapping: fullMapping,
      validation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Validate field mapping against dataset schema
 * @route   POST /api/datasets/:id/mapping/validate
 * @access  Private / Public
 */
const validateMappingEndpoint = async (req, res, next) => {
  try {
    const dataset = await findDataset(req.params.id, req.user ? req.user._id : null);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found.'
      });
    }

    const mappingPayload = req.body.mapping || req.body || {};
    const { validation, fieldMappings, columns } = normalizeAndSyncMapping(dataset, mappingPayload);

    return res.status(200).json({
      success: true,
      datasetId: dataset.datasetId || dataset.id,
      isValid: validation.isValid,
      errorCount: validation.errorCount,
      warningCount: validation.warningCount,
      errors: validation.errors,
      warnings: validation.warnings,
      stats: validation.stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get download URL (presigned B2 or direct)
 * @route   GET /api/datasets/:id/download
 * @access  Private (Restricted to dataset owner)
 */
const getDatasetDownloadUrl = async (req, res, next) => {
  try {
    const dataset = await findDataset(req.params.id, req.user ? req.user._id : null);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found.'
      });
    }

    const downloadInfo = await getDownloadUrl({
      provider: dataset.storage?.provider,
      bucket: dataset.storage?.bucket,
      key: dataset.storage?.key,
      localPath: dataset.storage?.localPath,
      expiresIn: 300 // 5 minutes validity for presigned URL
    });

    return res.status(200).json({
      success: true,
      datasetId: dataset.datasetId || dataset.id,
      fileName: dataset.fileName,
      mimeType: dataset.mimeType || 'application/octet-stream',
      storageUrl: dataset.storageUrl,
      ...downloadInfo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete dataset record from MongoDB and delete object from Backblaze B2
 * @route   DELETE /api/datasets/:id
 * @access  Private (Restricted to dataset owner)
 */
const deleteDataset = async (req, res, next) => {
  try {
    const dataset = await findDataset(req.params.id, req.user ? req.user._id : null);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found.'
      });
    }

    // Delete file from Backblaze B2 bucket
    await deleteDatasetFile({
      provider: dataset.storage?.provider,
      bucket: dataset.storage?.bucket,
      key: dataset.storage?.key,
      localPath: dataset.storage?.localPath
    });

    // Delete record from MongoDB if model instance
    if (dataset.deleteOne) {
      await dataset.deleteOne();
    } else {
      const idx = SAMPLE_DATASETS.findIndex(d => d.datasetId === req.params.id || d.id === req.params.id);
      if (idx !== -1) SAMPLE_DATASETS.splice(idx, 1);
    }

    return res.status(200).json({
      success: true,
      message: 'Dataset deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Aliases for backward-compatibility
 */
const getDatasetMapping = getFieldMapping;
const saveDatasetMapping = saveFieldMapping;

/**
 * @desc    Apply transformations to a dataset's preview rows using configuration or field mapping
 * @route   POST /api/datasets/:id/transform
 * @access  Public / Private
 */
const transformDatasetRows = async (req, res, next) => {
  try {
    const dataset = await findDataset(req.params.id, req.user ? req.user._id : null);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found.'
      });
    }

    const { config, overrides, useMapping = true, rows: inputRows, projectToTarget = true } = req.body;

    // Use input rows if provided, or preview rows from dataset
    const rowsToTransform = inputRows || dataset.previewData || dataset.sampleRows || [];

    const fieldMappings = dataset.mapping?.fieldMappings;
    if (useMapping && Array.isArray(fieldMappings) && fieldMappings.length > 0 && projectToTarget) {
      const transformedRows = rowsToTransform.map((record) => {
        const out = {};
        for (const m of fieldMappings) {
          if (!m.targetField) continue;
          let val = m.sourceField ? record[m.sourceField] : undefined;
          if (val === undefined || val === null || val === '') {
            if (m.defaultValue !== undefined && m.defaultValue !== null && m.defaultValue !== '') {
              val = m.defaultValue;
            }
          }
          if (val !== undefined && val !== null) {
            const trans = (m.transformation || 'none').toLowerCase();
            if (trans === 'trim' && typeof val === 'string') val = val.trim();
            else if (trans === 'uppercase' && typeof val === 'string') val = String(val).toUpperCase();
            else if (trans === 'lowercase' && typeof val === 'string') val = String(val).toLowerCase();
            else if (trans === 'to_number') val = Number(val) || 0;
            else if (trans === 'to_boolean') val = Boolean(val === true || val === 'true' || val === 1 || val === 'yes' || val === '1');
          }
          out[m.targetField] = val !== undefined ? val : null;
        }
        return out;
      });

      return res.status(200).json({
        success: true,
        datasetId: dataset.datasetId || dataset.id,
        name: dataset.name || dataset.fileName,
        mode: 'source_to_target',
        count: transformedRows.length,
        rows: transformedRows
      });
    }

    let activeConfig;
    if (useMapping && dataset.mapping) {
      activeConfig = generateTransformConfigFromMapping(dataset.mapping, overrides || config || {});
    } else {
      activeConfig = config || {};
    }

    const transformedRows = transformDataset(rowsToTransform, activeConfig);

    return res.status(200).json({
      success: true,
      datasetId: dataset.datasetId || dataset.id,
      name: dataset.name || dataset.fileName,
      appliedConfig: activeConfig,
      count: transformedRows.length,
      rows: transformedRows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Transform a single record using provided configuration or mapping
 * @route   POST /api/datasets/transform/record
 * @access  Public / Private
 */
const transformRecordEndpoint = (req, res, next) => {
  try {
    const { record, config, mapping, overrides } = req.body;

    if (!record || typeof record !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid record object to transform.'
      });
    }

    let transformed;
    let appliedConfig;

    if (mapping) {
      appliedConfig = generateTransformConfigFromMapping(mapping, overrides || config || {});
      transformed = applyMappingAndTransformations(record, mapping, overrides || config || {});
    } else {
      appliedConfig = config || {};
      transformed = transformRecord(record, appliedConfig);
    }

    return res.status(200).json({
      success: true,
      appliedConfig,
      transformed
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDataset,
  getDatasets,
  getDatasetById,
  getDatasetPreview,
  getDatasetProfile,
  getFieldMapping,
  saveFieldMapping,
  getDatasetDownloadUrl,
  deleteDataset,
  getDatasetMapping,
  saveDatasetMapping,
  validateMappingEndpoint,
  transformDatasetRows,
  transformRecordEndpoint,
  SAMPLE_DATASETS
};
