/**
 * Field Validation Utilities for Silk & Fashion (Tally Khata).
 *
 * Implements strict, user-friendly client-side validation rules for:
 * - Email formatting
 * - Merchant passwords (uppercase, lowercase, number, special symbol)
 * - Saree model naming and length constraints
 * - Positive floating-point amounts (unit price, payments)
 * - Positive integers (piece counts, quantities)
 */

/**
 * Validates an email address against RFC compliant regex patterns.
 *
 * @param email - The input email string to test.
 * @returns Error message string if invalid, or null if valid.
 */
export function validateEmail(email: string): string | null {
  if (!email || !email.trim()) {
    return 'Email is required';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Email must be a valid email address (e.g. name@domain.com)';
  }
  return null;
}

/**
 * Validates a registration password against enterprise complexity standards:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one digit (0-9)
 * - At least one special character (!@#$%^&* etc.)
 *
 * @param password - The raw password string.
 * @returns Error message string if invalid, or null if valid.
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter (A-Z)';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter (a-z)';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number (0-9)';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    return 'Password must contain at least one special character or sign (!@#$%^&* etc.)';
  }
  return null;
}

/**
 * Validates password input during login.
 * Accepts any non-empty password to ensure 100% interoperability with both
 * 6-digit Android app credentials and web passwords.
 *
 * @param password - The entered password string.
 * @returns Error message string if invalid, or null if valid.
 */
export function validateLoginPassword(password: string): string | null {
  if (!password || !password.trim()) {
    return 'Password is required';
  }
  return null;
}

/**
 * Validates saree model name (presence and length cap).
 *
 * @param name - Saree model name string.
 * @returns Error message string if invalid, or null if valid.
 */
export function validateModelName(name: string): string | null {
  if (!name || !name.trim()) {
    return 'Model name is required';
  }
  if (name.trim().length > 50) {
    return 'Model name must be at most 50 characters';
  }
  return null;
}

/**
 * Validates a positive numerical value (strictly > 0).
 *
 * @param value - Numerical value or string representation.
 * @param fieldName - Human-readable field label used in the error message.
 * @returns Error message string if invalid, or null if valid.
 */
export function validatePositiveNumber(value: number | string, fieldName: string): string | null {
  if (value === '' || value === null || value === undefined) {
    return `${fieldName} is required`;
  }
  const num = Number(value);
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  if (num <= 0) {
    return `${fieldName} must be a number greater than 0`;
  }
  return null;
}

/**
 * Validates a positive whole integer (strictly an integer > 0).
 *
 * @param value - Numerical value or string representation.
 * @param fieldName - Human-readable field label used in the error message.
 * @returns Error message string if invalid, or null if valid.
 */
export function validatePositiveInteger(value: number | string, fieldName: string): string | null {
  const numCheck = validatePositiveNumber(value, fieldName);
  if (numCheck) return numCheck;
  const num = Number(value);
  if (!Number.isInteger(num)) {
    return `${fieldName} must be a whole number greater than 0`;
  }
  return null;
}
