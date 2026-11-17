const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Temporary spool directory for incoming uploads before processing/saving
const TEMP_DIR = path.join(os.tmpdir(), 'nexora_uploads');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Destination storage for local datasets
const LOCAL_STORAGE_DIR = path.join(__dirname, '..', 'uploads', 'datasets');
if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
  fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `dataset-${uniqueSuffix}${ext}`);
  }
});

// File validation filter: Only CSV and JSON formats
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.csv', '.json', '.jsonl'];

  const allowedMimeTypes = [
    'text/csv',
    'application/csv',
    'text/plain',
    'text/x-csv',
    'application/x-csv',
    'text/comma-separated-values',
    'text/x-comma-separated-values',
    'application/json',
    'application/x-ndjson'
  ];

  if (!allowedExtensions.includes(ext) && !allowedMimeTypes.includes(file.mimetype)) {
    const error = new Error('Unsupported file type. Only CSV and JSON formats (.csv, .json, .jsonl) are allowed.');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }

  cb(null, true);
};

// Max file size: 100MB default or from env
const MAX_FILE_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE_BYTES, 10) || 100 * 1024 * 1024; // 100MB

const multerInstance = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  },
  fileFilter
});

/**
 * Middleware wrapper to handle Multer validation errors gracefully
 */
const handleUpload = (req, res, next) => {
  const uploadSingle = multerInstance.single('file');

  uploadSingle(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          const sizeMb = Math.round(MAX_FILE_SIZE / (1024 * 1024));
          return res.status(400).json({
            success: false,
            message: `File size exceeds the limit of ${sizeMb}MB`
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
      }

      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading file'
      });
    }

    next();
  });
};

module.exports = {
  handleUpload,
  LOCAL_STORAGE_DIR,
  TEMP_DIR,
  MAX_FILE_SIZE
};
