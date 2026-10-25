/**
 * User Mongoose Model.
 * 
 * Stores merchant authentication credentials.
 * Collection: 'user'
 */

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    tokenVersion: {
      type: Number,
      default: 1,
    },
    passwordChangedAt: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  {
    collection: 'user',
    timestamps: true,
  }
);

const User = mongoose.model('User', UserSchema);

module.exports = User;
