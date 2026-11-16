const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Dataset = require('../models/Dataset');
const { parseCsvStream, parseJsonStream } = require('../utils/streamParsers');
const { uploadDatasetFile, getDownloadUrl, deleteDatasetFile, LOCAL_STORAGE_DIR } = require('../utils/b2Storage');

/**
 * Helper to find a dataset by either its custom datasetId (UUID) or Mongo _id
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
 * @access  Private
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

    // 2. Upload file to Backblaze B2 (or local fallback storage)
    const storageResult = await uploadDatasetFile({
      filePath: tempFilePath,
      key: storageKey,
      mimeType
    });

    // 3. Create Dataset document in MongoDB
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
      createdAt: new Date()
    });

    // 4. Clean up temporary multer spool file
    if (fs.existsSync(tempFilePath)) {
      await fs.promises.unlink(tempFilePath);
    }

    return res.status(201).json({
      success: true,
      message: 'Dataset uploaded and saved successfully',
      data: {
        datasetId: dataset.datasetId,
        userId: dataset.userId,
        fileName: dataset.fileName,
        fileType: dataset.fileType,
        fileSize: dataset.fileSize,
        storageUrl: dataset.storageUrl,
        createdAt: dataset.createdAt,
        name: dataset.name,
        metadata: dataset.metadata,
        tags: dataset.tags,
        status: dataset.status
      }
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
 * @access  Private
 */
const getDatasets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;

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

    return res.status(200).json({
      success: true,
      data: datasets.map((d) => ({
        datasetId: d.datasetId,
        userId: d.userId,
        fileName: d.fileName,
        fileType: d.fileType,
        fileSize: d.fileSize,
        storageUrl: d.storageUrl,
        createdAt: d.createdAt,
        name: d.name,
        metadata: {
          rowCount: d.metadata.rowCount,
          columnCount: d.metadata.columnCount
        },
        tags: d.tags,
        status: d.status
      })),
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
 * @access  Private
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

    return res.status(200).json({
      success: true,
      data: {
        datasetId: dataset.datasetId,
        userId: dataset.userId,
        fileName: dataset.fileName,
        fileType: dataset.fileType,
        fileSize: dataset.fileSize,
        storageUrl: dataset.storageUrl,
        createdAt: dataset.createdAt,
        name: dataset.name,
        description: dataset.description,
        metadata: dataset.metadata,
        tags: dataset.tags,
        status: dataset.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dataset table preview rows
 * @route   GET /api/datasets/:id/preview
 * @access  Private
 */
const getDatasetPreview = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const dataset = await findUserDataset(req.params.id, req.user._id);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }

    const previewSlice = (dataset.previewData || []).slice(0, limit);

    return res.status(200).json({
      success: true,
      datasetId: dataset.datasetId,
      fileName: dataset.fileName,
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
 * @desc    Get dataset profiling statistics and column metadata
 * @route   GET /api/datasets/:id/profile
 * @access  Private
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

    const rows = dataset.previewData || [];
    const rowCount = dataset.metadata?.rowCount || rows.length || 0;
    const columns = dataset.metadata?.columns || [];
    const columnCount = columns.length;

    let totalMissingCells = 0;
    const profiledColumns = columns.map((col, idx) => {
      const colName = col.name;
      const colType = col.dataType || col.type || 'string';

      let nullCount = typeof col.nullCount === 'number' ? col.nullCount : 0;
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
      if (colType === 'number' || colType === 'Integer' || colType === 'Float') {
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
        stats: { min, max, mean }
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

    return res.status(200).json({
      success: true,
      profile: {
        datasetId: dataset.datasetId,
        name: dataset.name,
        fileName: dataset.fileName,
        format: dataset.fileType?.toUpperCase() || 'CSV',
        fileSizeBytes: dataset.fileSize || 0,
        rowCount,
        columnCount,
        totalCells,
        totalMissingCells,
        completenessScore,
        columnsWithMissing,
        cleanColumnsCount: columnCount - columnsWithMissing,
        typeCounts,
        createdAt: dataset.createdAt || new Date().toISOString(),
        status: dataset.status || 'Ready',
        tags: dataset.tags || ['Tabular'],
        columns: profiledColumns,
        previewRows: rows.slice(0, 20)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get download URL (presigned B2 or direct)
 * @route   GET /api/datasets/:id/download
 * @access  Private
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
 * @access  Private
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
  getDatasetDownloadUrl,
  deleteDataset
};
