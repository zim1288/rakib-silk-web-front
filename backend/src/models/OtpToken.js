/**
 * OtpToken Mongoose Model.
 * 
 * Stores time-limited 6-digit OTP verification codes with 30-minute validity.
 * Equipped with MongoDB TTL index so expired codes automatically self-delete after 30 minutes.
 * When a user requests a resend, previous codes for the email/purpose are immediately revoked.
 * 
 * Collection: 'otp_tokens'
 */

const mongoose = require('mongoose');

const OtpTokenSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email address is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['registration', 'password_reset'],
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 1800, // MongoDB TTL index: automatically deletes document after 30 minutes (1800s)
    },
  },
  {
    collection: 'otp_tokens',
  }
);

// Compound index to guarantee uniqueness per email + purpose (one active code at a time)
OtpTokenSchema.index({ email: 1, purpose: 1 }, { unique: true });

const OtpToken = mongoose.model('OtpToken', OtpTokenSchema);

module.exports = OtpToken;
