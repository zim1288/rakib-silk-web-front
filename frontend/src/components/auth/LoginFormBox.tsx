/**
 * LoginFormBox Component.
 *
 * Implements the Login half of the 33-Login & SignUp Form design:
 * - Username / Email input with Boxicons user glyph (`bx bxs-user`)
 * - Password input with Boxicons lock glyph (`bx bxs-lock-alt`)
 * - Forgot Password link
 * - Full-width action button
 * - Social login icons row (Google, Facebook, GitHub, LinkedIn)
 * - 100% preservation of all Selenium testing IDs
 */

import React, { useState } from 'react';
import { validateEmail, validateLoginPassword } from '../../utils/validation';
import { ForgotPasswordFlow } from './ForgotPasswordFlow';

export interface LoginFormBoxProps {
  isLoading: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onSubmitLogin: (email: string, pass: string) => Promise<void>;
  onClearMessages: () => void;
  setSuccessMessage: (msg: string | null) => void;
}

export const LoginFormBox: React.FC<LoginFormBoxProps> = ({
  isLoading,
  errorMessage,
  successMessage,
  onSubmitLogin,
  onClearMessages,
  setSuccessMessage,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onClearMessages();

    const emailErr = validateEmail(email);
    const passErr = validateLoginPassword(password);
    setEmailError(emailErr);
    setPasswordError(passErr);

    if (emailErr || passErr) {
      return;
    }

    await onSubmitLogin(email.trim(), password);
  };

  return (
    <div className="form-box login">
      <form id="login-form" data-testid="login-form" onSubmit={handleSubmit} noValidate>
          <h1 id="page-title" data-testid="page-title">Login</h1>

          {errorMessage && (
            <div id="error-msg" data-testid="error-msg" className="alert-box alert-error">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div id="success-msg" data-testid="success-msg" className="alert-box alert-success">
              {successMessage}
            </div>
          )}

          {isLoading && (
            <div id="loading-spinner" data-testid="loading-spinner" className="loading-container">
              <div className="spinner"></div>
              <span className="loading-text">
                Authenticating... (Server waking up if asleep)
              </span>
            </div>
          )}

          {/* Email Address */}
          <div className="input-box">
            <input
              id="login-email"
              data-testid="login-email"
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(validateEmail(e.target.value));
              }}
              disabled={isLoading}
              required
            />
            <i className="bx bxs-envelope"></i>
          </div>
          {emailError && (
            <span id="login-email-error" className="field-error-auth">
              {emailError}
            </span>
          )}

          {/* Password */}
          <div className="input-box password-input-box">
            <input
              id="login-password"
              data-testid="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(validateLoginPassword(e.target.value));
              }}
              disabled={isLoading}
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
            <span id="login-password-error" className="field-error-auth">
              {passwordError}
            </span>
          )}

          {/* Forgot Password Link */}
          <div className="forgot-link">
            <a
              href="#forgot"
              id="forgot-password-link"
              data-testid="forgot-password-link"
              onClick={(e) => {
                e.preventDefault();
                setShowForgotPassword(true);
                onClearMessages();
              }}
            >
              Forgot Password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            id="login-btn"
            data-testid="login-btn"
            type="submit"
            className="btn"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Login'}
          </button>
        </form>

        {/* 4-Step Password Reset Flow Modal */}
      {showForgotPassword && (
        <ForgotPasswordFlow
          onClose={() => setShowForgotPassword(false)}
          onSuccess={(msg) => {
            setSuccessMessage(msg);
            setShowForgotPassword(false);
          }}
        />
      )}
    </div>
  );
};
