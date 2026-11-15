const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  dataType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'date', 'object', 'array', 'mixed', 'null'],
    default: 'string'
  },
  nullCount: {
    type: Number,
    default: 0
  },
  sampleValues: [{
    type: mongoose.Schema.Types.Mixed
  }]
}, { _id: false });

const datasetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Dataset name is required'],
    trim: true,
    maxlength: [120, 'Dataset name cannot exceed 120 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  originalFilename: {
    type: String,
    required: true
  },
  fileFormat: {
    type: String,
    required: true,
    enum: ['csv', 'json', 'jsonl'],
    lowercase: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileSizeBytes: {
    type: Number,
    required: true
  },
  storage: {
    provider: {
      type: String,
      enum: ['backblaze_b2', 's3', 'local'],
      default: 'backblaze_b2'
    },
    bucket: {
      type: String,
      default: 'local'
    },
    key: {
      type: String,
      required: true
    },
    localPath: {
      type: String,
      default: null
    },
    eTag: {
      type: String,
      default: null
    }
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'ready', 'failed'],
    default: 'uploading',
    index: true
  },
  errorMessage: {
    type: String,
    default: null
  },
  metadata: {
    rowCount: {
      type: Number,
      default: 0
    },
    columnCount: {
      type: Number,
      default: 0
    },
    columns: [columnSchema],
    delimiter: {
      type: String,
      default: ','
    }
  },
  // Store top 20-50 rows for instant rendering in frontend table preview
  previewData: [{
    type: mongoose.Schema.Types.Mixed
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  visibility: {
    type: String,
    enum: ['private', 'public', 'shared'],
    default: 'private'
  }
}, {
  timestamps: true
});

// Indexes for query performance
datasetSchema.index({ user: 1, createdAt: -1 });
datasetSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Dataset', datasetSchema);
