const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Temporary spool directory for incoming uploads before processing
const TEMP_DIR = path.join(os.tmpdir(), 'nexora_uploads');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
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

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.csv', '.json', '.jsonl'];
  const ext = path.extname(file.originalname).toLowerCase();

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

  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only CSV, JSON, and JSONL files are supported.'), false);
  }
};

const maxFileSize = parseInt(process.env.MAX_UPLOAD_SIZE_BYTES, 10) || 500 * 1024 * 1024; // 500MB default

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize
  },
  fileFilter
});

module.exports = upload;
