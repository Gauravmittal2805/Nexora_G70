const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
  uploadDataset,
  getDatasets,
  getDatasetById,
  getDatasetPreview,
  getDatasetDownloadUrl,
  downloadLocalFile,
  deleteDataset
} = require('../controllers/datasetController');

// All dataset routes require authentication
router.use(protect);

// @route   POST /api/datasets/upload
router.post('/upload', upload.single('file'), uploadDataset);

// @route   GET /api/datasets
router.get('/', getDatasets);

// @route   GET /api/datasets/:id
router.get('/:id', getDatasetById);

// @route   GET /api/datasets/:id/preview
router.get('/:id/preview', getDatasetPreview);

// @route   GET /api/datasets/:id/download
router.get('/:id/download', getDatasetDownloadUrl);

// @route   GET /api/datasets/file/:key (development local download)
router.get('/file/:key', downloadLocalFile);

// @route   DELETE /api/datasets/:id
router.delete('/:id', deleteDataset);

module.exports = router;
