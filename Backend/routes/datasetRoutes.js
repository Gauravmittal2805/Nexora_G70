const express = require('express');
const router = express.Router();
const { handleUpload } = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
  uploadDataset,
  getDatasets,
  getDatasetById,
  getDatasetPreview,
  getDatasetProfile,
  getFieldMapping,
  saveFieldMapping,
  getDatasetDownloadUrl,
  deleteDataset
} = require('../controllers/datasetController');

// All dataset routes require authentication
router.use(protect);

// @route   POST /api/datasets/upload
router.post('/upload', handleUpload, uploadDataset);

// @route   GET /api/datasets
router.get('/', getDatasets);

// @route   GET /api/datasets/:id
router.get('/:id', getDatasetById);

// @route   GET /api/datasets/:id/preview
router.get('/:id/preview', getDatasetPreview);

// @route   GET /api/datasets/:id/profile
router.get('/:id/profile', getDatasetProfile);

// @route   GET /api/datasets/:id/mapping
router.get('/:id/mapping', getFieldMapping);

// @route   POST /api/datasets/:id/mapping
router.post('/:id/mapping', saveFieldMapping);

// @route   GET /api/datasets/:id/download
router.get('/:id/download', getDatasetDownloadUrl);

// @route   DELETE /api/datasets/:id
router.delete('/:id', deleteDataset);

module.exports = router;
