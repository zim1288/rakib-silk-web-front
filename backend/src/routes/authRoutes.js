/**
 * Authentication Express Routes.
 * 
 * Maps `/v1/auth` endpoints to authController actions.
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Standard credentials
router.post('/login', authController.login);
router.post('/check', authController.checkAccount);
router.post('/send-verification', authController.sendVerification);
router.post('/register', authController.register);

// Two-stage registration with 30-min MongoDB TTL
router.post('/register-pending', authController.registerPending);
router.post('/verify-registration', authController.verifyRegistration);

// Multi-step password reset with device session invalidation
router.post('/request-password-reset', authController.requestPasswordResetOtp);
router.post('/complete-password-reset', authController.completePasswordReset);

// Smart OTP management
router.post('/resend-otp', authController.resendOtp);
router.post('/verify-otp', authController.verifyOtp);

// Multi-device session guard
router.post('/verify-session', authController.verifySession);

module.exports = router;
