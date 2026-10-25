/**
 * PendingRegistration Mongoose Model.
 * 
 * Stores unverified merchant registration signups temporarily.
 * Equipped with MongoDB TTL index so that unverified records automatically
 * self-delete after 30 minutes (1800 seconds), preventing user lockouts.
 * 
 * Collection: 'pending_registrations'
 */

const mongoose = require('mongoose');

const PendingRegistrationSchema = new mongoose.Schema(
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
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 1800, // MongoDB TTL index: automatically purges document after 30 minutes (1800s)
    },
  },
  {
    collection: 'pending_registrations',
  }
);

const PendingRegistration = mongoose.model('PendingRegistration', PendingRegistrationSchema);

module.exports = PendingRegistration;
