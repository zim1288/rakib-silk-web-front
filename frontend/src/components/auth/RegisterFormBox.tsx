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
import { BASE_URL } from '../../services/api';

export interface RegisterFormBoxProps {
  isLoading: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onSubmitRegister?: (email: string, pass: string) => Promise<void>;
  onRegistrationSuccess?: (email: string) => void;
  onClearMessages: () => void;
}

export const RegisterFormBox: React.FC<RegisterFormBoxProps> = ({
  isLoading,
  errorMessage,
  successMessage,
  onSubmitRegister,
  onRegistrationSuccess,
  onClearMessages,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Mandatory 6-Digit OTP Verification State
  const [showOtpVerification, setShowOtpVerification] = useState(false);
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

      const errData = await backendRes.json().catch(() => ({}));
      setSendError(errData.error || 'Failed to initiate registration. Please try again.');
    } catch (err) {
      setSendError('Unable to connect to server to send verification code. Please check your connection.');
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
            onBlur={(e) => {
              if (e.target.value.trim()) {
                setEmailError(validateEmail(e.target.value));
              }
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
                      body: JSON.stringify({ email: email.trim().toLowerCase(), code: enteredCode.trim() }),
                    });
                    return res.ok;
                  } catch (err) {
                    return false;
                  }
                }}
                onSuccess={async () => {
                  setShowOtpVerification(false);
                  if (onRegistrationSuccess) {
                    onRegistrationSuccess(email.trim());
                  } else if (onSubmitRegister) {
                    await onSubmitRegister(email.trim(), password);
                  }
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
                    }
                  } catch (err) {
                    console.warn('Failed to request OTP resend:', err);
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

