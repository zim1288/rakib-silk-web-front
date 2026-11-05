/**
 * Authentication Express Routes.
 * 
 * Maps `/v1/auth` endpoints to authController actions.
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

// Rate Limiter: General authentication (login/register) - max 15 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate Limiter: OTP verification attempts (guards against brute forcing 6-digit codes) - max 10 attempts per 15 minutes per IP
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many verification attempts. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate Limiter: OTP dispatch / email sending - max 8 requests per 15 minutes per IP
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { error: 'Too many verification code requests. Please wait 15 minutes before requesting a new code.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Standard credentials
router.post('/login', authLimiter, authController.login);
router.post('/check', authLimiter, authController.checkAccount);
router.post('/send-verification', otpSendLimiter, authController.sendVerification);
router.post('/register', authLimiter, authController.register);

// Two-stage registration with 30-min MongoDB TTL
router.post('/register-pending', authLimiter, authController.registerPending);
router.post('/verify-registration', otpVerifyLimiter, authController.verifyRegistration);

// Multi-step password reset with device session invalidation
router.post('/request-password-reset', otpSendLimiter, authController.requestPasswordResetOtp);
router.post('/complete-password-reset', otpVerifyLimiter, authController.completePasswordReset);

// Smart OTP management
router.post('/resend-otp', otpSendLimiter, authController.resendOtp);
router.post('/verify-otp', otpVerifyLimiter, authController.verifyOtp);

// Multi-device session guard
router.post('/verify-session', authController.verifySession);

module.exports = router;
