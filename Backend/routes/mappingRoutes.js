const express = require('express');
const router = express.Router();
const { optionalProtect } = require('../middleware/authMiddleware');
const {
  createMapping,
  getMappingByDatasetId,
  updateMapping,
  getAllMappings,
  deleteMapping
} = require('../controllers/mappingController');

// Attach user authentication context if JWT Bearer token is provided
router.use(optionalProtect);

// @route   POST /api/mappings - Create field mapping configuration
// @route   GET /api/mappings - Get all field mappings
router.route('/')
  .post(createMapping)
  .get(getAllMappings);

// @route   GET /api/mappings/:datasetId - Get field mapping by datasetId or mappingId
// @route   PUT /api/mappings/:datasetId - Update field mapping
// @route   PATCH /api/mappings/:datasetId - Partial update field mapping
// @route   DELETE /api/mappings/:datasetId - Delete field mapping
router.route('/:datasetId')
  .get(getMappingByDatasetId)
  .put(updateMapping)
  .patch(updateMapping)
  .delete(deleteMapping);

module.exports = router;
