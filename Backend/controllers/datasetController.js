const fs = require('fs');
const path = require('path');
const Dataset = require('../models/Dataset');
const { parseCsvStream, parseJsonStream } = require('../utils/streamParsers');
const { uploadDatasetFile, getDownloadUrl, deleteDatasetFile, LOCAL_STORAGE_DIR } = require('../utils/b2Storage');

/**
 * @desc    Upload and stream-parse a new dataset (CSV/JSON/JSONL)
 * @route   POST /api/datasets/upload
 * @access  Private
 */
const uploadDataset = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a file (.csv, .json, or .jsonl)'
    });
  }

  const tempFilePath = req.file.path;
  const originalFilename = req.file.originalname;
  const ext = path.extname(originalFilename).toLowerCase();
  const fileSizeBytes = req.file.size;
  const mimeType = req.file.mimetype;

  // Determine file format
  let fileFormat;
  if (ext === '.csv') {
    fileFormat = 'csv';
  } else if (ext === '.json') {
    fileFormat = 'json';
  } else if (ext === '.jsonl') {
    fileFormat = 'jsonl';
  } else {
    // Clean up temp file
    if (fs.existsSync(tempFilePath)) await fs.promises.unlink(tempFilePath);
    return res.status(400).json({
      success: false,
      message: 'Unsupported format. Please upload CSV, JSON, or JSONL files.'
    });
  }

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

  const datasetName = (req.body.name && req.body.name.trim()) || path.parse(originalFilename).name;
  const description = (req.body.description && req.body.description.trim()) || '';
  const storageKey = `datasets/${req.user._id}/${Date.now()}_${path.basename(originalFilename)}`;

  try {
    // 1. Run streaming parser for schema inference & preview extraction
    let parseResult;
    if (fileFormat === 'csv') {
      parseResult = await parseCsvStream(tempFilePath, 50);
    } else {
      parseResult = await parseJsonStream(tempFilePath, fileFormat === 'jsonl', 50);
    }

    // 2. Stream upload to Backblaze B2 / local storage
    const storageResult = await uploadDatasetFile({
      filePath: tempFilePath,
      key: storageKey,
      mimeType
    });

    // 3. Save dataset document in MongoDB Atlas
    const dataset = await Dataset.create({
      user: req.user._id,
      name: datasetName,
      description,
      originalFilename,
      fileFormat,
      mimeType,
      fileSizeBytes,
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
      tags
    });

    // 4. Remove local temp spool file
    if (fs.existsSync(tempFilePath)) {
      await fs.promises.unlink(tempFilePath);
    }

    return res.status(201).json({
      success: true,
      message: 'Dataset uploaded and processed successfully',
      data: {
        _id: dataset._id,
        name: dataset.name,
        originalFilename: dataset.originalFilename,
        fileFormat: dataset.fileFormat,
        fileSizeBytes: dataset.fileSizeBytes,
        status: dataset.status,
        metadata: dataset.metadata,
        tags: dataset.tags,
        createdAt: dataset.createdAt
      }
    });
  } catch (error) {
    // Clean up temporary file on failure
    if (fs.existsSync(tempFilePath)) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (cleanupErr) {
        console.error('Failed to unlink temp file:', cleanupErr.message);
      }
    }

    console.error('Dataset Upload Error:', error);
    return res.status(500).json({
      success: false,
      message: `Dataset processing failed: ${error.message}`
    });
  }
};

/**
 * @desc    Get paginated list of datasets for logged-in user
 * @route   GET /api/datasets
 * @access  Private
 */
const getDatasets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };

    // Format filter
    if (req.query.fileFormat) {
      query.fileFormat = req.query.fileFormat.toLowerCase();
    }

    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Search query
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ];
    }

    // Sorting
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const totalCount = await Dataset.countDocuments(query);
    const datasets = await Dataset.find(query)
      .select('-previewData -storage.localPath') // Omit preview and internal paths
      .sort(sort)
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: datasets,
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
 * @desc    Get dataset details by ID
 * @route   GET /api/datasets/:id
 * @access  Private
 */
const getDatasetById = async (req, res, next) => {
  try {
    const dataset = await Dataset.findOne({
      _id: req.params.id,
      user: req.user._id
    }).select('-previewData -storage.localPath');

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: dataset
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get preview rows for a dataset
 * @route   GET /api/datasets/:id/preview
 * @access  Private
 */
const getDatasetPreview = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    const dataset = await Dataset.findOne({
      _id: req.params.id,
      user: req.user._id
    }).select('name metadata previewData');

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }

    const previewSlice = (dataset.previewData || []).slice(0, limit);

    return res.status(200).json({
      success: true,
      datasetId: dataset._id,
      name: dataset.name,
      totalRows: dataset.metadata.rowCount,
      columns: dataset.metadata.columns,
      previewCount: previewSlice.length,
      rows: previewSlice
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get pre-signed download URL or direct download route
 * @route   GET /api/datasets/:id/download
 * @access  Private
 */
const getDatasetDownloadUrl = async (req, res, next) => {
  try {
    const dataset = await Dataset.findOne({
      _id: req.params.id,
      user: req.user._id
    });

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
      expiresIn: 300 // 5 minutes
    });

    return res.status(200).json({
      success: true,
      filename: dataset.originalFilename,
      mimeType: dataset.mimeType,
      ...downloadInfo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Serve local file download in development/offline mode
 * @route   GET /api/datasets/file/:key
 * @access  Private
 */
const downloadLocalFile = async (req, res, next) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const dataset = await Dataset.findOne({
      'storage.key': key,
      user: req.user._id
    });

    if (!dataset || !dataset.storage.localPath || !fs.existsSync(dataset.storage.localPath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on storage'
      });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${dataset.originalFilename}"`);
    res.setHeader('Content-Type', dataset.mimeType);

    const stream = fs.createReadStream(dataset.storage.localPath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a dataset and its stored object
 * @route   DELETE /api/datasets/:id
 * @access  Private
 */
const deleteDataset = async (req, res, next) => {
  try {
    const dataset = await Dataset.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }

    // Delete object from Backblaze B2 / local storage
    await deleteDatasetFile({
      provider: dataset.storage.provider,
      bucket: dataset.storage.bucket,
      key: dataset.storage.key,
      localPath: dataset.storage.localPath
    });

    // Delete document from MongoDB
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
  getDatasetDownloadUrl,
  downloadLocalFile,
  deleteDataset
};
