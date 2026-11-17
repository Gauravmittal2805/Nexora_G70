const mongoose = require('mongoose');
const crypto = require('crypto');
const Mapping = require('../models/Mapping');
const Dataset = require('../models/Dataset');
const { SAMPLE_DATASETS } = require('./datasetController');

/**
 * Helper to locate dataset by datasetId or Mongo _id
 */
const findDataset = async (id, userId = null) => {
  if (!id) return null;

  if (mongoose.connection.readyState === 1) {
    const conditions = [{ datasetId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      conditions.push({ _id: id });
    }

    const query = { $or: conditions };
    if (userId) {
      query.$and = [
        { $or: [{ userId }, { userId: { $exists: false } }, { userId: null }] }
      ];
    }

    const found = await Dataset.findOne(query);
    if (found) return found;
  }

  // Fallback to sample catalog if present
  if (Array.isArray(SAMPLE_DATASETS)) {
    return SAMPLE_DATASETS.find((d) => d.datasetId === id || d.id === id) || null;
  }

  return null;
};

/**
 * Extract distinct column names from dataset metadata or sample rows
 */
const getDatasetColumnNames = (dataset) => {
  const columnNames = new Set();

  if (Array.isArray(dataset.metadata?.columns)) {
    dataset.metadata.columns.forEach((col) => {
      const name = typeof col === 'string' ? col : col?.name;
      if (name) columnNames.add(name);
    });
  }

  if (Array.isArray(dataset.columns)) {
    dataset.columns.forEach((col) => {
      const name = typeof col === 'string' ? col : col?.name;
      if (name) columnNames.add(name);
    });
  }

  const sample =
    (dataset.previewData && dataset.previewData[0]) ||
    (dataset.sampleRows && dataset.sampleRows[0]);
  if (sample && typeof sample === 'object') {
    Object.keys(sample).forEach((k) => columnNames.add(k));
  }

  return Array.from(columnNames);
};

/**
 * Normalize incoming field mapping payload into standard fieldMappings array
 */
const normalizeFieldMappings = (body) => {
  const raw = body.fieldMappings || body.mappings || body.connections;
  if (!raw) return [];

  // Key-value object mapping: { "colA": "targetA", "colB": "targetB" }
  if (!Array.isArray(raw) && typeof raw === 'object') {
    return Object.entries(raw).map(([src, tgt]) => {
      const isObj = typeof tgt === 'object' && tgt !== null;
      return {
        sourceField: String(src).trim(),
        targetField: (isObj ? tgt.targetField || tgt.name || tgt.destField || '' : String(tgt)).trim(),
        targetType: (isObj && tgt.targetType) || (isObj && tgt.type) || 'string',
        transformation: (isObj && tgt.transformation) || 'none',
        defaultValue: isObj && tgt.defaultValue !== undefined ? tgt.defaultValue : null,
        isRequired: isObj && tgt.isRequired !== undefined ? Boolean(tgt.isRequired) : false,
        description: isObj && tgt.description ? tgt.description.trim() : ''
      };
    });
  }

  // Array of mapping items
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        return {
          sourceField: trimmed,
          targetField: trimmed,
          targetType: 'string',
          transformation: 'none',
          defaultValue: null,
          isRequired: false,
          description: ''
        };
      }

      const sourceField = String(
        item.sourceField || item.sourceColumn || item.source || ''
      ).trim();
      const targetField = String(
        item.targetField || item.targetColumn || item.target || item.destField || ''
      ).trim();
      const targetType = String(
        item.targetType || item.dataType || item.type || 'string'
      ).trim();
      const transformation = String(
        item.transformation || item.transform || 'none'
      ).trim();
      const defaultValue = item.defaultValue !== undefined ? item.defaultValue : null;
      const isRequired = item.isRequired !== undefined ? Boolean(item.isRequired) : false;
      const description = item.description ? String(item.description).trim() : '';

      return {
        sourceField,
        targetField,
        targetType,
        transformation,
        defaultValue,
        isRequired,
        description
      };
    });
  }

  return [];
};

/**
 * Validate mapping configurations:
 * 1. Ensure at least one mapping configuration
 * 2. Ensure sourceField and targetField are non-empty
 * 3. Prevent duplicate source fields
 * 4. Prevent duplicate target fields
 * 5. Validate all source fields exist in the dataset
 */
const validateMappingConfiguration = (fieldMappings, datasetColumns, datasetName) => {
  if (!fieldMappings || !Array.isArray(fieldMappings) || fieldMappings.length === 0) {
    return {
      isValid: false,
      status: 400,
      message: 'At least one field mapping configuration is required.'
    };
  }

  // Check required non-empty fields
  for (let i = 0; i < fieldMappings.length; i++) {
    const item = fieldMappings[i];
    if (!item.sourceField || item.sourceField.trim() === '') {
      return {
        isValid: false,
        status: 400,
        message: `Invalid mapping at index ${i}: 'sourceField' is required and cannot be empty.`
      };
    }
    if (!item.targetField || item.targetField.trim() === '') {
      return {
        isValid: false,
        status: 400,
        message: `Invalid mapping at index ${i}: 'targetField' is required and cannot be empty.`
      };
    }
  }

  // Prevent duplicate source fields
  const seenSources = new Set();
  const duplicateSources = new Set();
  fieldMappings.forEach((m) => {
    const s = m.sourceField.trim();
    if (seenSources.has(s)) {
      duplicateSources.add(s);
    }
    seenSources.add(s);
  });

  if (duplicateSources.size > 0) {
    return {
      isValid: false,
      status: 400,
      message: `Duplicate source field mapping detected: [${Array.from(duplicateSources).join(', ')}]. Each source column can only be mapped once.`,
      duplicates: Array.from(duplicateSources)
    };
  }

  // Prevent duplicate target fields
  const seenTargets = new Set();
  const duplicateTargets = new Set();
  fieldMappings.forEach((m) => {
    const t = m.targetField.trim();
    if (seenTargets.has(t)) {
      duplicateTargets.add(t);
    }
    seenTargets.add(t);
  });

  if (duplicateTargets.size > 0) {
    return {
      isValid: false,
      status: 400,
      message: `Duplicate target field mapping detected: [${Array.from(duplicateTargets).join(', ')}]. Multiple source columns cannot map to the same target field.`,
      duplicates: Array.from(duplicateTargets)
    };
  }

  // Validate that source columns exist in uploaded dataset
  if (datasetColumns && datasetColumns.length > 0) {
    const availableSet = new Set(datasetColumns);
    const invalidColumns = fieldMappings
      .map((m) => m.sourceField)
      .filter((col) => !availableSet.has(col));

    if (invalidColumns.length > 0) {
      return {
        isValid: false,
        status: 400,
        message: `Source column(s) [${invalidColumns.join(', ')}] do not exist in dataset '${datasetName}'. Available columns: [${datasetColumns.join(', ')}].`,
        invalidColumns,
        availableColumns: datasetColumns
      };
    }
  }

  return { isValid: true };
};

/**
 * Synchronize dataset model mapping state
 */
const syncDatasetMapping = async (dataset, fieldMappings, targetRole = {}) => {
  try {
    if (!dataset) return;

    const idField =
      targetRole.id ||
      fieldMappings.find((m) => /id$|^id|_id$/i.test(m.targetField))?.sourceField ||
      '';
    const targetField =
      targetRole.target ||
      fieldMappings.find((m) => /target|label|churn|price|outcome|class/i.test(m.targetField))?.sourceField ||
      '';
    const numerical =
      targetRole.numerical ||
      fieldMappings
        .filter((m) => ['number', 'integer', 'float'].includes((m.targetType || '').toLowerCase()))
        .map((m) => m.sourceField);
    const categorical =
      targetRole.categorical ||
      fieldMappings
        .filter(
          (m) =>
            ['string', 'boolean'].includes((m.targetType || '').toLowerCase()) &&
            m.sourceField !== idField &&
            m.sourceField !== targetField
        )
        .map((m) => m.sourceField);
    const datetime =
      targetRole.datetime ||
      fieldMappings
        .filter((m) => ['date', 'datetime'].includes((m.targetType || '').toLowerCase()))
        .map((m) => m.sourceField);

    const mappedSources = new Set(fieldMappings.map((m) => m.sourceField));
    const allColumns = getDatasetColumnNames(dataset);
    const ignored = targetRole.ignored || allColumns.filter((c) => !mappedSources.has(c));

    dataset.mapping = {
      target: targetField,
      id: idField,
      numerical,
      categorical,
      datetime,
      ignored
    };

    if (dataset.save) {
      await dataset.save();
    }
  } catch (err) {
    console.warn('Notice: Could not sync dataset.mapping in dataset document:', err.message);
  }
};

/**
 * @desc    Create field-mapping configuration
 * @route   POST /api/mappings
 * @access  Public / Private (with optional JWT auth)
 */
const createMapping = async (req, res, next) => {
  try {
    const datasetId = (req.body.datasetId || req.query.datasetId || '').trim();

    if (!datasetId) {
      return res.status(400).json({
        success: false,
        message: 'datasetId is required in request body.'
      });
    }

    // 1. Verify dataset exists
    const dataset = await findDataset(datasetId, req.user ? req.user._id : null);
    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: `Dataset with ID '${datasetId}' not found.`
      });
    }

    const availableColumns = getDatasetColumnNames(dataset);
    const datasetName = dataset.name || dataset.fileName || datasetId;

    // 2. Normalize field mapping configurations
    const fieldMappings = normalizeFieldMappings(req.body);

    // 3. Validate mapping configuration
    const validation = validateMappingConfiguration(fieldMappings, availableColumns, datasetName);
    if (!validation.isValid) {
      return res.status(validation.status).json({
        success: false,
        message: validation.message,
        invalidColumns: validation.invalidColumns,
        availableColumns: validation.availableColumns,
        duplicates: validation.duplicates
      });
    }

    // 4. Prevent duplicate mapping configuration document for dataset unless upsert/overwrite is requested
    const shouldUpsert = req.body.upsert === true || req.body.overwrite === true || req.query.upsert === 'true';
    const existingMapping = await Mapping.findOne({
      $or: [{ datasetId }, { datasetId: dataset.datasetId || dataset._id }]
    });

    if (existingMapping && !shouldUpsert) {
      return res.status(409).json({
        success: false,
        message: `A mapping configuration already exists for dataset '${datasetId}'. Use PUT /api/mappings/${datasetId} to update it or pass 'upsert: true'.`,
        mappingId: existingMapping.mappingId,
        existingMapping
      });
    }

    // Extract targetRole metadata
    const targetRole = {
      target: req.body.target || req.body.targetRole?.target || '',
      id: req.body.id || req.body.targetRole?.id || '',
      numerical: req.body.numerical || req.body.targetRole?.numerical || [],
      categorical: req.body.categorical || req.body.targetRole?.categorical || [],
      datetime: req.body.datetime || req.body.targetRole?.datetime || [],
      ignored: req.body.ignored || req.body.targetRole?.ignored || []
    };

    let mappingDoc;
    if (existingMapping && shouldUpsert) {
      // Overwrite/Update existing mapping
      existingMapping.fieldMappings = fieldMappings;
      if (req.body.name) existingMapping.name = req.body.name.trim();
      if (req.body.description !== undefined) existingMapping.description = req.body.description.trim();
      if (req.body.connections) existingMapping.connections = req.body.connections;
      if (req.body.destinations) existingMapping.destinations = req.body.destinations;
      if (req.user) existingMapping.userId = req.user._id;
      existingMapping.targetRole = targetRole;
      existingMapping.status = req.body.status || existingMapping.status || 'active';

      mappingDoc = await existingMapping.save();
    } else {
      // Create new mapping document
      mappingDoc = await Mapping.create({
        mappingId: crypto.randomUUID(),
        datasetId: dataset.datasetId || datasetId,
        userId: req.user ? req.user._id : dataset.userId || null,
        name: req.body.name ? req.body.name.trim() : `Mapping for ${datasetName}`,
        description: req.body.description ? req.body.description.trim() : '',
        fieldMappings,
        targetRole,
        connections: req.body.connections || [],
        destinations: req.body.destinations || [],
        status: req.body.status || 'active'
      });
    }

    // 5. Synchronize with dataset model
    await syncDatasetMapping(dataset, fieldMappings, targetRole);

    return res.status(201).json({
      success: true,
      message: 'Field mapping configuration stored successfully in MongoDB.',
      mapping: mappingDoc
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get field mapping by datasetId or mappingId
 * @route   GET /api/mappings/:datasetId
 * @access  Public / Private
 */
const getMappingByDatasetId = async (req, res, next) => {
  try {
    const id = req.params.datasetId;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'datasetId parameter is required.'
      });
    }

    // 1. Search in Mapping collection by datasetId, mappingId, or _id
    const mappingConditions = [{ datasetId: id }, { mappingId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      mappingConditions.push({ _id: id });
    }

    const mapping = await Mapping.findOne({ $or: mappingConditions });

    // 2. Fetch associated dataset info if available
    const dataset = await findDataset(id, req.user ? req.user._id : null);

    if (mapping) {
      const availableColumns = dataset ? getDatasetColumnNames(dataset) : [];
      return res.status(200).json({
        success: true,
        mapping,
        dataset: dataset
          ? {
              datasetId: dataset.datasetId || dataset.id,
              name: dataset.name || dataset.fileName,
              columns: availableColumns
            }
          : null
      });
    }

    // If mapping not found in Mapping collection, verify dataset existence
    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: `Dataset or mapping with ID '${id}' not found.`
      });
    }

    // If dataset exists but no explicit Mapping document has been created
    const availableColumns = getDatasetColumnNames(dataset);
    const fallbackFieldMappings = (dataset.metadata?.columns || []).map((col) => ({
      sourceField: col.name,
      targetField: col.name,
      targetType: col.dataType === 'number' ? 'Float' : col.dataType === 'boolean' ? 'Boolean' : 'String',
      transformation: 'none',
      defaultValue: null,
      isRequired: false
    }));

    return res.status(200).json({
      success: true,
      isDefault: true,
      message: 'No custom field mapping stored yet. Returning dataset default columns.',
      mapping: {
        datasetId: dataset.datasetId || dataset.id,
        name: `Default Mapping for ${dataset.name || dataset.fileName}`,
        fieldMappings: fallbackFieldMappings,
        targetRole: dataset.mapping || {
          target: '',
          id: '',
          numerical: [],
          categorical: [],
          datetime: [],
          ignored: []
        },
        status: 'draft'
      },
      dataset: {
        datasetId: dataset.datasetId || dataset.id,
        name: dataset.name || dataset.fileName,
        columns: availableColumns
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update field mapping configuration
 * @route   PUT /api/mappings/:id
 * @route   PUT /api/mappings/:datasetId
 * @access  Public / Private
 */
const updateMapping = async (req, res, next) => {
  try {
    const id = req.params.id || req.params.datasetId;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Identifier parameter is required.'
      });
    }

    // Locate mapping document by mappingId, datasetId, or _id
    const mappingConditions = [{ datasetId: id }, { mappingId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      mappingConditions.push({ _id: id });
    }

    let mapping = await Mapping.findOne({ $or: mappingConditions });

    // Find associated dataset
    const datasetTargetId = mapping ? mapping.datasetId : id;
    const dataset = await findDataset(datasetTargetId, req.user ? req.user._id : null);

    if (!dataset && !mapping) {
      return res.status(404).json({
        success: false,
        message: `Mapping or dataset with ID '${id}' not found.`
      });
    }

    const availableColumns = dataset ? getDatasetColumnNames(dataset) : [];
    const datasetName = dataset ? dataset.name || dataset.fileName : datasetTargetId;

    // Normalize field mappings from request body
    const fieldMappings = normalizeFieldMappings(req.body);

    // Validate updated field mappings
    const validation = validateMappingConfiguration(fieldMappings, availableColumns, datasetName);
    if (!validation.isValid) {
      return res.status(validation.status).json({
        success: false,
        message: validation.message,
        invalidColumns: validation.invalidColumns,
        availableColumns: validation.availableColumns,
        duplicates: validation.duplicates
      });
    }

    // Extract targetRole metadata
    const targetRole = {
      target: req.body.target || req.body.targetRole?.target || '',
      id: req.body.id || req.body.targetRole?.id || '',
      numerical: req.body.numerical || req.body.targetRole?.numerical || [],
      categorical: req.body.categorical || req.body.targetRole?.categorical || [],
      datetime: req.body.datetime || req.body.targetRole?.datetime || [],
      ignored: req.body.ignored || req.body.targetRole?.ignored || []
    };

    if (!mapping) {
      // Upsert: Create mapping if not existing yet for this dataset
      mapping = await Mapping.create({
        mappingId: crypto.randomUUID(),
        datasetId: dataset.datasetId || id,
        userId: req.user ? req.user._id : dataset?.userId || null,
        name: req.body.name ? req.body.name.trim() : `Mapping for ${datasetName}`,
        description: req.body.description ? req.body.description.trim() : '',
        fieldMappings,
        targetRole,
        connections: req.body.connections || [],
        destinations: req.body.destinations || [],
        status: req.body.status || 'active'
      });
    } else {
      // Update existing document
      mapping.fieldMappings = fieldMappings;
      if (req.body.name) mapping.name = req.body.name.trim();
      if (req.body.description !== undefined) mapping.description = req.body.description.trim();
      if (req.body.targetRole || req.body.target || req.body.id) mapping.targetRole = targetRole;
      if (req.body.connections) mapping.connections = req.body.connections;
      if (req.body.destinations) mapping.destinations = req.body.destinations;
      if (req.body.status) mapping.status = req.body.status;
      if (req.user) mapping.userId = req.user._id;

      await mapping.save();
    }

    // Synchronize with dataset model
    if (dataset) {
      await syncDatasetMapping(dataset, fieldMappings, targetRole);
    }

    return res.status(200).json({
      success: true,
      message: 'Field mapping configuration updated successfully in MongoDB.',
      mapping
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all field mappings
 * @route   GET /api/mappings
 * @access  Public / Private
 */
const getAllMappings = async (req, res, next) => {
  try {
    const { datasetId, status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (datasetId) query.datasetId = datasetId;
    if (status) query.status = status;
    if (req.user) {
      query.$or = [{ userId: req.user._id }, { userId: null }, { userId: { $exists: false } }];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const mappings = await Mapping.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await Mapping.countDocuments(query);

    return res.status(200).json({
      success: true,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      mappings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete field mapping configuration
 * @route   DELETE /api/mappings/:id
 * @access  Public / Private
 */
const deleteMapping = async (req, res, next) => {
  try {
    const id = req.params.id || req.params.datasetId;

    const conditions = [{ mappingId: id }, { datasetId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      conditions.push({ _id: id });
    }

    const deleted = await Mapping.findOneAndDelete({ $or: conditions });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Field mapping with ID '${id}' not found.`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Field mapping configuration deleted successfully.',
      mappingId: deleted.mappingId
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMapping,
  getMappingByDatasetId,
  updateMapping,
  getAllMappings,
  deleteMapping,
  validateMappingConfiguration,
  normalizeFieldMappings,
  getDatasetColumnNames
};
