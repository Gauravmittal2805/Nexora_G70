const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Individual source-to-target field mapping definition
 */
const fieldMappingItemSchema = new mongoose.Schema(
  {
    sourceField: {
      type: String,
      required: [true, 'sourceField is required'],
      trim: true
    },
    targetField: {
      type: String,
      required: [true, 'targetField is required'],
      trim: true
    },
    targetType: {
      type: String,
      trim: true,
      default: 'string'
    },
    transformation: {
      type: String,
      trim: true,
      default: 'none'
    },
    defaultValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    isRequired: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: false }
);

/**
 * Dataset Field Mapping schema
 */
const mappingSchema = new mongoose.Schema(
  {
    mappingId: {
      type: String,
      unique: true,
      required: true,
      default: () => crypto.randomUUID(),
      index: true
    },
    datasetId: {
      type: String,
      required: [true, 'datasetId is required'],
      index: true,
      trim: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true
    },
    name: {
      type: String,
      trim: true,
      default: 'Field Mapping Configuration'
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    fieldMappings: {
      type: [fieldMappingItemSchema],
      default: []
    },
    targetRole: {
      target: { type: String, default: '' },
      id: { type: String, default: '' },
      numerical: [{ type: String }],
      categorical: [{ type: String }],
      datetime: [{ type: String }],
      ignored: [{ type: String }]
    },
    connections: [
      {
        type: mongoose.Schema.Types.Mixed
      }
    ],
    destinations: [
      {
        type: mongoose.Schema.Types.Mixed
      }
    ],
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

mappingSchema.index({ datasetId: 1, createdAt: -1 });
mappingSchema.index({ userId: 1, datasetId: 1 });

module.exports = mongoose.model('Mapping', mappingSchema);
