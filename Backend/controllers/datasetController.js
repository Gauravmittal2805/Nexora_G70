const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Dataset = require('../models/Dataset');
const { parseCsvStream, parseJsonStream, readPreviewRowsFromStream } = require('../utils/streamParsers');
const { uploadDatasetFile, getDownloadUrl, getDatasetFileStream, deleteDatasetFile, LOCAL_STORAGE_DIR } = require('../utils/b2Storage');
const { profileDataset, profileInMemoryRecords } = require('../utils/datasetProfiler');
const { validateFieldMappings } = require('../utils/mappingValidator');
const {
  transformRecord,
  transformDataset,
  normalizeConfig,
  generateTransformConfigFromMapping,
  applyMappingAndTransformations,
  convertValue,
  validateTransformationConfig,
} = require('../utils/transformationEngine');

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

function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0 || isNaN(bytes)) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format a dataset document for API responses with full metadata
 */
const formatDatasetResponse = (d) => {
  if (!d) return null;
  const doc = d.toObject ? d.toObject() : d;
  const id = doc.datasetId || doc.id || String(doc._id || '');
  const fileName = doc.fileName || doc.filename || doc.name || 'dataset.csv';
  const fileSize = Number(doc.fileSize ?? doc.sizeBytes ?? doc.metadata?.fileSize ?? 0);
  const fileType = (doc.fileType || doc.format || doc.metadata?.fileType || 'csv').toLowerCase();
  const format = fileType.toUpperCase();
  const rawDate = doc.createdAt || doc.uploadedAt || doc.metadata?.uploadDate || new Date();
  const uploadDate = (rawDate instanceof Date) ? rawDate.toISOString() : new Date(rawDate).toISOString();
  const mimeType = doc.mimeType || (fileType === 'csv' ? 'text/csv' : 'application/json');

  const rawColumns = doc.metadata?.columns || doc.columns || [];
  const normalizedColumns = rawColumns.map((c) => ({
    name: c.name,
    type: c.type || (c.dataType === 'number' ? 'Float' : c.dataType === 'boolean' ? 'Boolean' : c.dataType === 'date' ? 'DateTime' : 'String'),
    dataType: c.dataType || (c.type === 'Float' ? 'number' : c.type === 'Boolean' ? 'boolean' : 'string'),
    nullCount: c.nullCount || c.missingCount || 0,
    missingCount: c.missingCount || c.nullCount || 0,
    sampleValues: c.sampleValues || []
  }));

  const rowCount = doc.metadata?.rowCount ?? doc.rowCount ?? 0;
  const columnCount = doc.metadata?.columnCount ?? doc.columnCount ?? normalizedColumns.length;

  const metadata = {
    filename: fileName,
    fileName: fileName,
    fileSize: fileSize,
    fileSizeBytes: fileSize,
    sizeBytes: fileSize,
    formattedFileSize: formatBytes(fileSize),
    uploadDate,
    uploadedAt: uploadDate,
    createdAt: uploadDate,
    fileType,
    format,
    mimeType,
    rowCount,
    columnCount,
    columns: normalizedColumns,
    delimiter: doc.metadata?.delimiter || doc.delimiter || ','
  };

  return {
    id,
    datasetId: id,
    _id: doc._id || id,
    userId: doc.userId || null,
    name: doc.name || fileName,
    fileName,
    filename: fileName,
    description: doc.description || '',
    format,
    fileType,
    fileSize,
    fileSizeBytes: fileSize,
    sizeBytes: fileSize,
    formattedFileSize: formatBytes(fileSize),
    uploadDate,
    uploadedAt: uploadDate,
    createdAt: uploadDate,
    mimeType,
    storageUrl: doc.storageUrl || '',
    storage: doc.storage || { provider: 'backblaze_b2' },
    status: doc.status || 'ready',
    tags: doc.tags || ['Tabular'],
    rowCount,
    columnCount,
    columns: normalizedColumns,
    metadata,
    mapping: doc.mapping || null,
    profile: doc.profile || null
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

    const uploadTimestamp = new Date();
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
        filename: fileName,
        fileSize,
        uploadDate: uploadTimestamp,
        fileType,
        rowCount: parseResult.rowCount,
        columnCount: parseResult.columnCount,
        columns: parseResult.columns,
        delimiter: parseResult.delimiter || ','
      },
      previewData: parseResult.previewData,
      tags,
      mapping: defaultMapping,
      profile: profileResult,
      createdAt: uploadTimestamp
    });

    // 6. Clean up temporary multer spool file
    if (fs.existsSync(tempFilePath)) {
      await fs.promises.unlink(tempFilePath).catch(() => {});
    }

    const formattedDataset = formatDatasetResponse(dataset);

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
 *          When authenticated with JWT, automatically restricts results to datasets uploaded by the logged-in user.
 * @route   GET /api/datasets
 * @access  Public / Private (Filtered to logged-in user when authenticated)
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

      // If user is authenticated, retrieve datasets uploaded by this logged-in user
      if (req.user && req.query.all !== 'true') {
        query.userId = req.user._id;
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

      // If database has 0 matching datasets and requester is unauthenticated with no filter, show sample datasets
      if (totalCount === 0 && !req.user && !req.query.search && !req.query.fileType) {
        datasets = SAMPLE_DATASETS.map(formatDatasetResponse);
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

    return res.status(200).json({
      success: true,
      total: totalCount,
      totalCount: totalCount,
      datasets,
      data: datasets,
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
 * @desc    Fetch all uploaded datasets of the logged-in user
 * @route   GET /api/datasets/my (also GET /api/datasets/user)
 * @access  Private (Authenticated users only)
 */
const getMyDatasets = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please provide a valid Bearer token.'
    });
  }
  return getDatasets(req, res, next);
};

/**
 * @desc    Get dataset details by datasetId or _id
 * @route   GET /api/datasets/:id
 * @access  Private / Public (Restricted to owner if dataset belongs to a specific user)
 */
const getDatasetById = async (req, res, next) => {
  try {
    const dataset = await findDataset(req.params.id);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found.'
      });
    }

    // Check authorization: if dataset has an owner and requester is authenticated as a different user
    if (dataset.userId && req.user && String(dataset.userId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this dataset.'
      });
    }

    const formatted = formatDatasetResponse(dataset);

    return res.status(200).json({
      success: true,
      message: 'Dataset details fetched successfully',
      dataset: formatted,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Infer a human-readable column type from raw data values
 * Returns one of: 'String' | 'Integer' | 'Float' | 'Boolean' | 'DateTime'
 */
const inferColumnType = (values) => {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'String';

  let intCount = 0;
  let floatCount = 0;
  let boolCount = 0;
  let dateCount = 0;

  for (const v of nonNull) {
    if (typeof v === 'boolean' || v === 'true' || v === 'false' || v === 'True' || v === 'False') {
      boolCount++;
      continue;
    }
    const str = String(v).trim();
    // ISO date detection
    if (/^\d{4}[-/]\d{2}[-/]\d{2}(T\d{2}:\d{2}:\d{2})?/.test(str)) {
      const ts = Date.parse(str);
      if (!isNaN(ts)) { dateCount++; continue; }
    }
    const num = Number(str);
    if (!isNaN(num) && str !== '') {
      if (Number.isInteger(num) && !str.includes('.')) {
        intCount++;
      } else {
        floatCount++;
      }
      continue;
    }
  }

  const total = nonNull.length;
  const threshold = 0.80; // 80% majority wins

  if (boolCount / total >= threshold) return 'Boolean';
  if (dateCount / total >= threshold) return 'DateTime';
  if ((intCount + floatCount) / total >= threshold) {
    return floatCount > 0 ? 'Float' : 'Integer';
  }
  return 'String';
};

/**
 * Build enriched column schema from sampled rows, merging with stored metadata
 */
const buildColumnSchema = (rows, storedColumns = []) => {
  if (!rows || rows.length === 0) {
    return storedColumns.map((c) => ({
      name: c.name,
      dataType: c.dataType || 'string',
      type: c.dataType === 'number' ? 'Float' : c.dataType === 'boolean' ? 'Boolean' : c.dataType === 'date' ? 'DateTime' : 'String',
      missingCount: c.nullCount || 0,
      sampleValues: c.sampleValues || []
    }));
  }

  // Collect all column names in insertion order
  const colNames = [];
  const seen = new Set();
  for (const row of rows) {
    if (row && typeof row === 'object') {
      for (const k of Object.keys(row)) {
        if (!seen.has(k)) { seen.add(k); colNames.push(k); }
      }
    }
  }

  return colNames.map((colName) => {
    const values = rows.map((r) => (r ? r[colName] : undefined));
    const nullCount = values.filter((v) => v === null || v === undefined || v === '').length;
    const sampleValues = values.filter((v) => v !== null && v !== undefined && v !== '').slice(0, 5);
    const inferredType = inferColumnType(values);

    // Check stored column for a pre-computed type to cross-reference
    const stored = storedColumns.find((c) => c.name === colName);
    const storedDataType = stored?.dataType;

    // Prefer profiler's strongly-typed value; fall back to inferred
    let resolvedType = inferredType;
    if (storedDataType) {
      if (storedDataType === 'number') resolvedType = inferredType === 'Integer' ? 'Integer' : 'Float';
      else if (storedDataType === 'boolean') resolvedType = 'Boolean';
      else if (storedDataType === 'date') resolvedType = 'DateTime';
      else if (storedDataType === 'string' && inferredType === 'String') resolvedType = 'String';
    }

    // Map to raw dataType for downstream consistency
    const dataTypeMap = { Float: 'number', Integer: 'integer', Boolean: 'boolean', DateTime: 'date', String: 'string' };

    return {
      name: colName,
      dataType: dataTypeMap[resolvedType] || 'string',
      type: resolvedType,
      nullCount,
      missingCount: nullCount,
      missingPercentage: rows.length > 0 ? Number(((nullCount / rows.length) * 100).toFixed(2)) : 0,
      sampleValues
    };
  });
};

/**
 * @desc    Stream and fetch sample records from a dataset stored in Backblaze B2 (or local fallback)
 *          Returns 50–100 records for preview with column names, inferred data types, and missing-value counts.
 *          Falls back to cached previewData stored at upload time if live streaming is unavailable.
 * @route   GET /api/datasets/:id/preview
 * @query   limit   – number of records to return (default 50, max 100)
 * @query   page    – page number for paginated access (default 1)
 * @access  Private / Public (owner-restricted when dataset belongs to a user)
 */
const getDatasetPreview = async (req, res, next) => {
  try {
    // ── 1. Validate query parameters ──────────────────────────────────────────
    const rawLimit = parseInt(req.query.limit, 10);
    const rawPage = parseInt(req.query.page, 10);

    if (req.query.limit !== undefined && (isNaN(rawLimit) || rawLimit < 1)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameter: "limit" must be a positive integer (1–100).'
      });
    }
    if (req.query.page !== undefined && (isNaN(rawPage) || rawPage < 1)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameter: "page" must be a positive integer.'
      });
    }

    const limit = Math.min(isNaN(rawLimit) ? 50 : rawLimit, 100);
    const page = isNaN(rawPage) ? 1 : rawPage;

    // ── 2. Resolve dataset ─────────────────────────────────────────────────────
    const dataset = await findUserDataset(req.params.id, req.user ? req.user._id : null);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: `Dataset not found. No dataset with ID "${req.params.id}" exists or you do not have access.`
      });
    }

    // ── 3. Authorization guard ─────────────────────────────────────────────────
    if (dataset.userId && req.user && String(dataset.userId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to preview this dataset.'
      });
    }

    // ── 4. Determine dataset properties ───────────────────────────────────────
    const fileType = (dataset.fileType || 'csv').toLowerCase();
    const delimiter = dataset.metadata?.delimiter || ',';
    const storedColumns = dataset.metadata?.columns || [];
    const totalRowCount = dataset.metadata?.rowCount || 0;

    let previewRows = [];
    let streamSource = 'cache';  // Track where data came from for diagnostics

    // ── 5. Attempt live streaming from B2 / local storage ─────────────────────
    const storageProvider = dataset.storage?.provider;
    const storageBucket = dataset.storage?.bucket;
    const storageKey = dataset.storage?.key;
    const localPath = dataset.storage?.localPath;

    const canStream = (storageProvider === 'backblaze_b2' || localPath) && storageKey;

    if (canStream) {
      try {
        // Use a range-limited fetch for large CSV files (fetch first 10 MB to cover preview rows)
        const rangeHeader = fileType === 'csv' ? 'bytes=0-10485760' : null; // 10 MB range for CSV

        const fileStream = await getDatasetFileStream({
          provider: storageProvider,
          bucket: storageBucket,
          key: storageKey,
          localPath,
          range: rangeHeader
        });

        if (fileStream) {
          const streamResult = await readPreviewRowsFromStream({
            stream: fileStream,
            fileType,
            page,
            limit,
            delimiter
          });

          if (streamResult.rows && streamResult.rows.length > 0) {
            previewRows = streamResult.rows;
            streamSource = storageProvider === 'backblaze_b2' ? 'backblaze_b2' : 'local_file';
          }
        }
      } catch (streamErr) {
        // Non-fatal: log and fall through to cached preview data
        console.warn(`[Preview] Live stream failed for dataset "${dataset.datasetId}": ${streamErr.message}. Falling back to cached preview.`);
      }
    }

    // ── 6. Fall back to stored previewData if live stream returned no rows ─────
    if (previewRows.length === 0) {
      const allCached = dataset.previewData || [];

      if (allCached.length === 0) {
        return res.status(422).json({
          success: false,
          message: 'Dataset preview is unavailable. The file could not be accessed from storage and no cached preview exists.',
          datasetId: dataset.datasetId,
          hint: 'Try re-uploading the dataset to regenerate the preview cache.'
        });
      }

      // Paginate cached rows
      const totalCached = allCached.length;
      const totalCachedPages = Math.max(1, Math.ceil(totalCached / limit));
      const validPage = Math.min(Math.max(1, page), totalCachedPages);
      const startIndex = (validPage - 1) * limit;
      previewRows = allCached.slice(startIndex, startIndex + limit);
      streamSource = 'cache';
    }

    // ── 7. Build enriched column schema from streamed rows + stored metadata ───
    const columnSchema = buildColumnSchema(previewRows, storedColumns);

    // ── 8. Compute pagination metadata ────────────────────────────────────────
    const effectiveTotalRows = totalRowCount || (dataset.previewData?.length ?? previewRows.length);
    const totalPages = Math.max(1, Math.ceil(effectiveTotalRows / limit));

    // ── 9. Format and return response ─────────────────────────────────────────
    return res.status(200).json({
      success: true,
      datasetId: dataset.datasetId,
      name: dataset.name || dataset.fileName,
      fileName: dataset.fileName,
      fileType,
      format: fileType.toUpperCase(),
      fileSizeBytes: dataset.fileSize || 0,
      formattedFileSize: formatBytes(dataset.fileSize || 0),
      storage: {
        provider: storageProvider || 'unknown',
        streamSource
      },
      schema: {
        totalColumns: columnSchema.length,
        columns: columnSchema
      },
      // Top-level columns array for backward compatibility
      columns: columnSchema,
      dataset: {
        totalRows: effectiveTotalRows,
        totalColumns: columnSchema.length,
        delimiter: fileType === 'csv' ? delimiter : null
      },
      pagination: {
        page,
        limit,
        totalPages,
        totalRows: effectiveTotalRows,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      previewCount: previewRows.length,
      rows: previewRows
    });
  } catch (error) {
    console.error('[Preview API Error]', error.message);
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
    const dataset = await findDataset(req.params.id);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found.'
      });
    }

    // Check authorization: if dataset belongs to another user
    if (dataset.userId && req.user && String(dataset.userId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this dataset.'
      });
    }

    // Delete file from Backblaze B2 bucket or local disk storage
    await deleteDatasetFile({
      provider: dataset.storage?.provider,
      bucket: dataset.storage?.bucket,
      key: dataset.storage?.key,
      localPath: dataset.storage?.localPath
    });

    // Cascade delete associated mappings in MongoDB if Mapping model exists
    try {
      const Mapping = require('../models/Mapping');
      await Mapping.deleteMany({ datasetId: dataset.datasetId });
    } catch {
      // Non-critical if mapping deletion cleanup fails
    }

    // Delete record from MongoDB if model instance
    const deletedId = dataset.datasetId || req.params.id;
    if (dataset.deleteOne) {
      await dataset.deleteOne();
    } else {
      const idx = SAMPLE_DATASETS.findIndex(d => d.datasetId === req.params.id || d.id === req.params.id);
      if (idx !== -1) SAMPLE_DATASETS.splice(idx, 1);
    }

    return res.status(200).json({
      success: true,
      message: 'Dataset deleted successfully.',
      datasetId: deletedId,
      deletedDatasetId: deletedId
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

const isPlainObj = (val) =>
  val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date);

const hasConfiguredMapping = (mapping) => {
  if (!isPlainObj(mapping)) return false;
  return Boolean(
    (Array.isArray(mapping.fieldMappings) && mapping.fieldMappings.length > 0) ||
    mapping.target ||
    mapping.id ||
    (Array.isArray(mapping.numerical) && mapping.numerical.length > 0) ||
    (Array.isArray(mapping.categorical) && mapping.categorical.length > 0) ||
    (Array.isArray(mapping.datetime) && mapping.datetime.length > 0)
  );
};

const extractTransformationConfig = (body = {}) => {
  if (body.config !== undefined) {
    return body.config;
  }
  const directKeys = ['select', 'rename', 'types', 'cast', 'columns', 'rules', 'transformations', 'steps', 'options'];
  const extracted = {};
  let hasAny = false;
  for (const key of directKeys) {
    if (body[key] !== undefined) {
      extracted[key] = body[key];
      hasAny = true;
    }
  }
  return hasAny ? extracted : null;
};

const getDatasetAvailableColumns = (dataset, rows = []) => {
  const cols = new Set();
  const metaCols = dataset?.metadata?.columns || dataset?.columns || [];
  if (Array.isArray(metaCols)) {
    for (const col of metaCols) {
      const name = typeof col === 'string' ? col : col?.name;
      if (name) cols.add(name);
    }
  }
  if (Array.isArray(rows) && rows.length > 0 && isPlainObj(rows[0])) {
    for (const key of Object.keys(rows[0])) {
      cols.add(key);
    }
  }
  return Array.from(cols);
};

/**
 * @desc    Apply transformations to a dataset's preview/sample rows using configuration or field mapping
 * @route   POST /api/datasets/:id/transform
 * @access  Public / Private
 */
const transformDatasetRows = async (req, res, next) => {
  try {
    if (!isPlainObj(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'Request body must be a valid JSON object.'
      });
    }

    const dataset = await findDataset(req.params.id, req.user ? req.user._id : null);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found.'
      });
    }

    if (dataset.userId && req.user && String(dataset.userId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to transform this dataset.'
      });
    }

    const { overrides, useMapping, rows: inputRows, projectToTarget = true } = req.body;
    const rawLimit = req.body.limit ?? req.body.sampleSize ?? req.query?.limit;
    let sampleLimit = null;

    if (rawLimit !== undefined && rawLimit !== null && rawLimit !== '') {
      const parsedLimit = Number(rawLimit);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
        return res.status(400).json({
          success: false,
          message: "'limit' / 'sampleSize' must be a positive integer."
        });
      }
      sampleLimit = Math.min(parsedLimit, 500);
    }

    if (inputRows !== undefined) {
      if (!Array.isArray(inputRows) || inputRows.some((r) => !isPlainObj(r))) {
        return res.status(400).json({
          success: false,
          message: "'rows' must be an array of record objects."
        });
      }
    }

    let rowsToTransform = inputRows !== undefined
      ? inputRows
      : (dataset.previewData || dataset.sampleRows || []);

    // Fallback to streaming sample rows from file storage if preview cache is empty
    if (rowsToTransform.length === 0 && inputRows === undefined) {
      const storageProvider = dataset.storage?.provider;
      const storageBucket = dataset.storage?.bucket;
      const storageKey = dataset.storage?.key;
      const localPath = dataset.storage?.localPath;
      if ((storageProvider === 'backblaze_b2' || localPath) && storageKey) {
        try {
          const fileStream = await getDatasetFileStream({
            provider: storageProvider,
            bucket: storageBucket,
            key: storageKey,
            localPath
          });
          if (fileStream) {
            const streamResult = await readPreviewRowsFromStream({
              stream: fileStream,
              fileType: (dataset.fileType || 'csv').toLowerCase(),
              page: 1,
              limit: sampleLimit || 50,
              delimiter: dataset.metadata?.delimiter || ','
            });
            if (Array.isArray(streamResult.rows) && streamResult.rows.length > 0) {
              rowsToTransform = streamResult.rows;
            }
          }
        } catch (streamErr) {
          console.warn(`[Transform] Live stream fallback failed for "${dataset.datasetId}": ${streamErr.message}`);
        }
      }
    }

    if (sampleLimit !== null) {
      rowsToTransform = rowsToTransform.slice(0, sampleLimit);
    }

    const explicitConfig = extractTransformationConfig(req.body);
    const shouldUseMapping =
      useMapping === true ||
      (useMapping !== false && explicitConfig === null && hasConfiguredMapping(dataset.mapping));

    // Mode A: Saved Field-Mapping Projection
    const fieldMappings = dataset.mapping?.fieldMappings;
    if (shouldUseMapping && Array.isArray(fieldMappings) && fieldMappings.length > 0 && projectToTarget) {
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
            else if (trans === 'to_string' || trans === 'string') val = convertValue(val, 'String');
            else if (trans === 'to_date' || trans === 'date') val = convertValue(val, 'Date', { asISOString: true });
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
    if (shouldUseMapping && hasConfiguredMapping(dataset.mapping)) {
      activeConfig = generateTransformConfigFromMapping(dataset.mapping, overrides || explicitConfig || {});
    } else {
      activeConfig = explicitConfig;
      const availableColumns = getDatasetAvailableColumns(dataset, rowsToTransform);
      const validation = validateTransformationConfig(activeConfig, availableColumns);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          errors: validation.errors
        });
      }
    }

    let transformedRows;
    try {
      transformedRows = transformDataset(rowsToTransform, activeConfig);
    } catch (transformErr) {
      return res.status(400).json({
        success: false,
        message: transformErr.message || 'Failed to apply transformation configuration.',
        errors: [{ field: 'transform', code: 'TRANSFORMATION_EXECUTION_ERROR', message: transformErr.message }]
      });
    }

    const outputColumns = transformedRows.length > 0 && isPlainObj(transformedRows[0])
      ? Object.keys(transformedRows[0])
      : [];

    return res.status(200).json({
      success: true,
      datasetId: dataset.datasetId || dataset.id,
      name: dataset.name || dataset.fileName,
      appliedConfig: activeConfig,
      columns: outputColumns,
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
    if (!isPlainObj(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'Request body must be a valid JSON object.'
      });
    }

    const { record, mapping, overrides } = req.body;

    if (!isPlainObj(record)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid record object to transform.'
      });
    }

    let transformed;
    let appliedConfig;

    if (mapping !== undefined) {
      if (!isPlainObj(mapping)) {
        return res.status(400).json({
          success: false,
          message: "'mapping' must be a valid object."
        });
      }
      const overrideConfig = overrides || extractTransformationConfig(req.body) || {};
      appliedConfig = generateTransformConfigFromMapping(mapping, overrideConfig);
      transformed = applyMappingAndTransformations(record, mapping, overrideConfig);
    } else {
      appliedConfig = extractTransformationConfig(req.body);
      const validation = validateTransformationConfig(appliedConfig, Object.keys(record));
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          errors: validation.errors
        });
      }

      try {
        transformed = transformRecord(record, appliedConfig);
      } catch (transformErr) {
        return res.status(400).json({
          success: false,
          message: transformErr.message || 'Failed to transform record.',
          errors: [{ field: 'transform', code: 'TRANSFORMATION_EXECUTION_ERROR', message: transformErr.message }]
        });
      }
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
  getMyDatasets,
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
  formatDatasetResponse,
  SAMPLE_DATASETS
};
