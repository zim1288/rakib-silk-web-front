/**
 * OtpVerificationView Component.
 *
 * Implements the 6-digit OTP verification flow inspired by 101-Verification:
 * - 6 individual digit input pills with auto-advance, backspace handling, and paste support
 * - Auto-submission when 6 digits are complete
 * - Animated verification transition (loading spinner -> success checkmark)
 * - 120-second resend cooldown timer
 * - Strict security: Never renders the raw passcode in the DOM or UI
 */

import React, { useState, useEffect, useRef } from 'react';

export interface OtpVerificationViewProps {
  /** Target email where code was dispatched */
  email: string;
  /** Verification handler comparing user input against the expected OTP */
  onVerify: (enteredCode: string) => Promise<boolean>;
  /** Callback when user successfully verifies */
  onSuccess: () => void;
  /** Callback when user requests a new OTP */
  onResend: () => Promise<void>;
  /** Optional callback to cancel or return to previous screen */
  onBack?: () => void;
  /** Purpose description (e.g. "account verification" or "password reset") */
  purposeText?: string;
  /** Whether the code is an existing active code requested within the previous 30 minutes */
  isAlreadyActive?: boolean;
}

export const OtpVerificationView: React.FC<OtpVerificationViewProps> = ({
  email,
  onVerify,
  onSuccess,
  onResend,
  onBack,
  purposeText = 'account verification',
  isAlreadyActive = false,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(120);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // 120-second cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Focus the first input pill on initial mount
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Handle single digit input
  const handleInputChange = (index: number, val: string) => {
    if (status === 'verifying' || status === 'success') return;
    if (status === 'error') {
      setStatus('idle');
      setErrorMessage(null);
    }

    const cleanVal = val.replace(/[^0-9]/g, '');
    const char = cleanVal.slice(-1); // Take latest typed digit

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are provided
    const combined = newDigits.join('');
    if (combined.length === 6) {
      triggerVerification(combined);
    }
  };

  // Keyboard navigation & backspace support
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (status === 'error') {
        setStatus('idle');
        setErrorMessage(null);
      }
      if (!digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  // Full 6-digit clipboard paste support
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasteData) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pasteData.length; i++) {
      newDigits[i] = pasteData[i];
    }
    setDigits(newDigits);

    if (pasteData.length === 6) {
      inputsRef.current[5]?.focus();
      triggerVerification(pasteData);
    } else {
      inputsRef.current[pasteData.length]?.focus();
    }
  };

  // Execution flow when 6 digits are entered
  const triggerVerification = async (enteredCode: string) => {
    setStatus('verifying');
    setErrorMessage(null);

    // Smooth animation counter
    setProgressPercent(0);
    const startTime = performance.now();
    const duration = 1200;

    const tick = (now: number) => {
      const elapsed = Math.min((now - startTime) / duration, 1);
      setProgressPercent(Math.round(elapsed * 100));
      if (elapsed < 1) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);

    try {
      const isValid = await onVerify(enteredCode);

      // Brief delay so user sees verifying completion
      setTimeout(() => {
        if (isValid) {
          setStatus('success');
          setTimeout(() => {
            onSuccess();
          }, 900);
        } else {
          setStatus('error');
          setErrorMessage('Invalid verification code. Please check your inbox and try again.');
          // Reset digits and focus first pill
          setDigits(['', '', '', '', '', '']);
          inputsRef.current[0]?.focus();
        }
      }, 800);
    } catch (err) {
      setStatus('error');
      setErrorMessage('Verification failed due to a network error. Please try again.');
    }
  };

  const handleResendClick = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage(null);
    try {
      await onResend();
      setCooldown(120);
      setDigits(['', '', '', '', '', '']);
      setStatus('idle');
      inputsRef.current[0]?.focus();
    } catch (err) {
      setErrorMessage('Failed to resend code. Please wait a moment and try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="otp-verification-card" data-testid="otp-verification-card">
      {/* Header */}
      <div className="otp-header">
        <div className="otp-shield-icon">
          <i className="bx bxs-shield-check"></i>
        </div>
        <h2 className="otp-title">
          {status === 'verifying'
            ? 'Verifying Code...'
            : status === 'success'
            ? 'Verification Complete!'
            : 'Enter Verification Code'}
        </h2>
        <p className="otp-subtitle">
          {status === 'verifying'
            ? 'Securely verifying your security credentials...'
            : status === 'success'
            ? 'Access authenticated successfully. Redirecting...'
            : isAlreadyActive
            ? 'A 6-digit verification code was already dispatched to your email in the last 30 minutes. Please enter it below.'
            : `A 6-digit confirmation code has been sent to your email for ${purposeText} (valid for 30 minutes).`}
        </p>
        {status === 'idle' && (
          <span className="otp-target-email">{email}</span>
        )}
      </div>

      {/* Stage: Input Pills vs Verifying Spinner vs Success Badge */}
      <div className="otp-stage">
        {status === 'verifying' ? (
          <div className="otp-verifying-wrap">
            <div className="otp-spinner-ring"></div>
            <span className="otp-percent-text">{progressPercent}%</span>
          </div>
        ) : status === 'success' ? (
          <div className="otp-success-wrap">
            <div className="otp-success-circle">
              <i className="bx bx-check"></i>
            </div>
            <span className="otp-verified-badge">VERIFIED</span>
          </div>
        ) : (
          <div className={`otp-pills-row ${status === 'error' ? 'shake-animation' : ''}`}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputsRef.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                onFocus={(e) => e.target.select()}
                className={`otp-input-pill ${digit ? 'filled' : ''} ${status === 'error' ? 'pill-error' : ''}`}
                aria-label={`Digit ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="otp-error-banner" data-testid="otp-error">
          <i className="bx bx-error-circle"></i>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Resend Action & Timer */}
      {status !== 'success' && status !== 'verifying' && (
        <div className="otp-footer-actions">
          <button
            type="button"
            className="otp-resend-btn"
            onClick={handleResendClick}
            disabled={cooldown > 0 || isResending}
          >
            {isResending ? (
              'Resending code...'
            ) : cooldown > 0 ? (
              <>
                Didn&apos;t receive it? <span>Resend in {cooldown}s</span>
              </>
            ) : (
              <>
                Didn&apos;t receive it? <span className="active-resend">Resend Code</span>
              </>
            )}
          </button>

          {onBack && (
            <button type="button" className="otp-back-link" onClick={onBack}>
              <i className="bx bx-arrow-back"></i> Back / Change Email
            </button>
          )}
        </div>
      )}
    </div>
  );
};
