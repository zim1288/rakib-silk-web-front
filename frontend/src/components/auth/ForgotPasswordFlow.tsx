/**
 * ForgotPasswordFlow Component.
 *
 * Implements a secure 4-step password reset workflow:
 * - Step 1 (Request): User submits registered email address
 * - Step 2 (Verify OTP): 6-digit individual input pills with EmailJS delivery
 * - Step 3 (New Password): Password input with 113-Strong Password evaluator
 * - Step 4 (Success): Confirmation view with return to login action
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { validateEmail, validatePassword } from '../../utils/validation';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { OtpVerificationView } from './OtpVerificationView';
import { BASE_URL } from '../../services/api';
import {
  getOrDispatchOtp,
  getStoredOtpSession,
  resendFreshOtp,
} from '../../services/emailService';

export interface ForgotPasswordFlowProps {
  /** Callback to close the modal or return to login */
  onClose: () => void;
  /** Callback to pass success message back to the login view */
  onSuccess: (msg: string) => void;
}

export const ForgotPasswordFlow: React.FC<ForgotPasswordFlowProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState<'request' | 'verify' | 'reset' | 'success'>('request');

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Verified OTP code to pass forward to final reset step
  const [verifiedOtpCode, setVerifiedOtpCode] = useState<string>('');
  const [isOtpAlreadyActive, setIsOtpAlreadyActive] = useState(false);

  // New password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Step 1: Submit email to request OTP (smart 30-min window check)
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;

    setIsLoading(true);
    try {
      const backendRes = await fetch(`${BASE_URL}/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        setIsOtpAlreadyActive(Boolean(data.alreadySent));
        setStep('verify');
        return;
      }

      const contentType = backendRes.headers.get('content-type') || '';
      // If the backend returns a JSON 404, it means the merchant account genuinely doesn't exist
      if (backendRes.status === 404 && contentType.includes('application/json')) {
        const data = await backendRes.json().catch(() => ({}));
        setGeneralError(data.error || 'No merchant account found with this email address.');
        return;
      }

      // Legacy backend compatibility: If the backend does not have /auth/request-password-reset (HTML 404)
      if (backendRes.status === 404) {
        try {
          const checkRes = await fetch(`${BASE_URL}/auth/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim().toLowerCase() }),
          });

          if (!checkRes.ok) {
            setGeneralError('No merchant account found with this email address.');
            return;
          }
        } catch {
          // Continue if check ping fails
        }

        const dispatchRes = await getOrDispatchOtp(email, 'Silk & Fashion password reset');
        if (!dispatchRes.success) {
          setGeneralError(dispatchRes.error || 'Failed to dispatch verification email. Please try again.');
          return;
        }

        setVerifiedOtpCode(dispatchRes.code);
        setIsOtpAlreadyActive(dispatchRes.alreadyActive);
        setStep('verify');
        return;
      }

      const data = await backendRes.json().catch(() => ({}));
      setGeneralError(data.error || 'Failed to dispatch reset code. Please try again.');
    } catch (err: unknown) {
      // Network failure: Attempt direct smart client dispatch fallback
      try {
        const dispatchRes = await getOrDispatchOtp(email, 'Silk & Fashion password reset');
        if (dispatchRes.success) {
          setVerifiedOtpCode(dispatchRes.code);
          setIsOtpAlreadyActive(dispatchRes.alreadyActive);
          setStep('verify');
          return;
        }
      } catch {
        // Fall through
      }
      setGeneralError('Connection error. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOtp = async (enteredCode: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          purpose: 'password_reset',
          code: enteredCode.trim(),
        }),
      });
      if (res.ok) {
        setVerifiedOtpCode(enteredCode.trim());
        return true;
      }
      if (res.status === 400 || res.status === 401) {
        return false;
      }
    } catch (err) {
      // Fall through to session check on network or 404
    }

    const session = getStoredOtpSession(email, 'Silk & Fashion password reset');
    if (session && session.code === enteredCode.trim()) {
      setVerifiedOtpCode(enteredCode.trim());
      return true;
    }
    return false;
  };

  const handleOtpSuccess = () => {
    setStep('reset');
  };

  const handleResendOtp = async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          purpose: 'password_reset',
        }),
      });
      if (res.ok) {
        setIsOtpAlreadyActive(false);
        return;
      }
    } catch (err) {
      console.warn('Failed to resend backend reset OTP:', err);
    }

    const resendRes = await resendFreshOtp(email, 'Silk & Fashion password reset');
    if (resendRes.success) {
      setVerifiedOtpCode(resendRes.newCode);
      setIsOtpAlreadyActive(false);
    }
  };

  // Step 3: Submit new password (FORCES LOGOUT ON ALL OTHER DEVICES)
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const passErr = validatePassword(newPassword);
    setPasswordError(passErr);

    let matchErr: string | null = null;
    if (newPassword !== confirmPassword) {
      matchErr = 'Passwords do not match';
    }
    setConfirmError(matchErr);

    if (passErr || matchErr) return;

    setIsLoading(true);
    try {
      const resetRes = await fetch(`${BASE_URL}/auth/complete-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: verifiedOtpCode,
          newPassword,
        }),
      });

      if (resetRes.ok) {
        sessionStorage.removeItem('rakib_user_email');
        sessionStorage.removeItem('rakib_token_version');
        setStep('success');
        return;
      }

      // Legacy backend compatibility: If complete-password-reset returns 404
      if (resetRes.status === 404) {
        const legacyRes = await fetch(`${BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: newPassword,
          }),
        });

        if (legacyRes.ok) {
          sessionStorage.removeItem('rakib_user_email');
          sessionStorage.removeItem('rakib_token_version');
          setStep('success');
          return;
        }
      }

      const errData = await resetRes.json().catch(() => ({}));
      setGeneralError(errData.error || 'Failed to update password. Please check your verification code and try again.');
    } catch (err) {
      setGeneralError('Network error while updating password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="forgot-password-modal-backdrop">
      <div className="forgot-password-modal-content">
        {/* Step 1: Request Email */}
        {step === 'request' && (
          <form onSubmit={handleRequestSubmit} noValidate>
            <div className="flow-header">
              <div className="flow-icon-circle">
                <i className="bx bxs-key"></i>
              </div>
              <h2>Reset Password</h2>
              <p>Enter your registered email address to receive a 6-digit verification code.</p>
            </div>

            {generalError && <div className="alert-box alert-error">{generalError}</div>}

            <div className="input-box">
              <input
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
                disabled={isLoading}
                required
              />
              <i className="bx bxs-envelope"></i>
            </div>
            {emailError && <span className="field-error-auth">{emailError}</span>}

            <button type="submit" className="btn" style={{ marginTop: '20px' }} disabled={isLoading}>
              {isLoading ? 'Checking & Sending Code...' : 'Send Verification Code'}
            </button>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button type="button" className="btn-text-link" onClick={onClose} disabled={isLoading}>
                Cancel & Return to Login
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 'verify' && (
          <OtpVerificationView
            email={email}
            purposeText="password reset"
            isAlreadyActive={isOtpAlreadyActive}
            onVerify={handleVerifyOtp}
            onSuccess={handleOtpSuccess}
            onResend={handleResendOtp}
            onBack={() => setStep('request')}
          />
        )}

        {/* Step 3: Create New Password (113-Strong Password) */}
        {step === 'reset' && (
          <form onSubmit={handleResetSubmit} noValidate>
            <div className="flow-header">
              <div className="flow-icon-circle">
                <i className="bx bxs-lock-open-alt"></i>
              </div>
              <h2>Create New Password</h2>
              <p>Choose a strong and secure password for your account.</p>
            </div>

            {generalError && <div className="alert-box alert-error">{generalError}</div>}

            {/* New Password */}
            <div className="input-box password-input-box">
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordError) setPasswordError(validatePassword(e.target.value));
                }}
                disabled={isLoading}
                required
              />
              <div className="password-icons-group">
                <button
                  type="button"
                  className="eye-toggle-btn"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  <i className={`bx ${showNewPassword ? 'bx-hide' : 'bx-show'}`}></i>
                </button>
                <span className="lock-icon-wrapper" aria-hidden="true">
                  <i className="bx bxs-lock-alt"></i>
                </span>
              </div>
            </div>
            {passwordError && <span className="field-error-auth">{passwordError}</span>}

            {/* Confirm New Password */}
            <div className="input-box password-input-box" style={{ marginTop: '12px' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmError) setConfirmError(null);
                }}
                disabled={isLoading}
                required
              />
              <div className="password-icons-group">
                <button
                  type="button"
                  className="eye-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  <i className={`bx ${showConfirmPassword ? 'bx-hide' : 'bx-show'}`}></i>
                </button>
                <span className="lock-icon-wrapper" aria-hidden="true">
                  <i className="bx bxs-lock-alt"></i>
                </span>
              </div>
            </div>
            {confirmError && <span className="field-error-auth">{confirmError}</span>}

            {/* Reusable Strong Password Evaluator & 5 Requirements */}
            <PasswordStrengthMeter password={newPassword} />

            <button type="submit" className="btn" style={{ marginTop: '16px' }} disabled={isLoading}>
              {isLoading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}

        {/* Step 4: Success Screen */}
        {step === 'success' && (
          <div className="flow-success-screen">
            <div className="flow-success-icon">
              <i className="bx bx-check-shield"></i>
            </div>
            <h2>Password Changed!</h2>
            <p>Your password has been successfully updated. You can now login with your new credentials.</p>
            <button
              type="button"
              className="btn"
              style={{ marginTop: '24px' }}
              onClick={() => {
                onSuccess('Password reset successfully! Please sign in with your new password.');
                onClose();
              }}
            >
              Proceed to Login
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
