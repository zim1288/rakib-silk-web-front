/**
 * Authentication Controller.
 * 
 * Handles merchant registration, login credential validation,
 * account existence checks, two-stage pending registration with 30-min MongoDB TTL,
 * smart OTP management (30-min validity & 2-min resend revocation), and
 * multi-device session invalidation on password change.
 */

const crypto = require('crypto');
const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const OtpToken = require('../models/OtpToken');

/**
 * Generates a cryptographically secure 6-digit numeric OTP code.
 */
function generate6DigitOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Helper to dispatch OTP email via EmailJS API.
 */
async function sendEmailJsOtp(email, code, purpose = 'Silk & Fashion account verification') {
  const serviceId = process.env.EMAILJS_SERVICE_ID || 'service_gifq25t';
  const templateId = process.env.EMAILJS_TEMPLATE_ID || 'template_fxkonbp';
  const userId = process.env.EMAILJS_USER_ID || 'S-Rf-rtEkTugqgxM4';

  const emailJsData = {
    service_id: serviceId,
    template_id: templateId,
    user_id: userId,
    template_params: {
      to_email: email,
      email: email,
      purpose: purpose,
      passcode: code,
      code: code,
      otp: code,
      time: new Date(Date.now() + 30 * 60000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  };

  if (process.env.EMAILJS_PRIVATE_KEY) {
    emailJsData.accessToken = process.env.EMAILJS_PRIVATE_KEY;
  }

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emailJsData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('EmailJS dispatch failure:', errorText);
    throw new Error('EmailJS dispatch failure: ' + errorText);
  }

  console.log(`✉️ OTP email dispatched to ${email} for [${purpose}] via EmailJS`);
  return true;
}

/**
 * Step 1 of Registration: Stage unverified user in PendingRegistration (30-min TTL)
 * and check for an active OTP within the previous 30 minutes.
 * POST /v1/auth/register-pending
 */
async function registerPending(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check if user already exists as an active verified account
    const existingUser = await User.findOne({ email: normalizedEmail, isVerified: true });
    if (existingUser) {
      return res.status(409).json({ error: 'Email is already registered. Please login.' });
    }

    // 2. Save or update the pending registration (resets 30-min TTL window)
    await PendingRegistration.findOneAndUpdate(
      { email: normalizedEmail },
      { email: normalizedEmail, password, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // 3. Check if there is an active OTP request created within the previous 30 minutes
    const now = new Date();
    const activeToken = await OtpToken.findOne({
      email: normalizedEmail,
      purpose: 'registration',
      expiresAt: { $gt: now },
    });

    if (activeToken) {
      // User already has a valid OTP within 30 minutes - do NOT send a duplicate email
      return res.status(200).json({
        status: 'pending',
        alreadySent: true,
        message: 'A verification code was already dispatched to your email within the last 30 minutes. Please enter it below.',
      });
    }

    // 4. No active OTP or expired: Generate new OTP and dispatch via EmailJS
    const otp = generate6DigitOtp();
    const expiresAt = new Date(Date.now() + 30 * 60000); // 30-minute validity

    await OtpToken.findOneAndUpdate(
      { email: normalizedEmail, purpose: 'registration' },
      { email: normalizedEmail, purpose: 'registration', code: otp, expiresAt, lastSentAt: now, createdAt: now },
      { upsert: true, new: true }
    );

    await sendEmailJsOtp(normalizedEmail, otp, 'Silk & Fashion account verification');

    return res.status(200).json({
      status: 'pending',
      alreadySent: false,
      message: 'A 6-digit confirmation code has been sent to your email. Please check your inbox.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Step 2 of Registration: Verify OTP and finalize official account in User collection.
 * POST /v1/auth/verify-registration
 */
async function verifyRegistration(req, res, next) {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date();

    // 1. Verify OTP token
    const token = await OtpToken.findOne({
      email: normalizedEmail,
      purpose: 'registration',
      code: code.trim(),
      expiresAt: { $gt: now },
    });

    if (!token) {
      return res.status(400).json({ error: 'Invalid or expired verification code. Please check your inbox or request a new code.' });
    }

    // 2. Fetch pending registration details
    const pending = await PendingRegistration.findOne({ email: normalizedEmail });
    if (!pending) {
      return res.status(404).json({ error: 'Registration session expired (exceeded 30 minutes). Please sign up again.' });
    }

    // 3. Promote into official User collection
    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        password: pending.password,
        tokenVersion: 1,
        passwordChangedAt: new Date(),
        isVerified: true,
      },
      { upsert: true, new: true }
    );

    // 4. Cleanup pending registration and consumed OTP token
    await PendingRegistration.deleteOne({ email: normalizedEmail });
    await OtpToken.deleteOne({ _id: token._id });

    return res.status(200).json({
      status: 'ok',
      email: user.email,
      tokenVersion: user.tokenVersion,
      message: 'Email successfully verified! Welcome to Silk & Fashion.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Step 1 of Forgot Password: Check user existence and check for active OTP within 30 minutes.
 * POST /v1/auth/request-password-reset
 */
async function requestPasswordResetOtp(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check if user exists in the primary User collection
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ error: 'No merchant account found with this email address.' });
    }

    // 2. Check if there is an active OTP created within the previous 30 minutes
    const now = new Date();
    const activeToken = await OtpToken.findOne({
      email: normalizedEmail,
      purpose: 'password_reset',
      expiresAt: { $gt: now },
    });

    if (activeToken) {
      return res.status(200).json({
        status: 'ok',
        alreadySent: true,
        message: 'A verification code was already dispatched to your email within the last 30 minutes. Please enter it below.',
      });
    }

    // 3. No active code: Generate and dispatch fresh 6-digit OTP
    const otp = generate6DigitOtp();
    const expiresAt = new Date(Date.now() + 30 * 60000);

    await OtpToken.findOneAndUpdate(
      { email: normalizedEmail, purpose: 'password_reset' },
      { email: normalizedEmail, purpose: 'password_reset', code: otp, expiresAt, lastSentAt: now, createdAt: now },
      { upsert: true, new: true }
    );

    await sendEmailJsOtp(normalizedEmail, otp, 'Silk & Fashion password reset');

    return res.status(200).json({
      status: 'ok',
      alreadySent: false,
      message: 'A 6-digit confirmation code has been sent to your email. Please check your inbox.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Resend OTP: Automatically revokes any previous OTP and issues a fresh 6-digit code.
 * POST /v1/auth/resend-otp
 */
async function resendOtp(req, res, next) {
  try {
    const { email, purpose } = req.body;
    if (!email || !purpose) {
      return res.status(400).json({ error: 'Email and purpose are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date();

    // Check lastSentAt for 2-minute cooldown enforcement if desired
    const existing = await OtpToken.findOne({ email: normalizedEmail, purpose });
    if (existing && existing.lastSentAt) {
      const elapsedMs = now.getTime() - existing.lastSentAt.getTime();
      if (elapsedMs < 118000) { // allow a 2s clock skew tolerance
        const remainingSec = Math.ceil((120000 - elapsedMs) / 1000);
        return res.status(429).json({ error: `Please wait ${remainingSec}s before requesting a new code.` });
      }
    }

    // Invalidate previous OTP by generating a brand-new code and updating record
    const newOtp = generate6DigitOtp();
    const expiresAt = new Date(Date.now() + 30 * 60000);

    await OtpToken.findOneAndUpdate(
      { email: normalizedEmail, purpose },
      { email: normalizedEmail, purpose, code: newOtp, expiresAt, lastSentAt: now, createdAt: now },
      { upsert: true, new: true }
    );

    const purposeTitle = purpose === 'registration' ? 'Silk & Fashion account verification' : 'Silk & Fashion password reset';
    await sendEmailJsOtp(normalizedEmail, newOtp, purposeTitle);

    return res.status(200).json({
      status: 'ok',
      message: 'A new 6-digit code has been dispatched. Your previous code has been invalidated.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Verify OTP without consuming it (used to step forward to password change UI).
 * POST /v1/auth/verify-otp
 */
async function verifyOtp(req, res, next) {
  try {
    const { email, purpose, code } = req.body;
    if (!email || !purpose || !code) {
      return res.status(400).json({ error: 'Email, purpose, and code are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date();

    const token = await OtpToken.findOne({
      email: normalizedEmail,
      purpose,
      code: code.trim(),
      expiresAt: { $gt: now },
    });

    if (!token) {
      return res.status(400).json({ valid: false, error: 'Invalid or expired verification code.' });
    }

    return res.status(200).json({ valid: true });
  } catch (err) {
    next(err);
  }
}

/**
 * Step 3 of Forgot Password: Apply new password and FORCE LOGOUT on all other devices.
 * POST /v1/auth/complete-password-reset
 */
async function completePasswordReset(req, res, next) {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and newPassword are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date();

    // 1. Verify OTP
    const token = await OtpToken.findOne({
      email: normalizedEmail,
      purpose: 'password_reset',
      code: code.trim(),
      expiresAt: { $gt: now },
    });

    if (!token) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    // 2. Fetch User and update password + increment tokenVersion
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ error: 'Merchant account not found.' });
    }

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 1) + 1; // Increment version: immediately revokes all other devices!
    user.passwordChangedAt = new Date();
    await user.save();

    // 3. Delete consumed OTP
    await OtpToken.deleteOne({ _id: token._id });

    return res.status(200).json({
      status: 'ok',
      message: 'Password successfully updated. All other devices have been logged out.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Session verification: verifies if a client session tokenVersion matches the current User tokenVersion.
 * If password was changed on another device, tokenVersion will not match, forcing logout.
 * POST /v1/auth/verify-session
 */
async function verifySession(req, res, next) {
  try {
    const { email, tokenVersion } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ error: 'SESSION_REVOKED', message: 'User account not found.' });
    }

    if (tokenVersion !== undefined && user.tokenVersion !== tokenVersion) {
      return res.status(401).json({
        error: 'SESSION_REVOKED',
        message: 'Your password was changed from another device. Please sign in again with your new password.',
      });
    }

    return res.status(200).json({ status: 'ok', tokenVersion: user.tokenVersion });
  } catch (err) {
    next(err);
  }
}

/**
 * Validate merchant login credentials.
 * POST /v1/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Dual verification: match plain text or SHA-256 hash (used by Android app)
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const userPasswordHash = crypto.createHash('sha256').update(user.password).digest('hex');
    const isMatch = (user.password === password) ||
                    (user.password === passwordHash) ||
                    (userPasswordHash === password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    return res.status(200).json({
      status: 'ok',
      email: user.email,
      tokenVersion: user.tokenVersion || 1,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Verify whether an account exists by email.
 * POST /v1/auth/check
 */
async function checkAccount(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
}

/**
 * Dispatch verification passcode email via EmailJS API.
 * POST /v1/auth/send-verification
 */
async function sendVerification(req, res, next) {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    await sendEmailJsOtp(normalizedEmail, code, 'Silk & Fashion account verification');
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
}

/**
 * Direct Register fallback for legacy / test scripts.
 * POST /v1/auth/register
 */
async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { email: normalizedEmail, password, tokenVersion: 1, isVerified: true },
      { upsert: true, new: true }
    );

    return res.status(200).json({ status: 'ok', email: user.email, tokenVersion: user.tokenVersion });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  checkAccount,
  sendVerification,
  registerPending,
  verifyRegistration,
  requestPasswordResetOtp,
  resendOtp,
  verifyOtp,
  completePasswordReset,
  verifySession,
};
