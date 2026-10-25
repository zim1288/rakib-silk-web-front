/**
 * UserLog Mongoose Model.
 * 
 * Multi-tenant polymorphic ledger collection storing:
 * - Saree inventory catalog items (dataType: 'inventory')
 * - Loom production batches (dataType: 'production')
 * - Financial ledger cashflow records (dataType: 'transaction')
 * 
 * Collection: 'user-log'
 */

const mongoose = require('mongoose');

const UserLogSchema = new mongoose.Schema(
  {
    // Record domain discriminator
    dataType: {
      type: String,
      required: true,
      index: true,
      enum: ['inventory', 'production', 'transaction'],
    },
    // Multi-tenant isolation key (owner's email)
    email: {
      type: String,
      required: true,
      index: true,
    },
    // Unique item/batch/transaction numeric ID
    id: {
      type: Number,
      required: true,
      index: true,
    },

    // Inventory Catalog Fields
    modelName: { type: String, trim: true },
    brandCategory: { type: String, trim: true },
    unitPrice: { type: Number, default: 0 },
    pieceCount: { type: Number, default: 0 },
    imageUrl: { type: String, default: null },

    // Loom Production Fields
    quantity: { type: Number, default: 0 },
    estimatedCompletionDate: { type: String },
    status: { type: String },

    // Transaction & Cashflow Fields
    type: { type: String }, // HOUSE, PRODUCTION, PURCHASE_IN, SELL_OUT / SALE
    totalAmount: { type: Number, default: 0 },
    timestamp: { type: Number },
    dateString: { type: String },

    // Customer Directory Association
    customerName: { type: String, trim: true },
    customerNumber: { type: String, trim: true },

    // Soft deletion flags
    isDeleted: { type: Boolean, default: false },
    lastModified: { type: Number, default: Date.now },
  },
  {
    collection: 'user-log',
    strict: false, // Allows additional dynamic fields without schema violation
    timestamps: true,
  }
);

// Compound indexes for optimal tenant and data type lookup performance
UserLogSchema.index({ email: 1, dataType: 1 });
UserLogSchema.index({ email: 1, dataType: 1, id: 1 });

const UserLog = mongoose.model('UserLog', UserLogSchema);

module.exports = UserLog;
