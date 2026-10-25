/**
 * Email Dispatch & Smart OTP Session Service.
 *
 * Implements:
 * - Direct EmailJS dispatch (`service_gifq25t`, `template_fxkonbp`, `S-Rf-rtEkTugqgxM4`)
 * - Cryptographically random 6-digit OTP generation
 * - 30-minute OTP expiration tracking
 * - Smart 30-minute reuse check (prevents duplicate emails if requested < 30 mins ago)
 * - Immediate revocation of previous codes when requesting a resend
 * - Dual-layer support: Works with backend endpoints and client-side fallback
 */

import { BASE_URL } from './api';

const EMAILJS_CONFIG = {
  serviceId: 'service_gifq25t',
  templateId: 'template_fxkonbp',
  publicKey: 'S-Rf-rtEkTugqgxM4',
};

export interface OtpSessionRecord {
  code: string;
  createdAt: number;
  expiresAt: number;
  lastSentAt: number;
}

/**
 * Generates a cryptographically sound random 6-digit numeric OTP code.
 */
export function generateOtp(): string {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  const code = 100000 + (array[0] % 900000);
  return code.toString();
}

/**
 * Storage key helper for active OTP sessions.
 */
function getStorageKey(email: string, purpose: string): string {
  return `silk_otp_${email.trim().toLowerCase()}_${purpose.trim().toLowerCase()}`;
}

/**
 * Retrieves an active OTP session for an email and purpose.
 * Automatically clears and returns null if the 30-minute window has elapsed.
 */
export function getStoredOtpSession(email: string, purpose: string): OtpSessionRecord | null {
  try {
    const raw = sessionStorage.getItem(getStorageKey(email, purpose));
    if (!raw) return null;
    const session: OtpSessionRecord = JSON.parse(raw);
    const now = Date.now();
    if (now >= session.expiresAt) {
      sessionStorage.removeItem(getStorageKey(email, purpose));
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Persists an active OTP session with a 30-minute validity duration.
 */
export function saveOtpSession(email: string, purpose: string, code: string): OtpSessionRecord {
  const now = Date.now();
  const session: OtpSessionRecord = {
    code,
    createdAt: now,
    expiresAt: now + 30 * 60 * 1000, // 30 minutes validity
    lastSentAt: now,
  };
  try {
    sessionStorage.setItem(getStorageKey(email, purpose), JSON.stringify(session));
  } catch (err) {
    console.warn('Unable to persist OTP session to storage:', err);
  }
  return session;
}

/**
 * Immediately revokes and wipes an OTP session (used when resending code).
 */
export function invalidateOtpSession(email: string, purpose: string): void {
  try {
    sessionStorage.removeItem(getStorageKey(email, purpose));
  } catch (err) {
    console.warn('Unable to remove OTP session:', err);
  }
}

/**
 * Dispatches a 6-digit verification code to the target email address using EmailJS.
 */
export async function sendOtpEmail(
  email: string,
  otp: string,
  purpose: string = 'Silk & Fashion account verification'
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  // 30-minute expiration display format
  const expirationTime = new Date(Date.now() + 30 * 60000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const payload = {
    service_id: EMAILJS_CONFIG.serviceId,
    template_id: EMAILJS_CONFIG.templateId,
    user_id: EMAILJS_CONFIG.publicKey,
    template_params: {
      email: normalizedEmail,
      to_email: normalizedEmail,
      passcode: otp,
      code: otp,
      otp: otp,
      purpose: purpose,
      time: expirationTime,
    },
  };

  // Attempt 1: Direct EmailJS API call
  try {
    const directRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (directRes.ok) {
      console.log('✅ OTP email dispatched successfully via EmailJS direct API');
      return { success: true };
    }
  } catch (directErr) {
    console.warn('⚠️ Direct EmailJS fetch failed, trying backend proxy...', directErr);
  }

  // Attempt 2: Backend proxy fallback
  try {
    const proxyRes = await fetch(`${BASE_URL}/auth/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: normalizedEmail,
        code: otp,
      }),
    });

    if (proxyRes.ok) {
      console.log('✅ OTP email dispatched successfully via Backend Proxy');
      return { success: true };
    }

    const errData = await proxyRes.json().catch(() => ({}));
    return {
      success: false,
      error: errData.error || 'Unable to deliver verification code. Please check your network.',
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: 'Network connection failure while sending verification email.',
    };
  }
}

/**
 * Smart OTP Dispatcher:
 * Checks if there is an active OTP requested within the previous 30 minutes.
 * - If YES: does NOT send a duplicate email, reuses the active code.
 * - If NO (or expired): generates a new 6-digit OTP, sends it, and saves a 30-minute session.
 */
export async function getOrDispatchOtp(
  email: string,
  purpose: string
): Promise<{ success: boolean; code: string; alreadyActive: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = getStoredOtpSession(normalizedEmail, purpose);

  // If already requested within 30 minutes, reuse existing code
  if (existing) {
    return {
      success: true,
      code: existing.code,
      alreadyActive: true,
    };
  }

  // Otherwise, issue fresh OTP
  const newOtp = generateOtp();
  const res = await sendOtpEmail(normalizedEmail, newOtp, purpose);
  if (!res.success) {
    return {
      success: false,
      code: '',
      alreadyActive: false,
      error: res.error,
    };
  }

  saveOtpSession(normalizedEmail, purpose, newOtp);
  return {
    success: true,
    code: newOtp,
    alreadyActive: false,
  };
}

/**
 * Resend OTP Dispatcher:
 * Immediately invalidates any prior OTP (even if < 30 mins) and dispatches a new code.
 */
export async function resendFreshOtp(
  email: string,
  purpose: string
): Promise<{ success: boolean; newCode: string; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  // Invalidate old code immediately
  invalidateOtpSession(normalizedEmail, purpose);

  // Issue new code
  const newOtp = generateOtp();
  const res = await sendOtpEmail(normalizedEmail, newOtp, purpose);
  if (!res.success) {
    return {
      success: false,
      newCode: '',
      error: res.error,
    };
  }

  saveOtpSession(normalizedEmail, purpose, newOtp);
  return {
    success: true,
    newCode: newOtp,
  };
}
