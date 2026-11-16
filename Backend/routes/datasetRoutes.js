const express = require('express');
const router = express.Router();
const { handleUpload } = require('../middleware/uploadMiddleware');
const { optionalProtect } = require('../middleware/authMiddleware');
const {
  uploadDataset,
  getDatasets,
  getDatasetById,
  getDatasetPreview,
  getDatasetDownloadUrl,
  deleteDataset,
  getDatasetMapping,
  saveDatasetMapping,
  transformDatasetRows,
  transformRecordEndpoint
} = require('../controllers/datasetController');

// All dataset routes use optionalProtect: attaches req.user if JWT Bearer token is provided
router.use(optionalProtect);

// @route   POST /api/datasets/transform/record
router.post('/transform/record', transformRecordEndpoint);

// @route   POST /api/datasets/upload
router.post('/upload', handleUpload, uploadDataset);

// @route   GET /api/datasets
router.get('/', getDatasets);

// @route   GET /api/datasets/:id
router.get('/:id', getDatasetById);

// @route   GET /api/datasets/:id/preview
router.get('/:id/preview', getDatasetPreview);

// @route   GET /api/datasets/:id/download
router.get('/:id/download', getDatasetDownloadUrl);

// @route   DELETE /api/datasets/:id
router.delete('/:id', deleteDataset);

// @route   GET /api/datasets/:id/mapping
router.get('/:id/mapping', getDatasetMapping);

// @route   POST /api/datasets/:id/mapping
router.post('/:id/mapping', saveDatasetMapping);

// @route   POST /api/datasets/:id/transform
router.post('/:id/transform', transformDatasetRows);

module.exports = router;
