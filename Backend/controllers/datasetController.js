const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Dataset = require('../models/Dataset');
const { parseCsvStream, parseJsonStream } = require('../utils/streamParsers');
const { uploadDatasetFile, getDownloadUrl, deleteDatasetFile, LOCAL_STORAGE_DIR } = require('../utils/b2Storage');
const { profileDataset, profileInMemoryRecords } = require('../utils/datasetProfiler');

/**
 * Helper to find a dataset by either its custom datasetId (UUID) or Mongo _id
 * STRICTLY restricted by userId to ensure user isolation.
 */
const findUserDataset = async (id, userId) => {
  const query = {
    userId,
    $or: [
      { datasetId: id }
    ]
  };

  if (mongoose.Types.ObjectId.isValid(id)) {
    query.$or.push({ _id: id });
  }

  return await Dataset.findOne(query);
};

/**
 * @desc    Upload CSV/JSON file and save dataset metadata in MongoDB
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

  // Validate format (CSV or JSON)
  let fileType;
  if (ext === '.csv') {
    fileType = 'csv';
  } else if (ext === '.json') {
    fileType = 'json';
  } else if (ext === '.jsonl') {
    fileType = 'jsonl';
  } else {
    if (fs.existsSync(tempFilePath)) await fs.promises.unlink(tempFilePath);
    return res.status(400).json({
      success: false,
      message: 'Invalid file format. Only CSV and JSON files are supported.'
    });
  }

  const datasetId = crypto.randomUUID();
  const datasetName = (req.body.name && req.body.name.trim()) || path.parse(fileName).name;
  const description = (req.body.description && req.body.description.trim()) || '';
  const storageKey = `datasets/${req.user._id}/${Date.now()}_${path.basename(fileName)}`;

  // Parse tags if provided
  let tags = [];
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
    // 1. Stream-parse file to infer column types, row counts, and extract preview rows
    let parseResult;
    if (fileType === 'csv') {
      parseResult = await parseCsvStream(tempFilePath, 50);
    } else {
      parseResult = await parseJsonStream(tempFilePath, fileType === 'jsonl', 50);
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
      userId: req.user._id,
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
      await fs.promises.unlink(tempFilePath);
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
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (cleanupErr) {
        console.error('Failed to unlink temp file:', cleanupErr.message);
      }
    }

    console.error('Dataset Upload Processing Error:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to process and upload dataset: ${error.message}`
    });
  }
};

/**
 * @desc    Get paginated listing of user datasets
 * @route   GET /api/datasets
 * @access  Private (User can only access their own datasets)
 */
const getDatasets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const skip = (page - 1) * limit;

    // Filter strictly by the authenticated user's ID
    const query = { userId: req.user._id };

    if (req.query.fileType) {
      query.fileType = req.query.fileType.toLowerCase();
    }

    if (req.query.status) {
      query.status = req.query.status;
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

    const totalCount = await Dataset.countDocuments(query);
    const datasets = await Dataset.find(query)
      .select('-previewData -storage.localPath')
      .sort(sort)
      .skip(skip)
      .limit(limit);

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
      datasets: formatted,
      data: formatted,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit) || 1,
        totalCount,
        hasMore: skip + datasets.length < totalCount
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
    const dataset = await findUserDataset(req.params.id, req.user._id);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
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
 * @desc    Get dataset table preview rows
 * @route   GET /api/datasets/:id/preview
 * @access  Private (Restricted to dataset owner)
 */
const getDatasetPreview = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const dataset = await findUserDataset(req.params.id, req.user._id);

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
    const dataset = await findUserDataset(req.params.id, req.user._id);

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
 * @desc    Get field mapping for dataset
 * @route   GET /api/datasets/:id/mapping
 * @access  Private (Restricted to dataset owner)
 */
const getFieldMapping = async (req, res, next) => {
  try {
    const dataset = await findUserDataset(req.params.id, req.user._id);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }

    return res.status(200).json({
      success: true,
      datasetId: dataset.datasetId,
      name: dataset.name || dataset.fileName,
      columns: (dataset.metadata?.columns || []).map((c) => ({
        name: c.name,
        type: c.dataType === 'number' ? 'Float' : c.dataType === 'boolean' ? 'Boolean' : 'String',
        missingCount: c.nullCount || 0
      })),
      mapping: dataset.mapping || {
        target: '',
        id: '',
        numerical: [],
        categorical: [],
        datetime: [],
        ignored: []
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Save/update dataset field mapping
 * @route   POST /api/datasets/:id/mapping
 * @access  Private (Restricted to dataset owner)
 */
const saveFieldMapping = async (req, res, next) => {
  try {
    const dataset = await findUserDataset(req.params.id, req.user._id);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }

    const { mapping } = req.body;
    if (!mapping || typeof mapping !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid mapping object provided'
      });
    }

    dataset.mapping = {
      target: mapping.target || '',
      id: mapping.id || '',
      numerical: Array.isArray(mapping.numerical) ? mapping.numerical : [],
      categorical: Array.isArray(mapping.categorical) ? mapping.categorical : [],
      datetime: Array.isArray(mapping.datetime) ? mapping.datetime : [],
      ignored: Array.isArray(mapping.ignored) ? mapping.ignored : []
    };

    await dataset.save();

    return res.status(200).json({
      success: true,
      message: `Field mapping saved successfully for "${dataset.name || dataset.fileName}".`,
      mapping: dataset.mapping
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
    const dataset = await findUserDataset(req.params.id, req.user._id);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }

    const downloadInfo = await getDownloadUrl({
      provider: dataset.storage.provider,
      bucket: dataset.storage.bucket,
      key: dataset.storage.key,
      localPath: dataset.storage.localPath,
      expiresIn: 300
    });

    return res.status(200).json({
      success: true,
      datasetId: dataset.datasetId,
      fileName: dataset.fileName,
      mimeType: dataset.mimeType,
      ...downloadInfo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete dataset record and storage file
 * @route   DELETE /api/datasets/:id
 * @access  Private (Restricted to dataset owner)
 */
const deleteDataset = async (req, res, next) => {
  try {
    const dataset = await findUserDataset(req.params.id, req.user._id);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }

    await deleteDatasetFile({
      provider: dataset.storage.provider,
      bucket: dataset.storage.bucket,
      key: dataset.storage.key,
      localPath: dataset.storage.localPath
    });

    await dataset.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Dataset deleted successfully'
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
  deleteDataset
};
