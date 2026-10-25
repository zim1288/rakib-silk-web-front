/**
 * PasswordStrengthMeter Component.
 * 
 * Interactive password security evaluator adapted from 113-Strong Password:
 * - Real-time calculation of password strength (Weak, Medium, Strong)
 * - Animated multi-stage progress meter
 * - 5 requirement validation badges:
 *   1. Minimum 8 characters
 *   2. At least one uppercase letter (A-Z)
 *   3. At least one lowercase letter (a-z)
 *   4. At least one numeric digit (0-9)
 *   5. At least one special symbol (@#$ etc.)
 */

import React from 'react';

export interface PasswordStrengthMeterProps {
  /** Current password input value */
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  // Criteria checks
  const isMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const score = [isMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  // Strength calculations
  let strengthLabel = 'Weak';
  let strengthColor = '#dc2626';
  let badgeColor = '#b91c1c';
  let barWidth = '5%';
  let shieldClass = 'ri-shield-line';
  let shieldBg = '#fee2e2';
  let badgeBorder = '#fecaca';

  if (password.length > 0) {
    if (score <= 1) {
      strengthLabel = 'Weak';
      strengthColor = '#dc2626';
      badgeColor = '#b91c1c';
      barWidth = '20%';
      shieldClass = 'ri-shield-line';
      shieldBg = '#fee2e2';
      badgeBorder = '#fecaca';
    } else if (score <= 3) {
      strengthLabel = 'Medium';
      strengthColor = '#d97706';
      badgeColor = '#b45309';
      barWidth = '65%';
      shieldClass = 'ri-shield-check-line';
      shieldBg = '#fef3c7';
      badgeBorder = '#fde68a';
    } else {
      strengthLabel = 'Strong';
      strengthColor = '#16a34a';
      badgeColor = '#15803d';
      barWidth = '100%';
      shieldClass = 'ri-shield-check-fill';
      shieldBg = '#dcfce7';
      badgeBorder = '#bbf7d0';
    }
  }

  const requirements = [
    { id: 'chars', label: 'At least 8 Characters', valid: isMinLength, fullWidth: false },
    { id: 'AtoZ', label: 'One uppercase letter (A-Z)', valid: hasUppercase, fullWidth: false },
    { id: 'atoz', label: 'One lowercase letter (a-z)', valid: hasLowercase, fullWidth: false },
    { id: 'num', label: 'One Number (0-9)', valid: hasNumber, fullWidth: false },
    { id: 'speChar', label: 'One special character (@#$)', valid: hasSpecial, fullWidth: true },
  ];

  return (
    <div className="password-strength-card" data-testid="password-strength-card">
      {/* Strength Header */}
      <div className="strength-header">
        <div className="strength-label-group">
          <span className="strength-title">Password Strength</span>
          <strong className="strength-status-text" style={{ color: strengthColor }}>
            {strengthLabel}
          </strong>
        </div>

        <span
          className="strength-shield-badge"
          style={{ color: badgeColor, backgroundColor: shieldBg, borderColor: badgeBorder }}
          title={`Status: ${strengthLabel}`}
        >
          {score >= 4 ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            </svg>
          ) : score >= 2 ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          )}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="strength-bar-track">
        <div
          className="strength-bar-fill"
          style={{
            width: barWidth,
            backgroundColor: strengthColor,
          }}
        ></div>
      </div>

      {/* Requirements Header */}
      <div className="requirements-header">
        <span className="requirements-title">Password Requirements</span>
        <i className="bx bx-info-circle requirements-info-icon" title="Required for strong security"></i>
      </div>

      {/* 2-Column Requirements List */}
      <div className="requirements-grid">
        {requirements.map((req) => (
          <div
            key={req.id}
            id={req.id}
            className={`requirement-badge ${req.valid ? 'valid' : ''} ${req.fullWidth ? 'span-full' : ''}`}
          >
            <span className="requirement-check-circle">
              <i className="bx bx-check"></i>
            </span>
            <span className="requirement-label">{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
