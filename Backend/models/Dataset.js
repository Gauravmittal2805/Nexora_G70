const mongoose = require('mongoose');
const crypto = require('crypto');

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
  datasetId: {
    type: String,
    unique: true,
    required: true,
    default: () => crypto.randomUUID(),
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true
  },
  fileType: {
    type: String,
    required: [true, 'File type is required'],
    enum: {
      values: ['csv', 'json', 'jsonl'],
      message: '{VALUE} is not a supported file type. Only csv, json, or jsonl allowed'
    },
    lowercase: true
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required']
  },
  storageUrl: {
    type: String,
    required: [true, 'Storage URL is required']
  },
  // Additional rich metadata for analytics, preview & B2 integration
  name: {
    type: String,
    trim: true,
    maxlength: [120, 'Dataset name cannot exceed 120 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  mimeType: {
    type: String
  },
  storage: {
    provider: {
      type: String,
      enum: ['local', 'backblaze_b2', 's3'],
      default: 'local'
    },
    bucket: {
      type: String,
      default: 'local'
    },
    key: {
      type: String
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
    default: 'ready',
    index: true
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
  previewData: [{
    type: mongoose.Schema.Types.Mixed
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  mapping: {
    target: { type: String, default: '' },
    id: { type: String, default: '' },
    numerical: [{ type: String }],
    categorical: [{ type: String }],
    datetime: [{ type: String }],
    ignored: [{ type: String }]
  },
  profile: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for user query performance and text search
datasetSchema.index({ userId: 1, createdAt: -1 });
datasetSchema.index({ fileName: 'text', name: 'text', description: 'text' });

module.exports = mongoose.model('Dataset', datasetSchema);
