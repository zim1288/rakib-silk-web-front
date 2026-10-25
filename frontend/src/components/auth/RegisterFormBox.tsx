/**
 * RegisterFormBox Component.
 *
 * Implements the Registration panel matching Rakib Silk & Fashion's exact authentication fields:
 * - Email input with Boxicons envelope glyph (`bx bxs-envelope`)
 * - Password input with Boxicons lock glyph (`bx bxs-lock-alt`)
 * - Full-width action button
 * - 100% preservation of all Selenium testing IDs
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { validateEmail, validatePassword } from '../../utils/validation';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { OtpVerificationView } from './OtpVerificationView';
import {
  generateOtp,
  sendOtpEmail,
  getOrDispatchOtp,
  resendFreshOtp,
  getStoredOtpSession,
} from '../../services/emailService';
import { BASE_URL } from '../../services/api';

export interface RegisterFormBoxProps {
  isLoading: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onSubmitRegister: (email: string, pass: string) => Promise<void>;
  onClearMessages: () => void;
}

export const RegisterFormBox: React.FC<RegisterFormBoxProps> = ({
  isLoading,
  errorMessage,
  successMessage,
  onSubmitRegister,
  onClearMessages,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Mandatory 6-Digit OTP Verification State
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [expectedOtp, setExpectedOtp] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isOtpAlreadyActive, setIsOtpAlreadyActive] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onClearMessages();
    setSendError(null);

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    setEmailError(emailErr);
    setPasswordError(passErr);

    if (emailErr || passErr) {
      return;
    }

    setIsSendingOtp(true);
    try {
      // 1. Attempt two-stage pending registration in backend
      try {
        const backendRes = await fetch(`${BASE_URL}/auth/register-pending`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        });

        if (backendRes.status === 409) {
          setSendError('Email is already registered. Please proceed to login.');
          setIsSendingOtp(false);
          return;
        }

        if (backendRes.ok) {
          const data = await backendRes.json();
          setIsOtpAlreadyActive(Boolean(data.alreadySent));
          setShowOtpVerification(true);
          return;
        }
      } catch (backendErr) {
        console.warn('Backend register-pending unavailable, falling back to smart client OTP dispatch...');
      }

      // 2. Client-side smart 30-min OTP check & dispatch fallback
      const result = await getOrDispatchOtp(email, 'Silk & Fashion account verification');
      if (!result.success) {
        setSendError(result.error || 'Failed to dispatch verification email. Please check your network.');
        return;
      }

      setExpectedOtp(result.code);
      setIsOtpAlreadyActive(result.alreadyActive);
      setShowOtpVerification(true);
    } catch (err) {
      setSendError('Unable to send verification code. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  return (
    <div className="form-box register">
      <form id="register-form" data-testid="register-form" onSubmit={handleSubmit} noValidate>
        <h1 id="page-title" data-testid="page-title">Registration</h1>

        {errorMessage && (
          <div id="error-msg" data-testid="error-msg" className="alert-box alert-error">
            {errorMessage}
          </div>
        )}

        {sendError && (
          <div className="alert-box alert-error">
            {sendError}
          </div>
        )}

        {successMessage && (
          <div id="success-msg" data-testid="success-msg" className="alert-box alert-success">
            {successMessage}
          </div>
        )}

        {(isLoading || isSendingOtp) && (
          <div id="loading-spinner" data-testid="loading-spinner" className="loading-container">
            <div className="spinner"></div>
            <span className="loading-text">
              {isSendingOtp ? 'Sending 6-digit confirmation code...' : 'Finalizing verified account...'}
            </span>
          </div>
        )}

        {/* Email */}
        <div className="input-box">
          <input
            id="register-email"
            data-testid="register-email"
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(validateEmail(e.target.value));
            }}
            disabled={isLoading || isSendingOtp}
            required
          />
          <i className="bx bxs-envelope"></i>
        </div>
        {emailError && (
          <span id="register-email-error" className="field-error-auth">
            {emailError}
          </span>
        )}

        {/* Password */}
        <div className="input-box password-input-box">
          <input
            id="register-password"
            data-testid="register-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(validatePassword(e.target.value));
            }}
            disabled={isLoading || isSendingOtp}
            required
          />
          <div className="password-icons-group">
            <button
              type="button"
              className="eye-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide password' : 'Show password'}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'}`}></i>
            </button>
            <span className="lock-icon-wrapper" aria-hidden="true">
              <i className="bx bxs-lock-alt"></i>
            </span>
          </div>
        </div>
        {passwordError && (
          <span id="register-password-error" className="field-error-auth">
            {passwordError}
          </span>
        )}

        {/* Strong Password Indicator & Requirements Checklist */}
        <PasswordStrengthMeter password={password} />

        {/* Action Button */}
        <button
          id="register-btn"
          data-testid="register-btn"
          type="submit"
          className="btn"
          style={{ marginTop: '16px' }}
          disabled={isLoading || isSendingOtp}
        >
          {isSendingOtp ? 'Sending Verification Code...' : 'Register'}
        </button>
      </form>

      {/* Mandatory 6-Digit Email OTP Verification Modal */}
      {showOtpVerification &&
        createPortal(
          <div className="forgot-password-modal-backdrop">
            <div className="forgot-password-modal-content">
              <OtpVerificationView
                email={email}
                purposeText="account verification"
                isAlreadyActive={isOtpAlreadyActive}
                onVerify={async (enteredCode) => {
                  try {
                    const res = await fetch(`${BASE_URL}/auth/verify-registration`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: email.trim().toLowerCase(), code: enteredCode }),
                    });
                    if (res.ok) {
                      return true;
                    }
                  } catch (err) {
                    console.warn('Backend verify-registration unavailable, checking session code...');
                  }

                  const active = getStoredOtpSession(email, 'Silk & Fashion account verification');
                  if (active && active.code === enteredCode) {
                    return true;
                  }
                  return enteredCode === expectedOtp;
                }}
                onSuccess={async () => {
                  setShowOtpVerification(false);
                  await onSubmitRegister(email.trim(), password);
                }}
                onResend={async () => {
                  try {
                    const res = await fetch(`${BASE_URL}/auth/resend-otp`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: email.trim().toLowerCase(), purpose: 'registration' }),
                    });
                    if (res.ok) {
                      setIsOtpAlreadyActive(false);
                      return;
                    }
                  } catch (err) {
                    console.warn('Backend resend unavailable, falling back to client resend...');
                  }

                  const resendRes = await resendFreshOtp(email, 'Silk & Fashion account verification');
                  if (resendRes.success) {
                    setExpectedOtp(resendRes.newCode);
                    setIsOtpAlreadyActive(false);
                  }
                }}
                onBack={() => setShowOtpVerification(false)}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

