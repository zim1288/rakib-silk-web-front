/**
 * Field Validation Utilities for Silk & Fashion (Tally Khata).
 *
 * Implements strict, user-friendly client-side validation rules for:
 * - Email formatting (syntax, RFC compliance, dummy/throwaway domain detection, typo suggestions)
 * - Merchant passwords (uppercase, lowercase, number, special symbol)
 * - Saree model naming and length constraints
 * - Positive floating-point amounts (unit price, payments)
 * - Positive integers (piece counts, quantities)
 */

/**
 * Known disposable / throwaway / burner email providers.
 */
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'tempmail.net', 'tempmailaddress.com',
  'mailinator.com', 'mailinater.com', 'suremail.info', 'reconmail.com',
  '10minutemail.com', '10minutemail.net', '10minutemail.org', '10minutemail.co.uk',
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.biz', 'guerrillamail.org',
  'guerrillamailblock.com', 'grr.la', 'sharklasers.com',
  'yopmail.com', 'yopmail.fr', 'yopmail.net', 'cool.fr.nf', 'jetable.fr.nf',
  'trashmail.com', 'trashmail.net', 'trashmail.me', 'trashmail.io',
  'throwawaymail.com', 'throwaway.email',
  'dispostable.com',
  'fakemailgenerator.com',
  'burnermail.io',
  'inboxkitten.com',
  'mytemp.email',
  'generator.email',
  'emailondeck.com',
  'mohmal.com', 'mohmal.im', 'mohmal.tech',
  'getairmail.com',
  'fakeinbox.com',
  'maildrop.cc',
  'harakirimail.com',
  'crazymailing.com',
  'tmail.com',
  'nada.ltd',
  'getnada.com',
  'dropmail.me',
  'mintemail.com',
  'tempinbox.com',
  'byom.de',
  'trash-mail.com',
  'spambog.com',
  'anonymousemail.me'
]);

/**
 * Common misspellings and typos for major email providers.
 */
export const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmaild.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yaho.co': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yaho.cm': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotmale.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlokk.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'outlook.co': 'outlook.com',
  'iclud.com': 'icloud.com',
  'iclou.com': 'icloud.com',
  'icloud.con': 'icloud.com',
  'icloud.co': 'icloud.com',
};

/**
 * Common placeholder / dummy domains that are not real user mailboxes.
 */
export const DUMMY_DOMAINS = new Set([
  'test.com', 'example.com', 'fake.com', 'dummy.com', 'sample.com',
  'asdf.com', 'qwerty.com', 'xyz.com', 'abc.com', 'none.com', 'nowhere.com'
]);

/**
 * Validates an email address against RFC syntax rules, TLD requirements,
 * disposable burner blacklists, common typos, and placeholder dummy domains.
 *
 * @param email - The input email string to test.
 * @returns Error message string if invalid, or null if valid.
 */
export function validateEmail(email: string): string | null {
  if (!email || !email.trim()) {
    return 'Email is required';
  }

  const cleanEmail = email.trim();

  // Basic sanity / length limits (RFC 5321)
  if (cleanEmail.length > 254) {
    return 'Email address is too long (maximum 254 characters)';
  }

  // Must contain exactly one @
  const atParts = cleanEmail.split('@');
  if (atParts.length !== 2) {
    return 'Email must contain a valid username and domain separated by @ (e.g. name@domain.com)';
  }

  const [localPart, domain] = atParts;

  // Local part validation
  if (!localPart || localPart.length === 0) {
    return 'Email username before @ cannot be empty';
  }
  if (localPart.length > 64) {
    return 'Email username cannot exceed 64 characters';
  }

  // Domain structure validation
  if (!domain || domain.length === 0) {
    return 'Email domain after @ cannot be empty (e.g. @gmail.com)';
  }
  if (domain.includes('..')) {
    return 'Email domain cannot contain consecutive dots (..)';
  }
  if (!domain.includes('.')) {
    return `Incomplete email domain "${domain}". Did you forget the extension (e.g. @gmail.com or @yahoo.com)?`;
  }

  // Domain must contain a valid dot and alphabetic TLD (min 2 characters: .com, .org, .net, .bd, .co, etc.)
  const domainParts = domain.toLowerCase().split('.');
  const tld = domainParts[domainParts.length - 1];

  if (!/^[a-zA-Z]{2,24}$/.test(tld)) {
    return `".${tld}" is not a valid domain extension. Please enter a valid email address (e.g. name@domain.com)`;
  }

  // General RFC-compliant regex syntax check
  const rfcRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!rfcRegex.test(cleanEmail)) {
    return 'Email contains invalid characters or an invalid format (e.g. name@domain.com)';
  }

  const lowerDomain = domain.toLowerCase();

  // 1. Detect Disposable / Temporary Burner Email Services
  if (DISPOSABLE_EMAIL_DOMAINS.has(lowerDomain)) {
    return `Temporary / burner email services (@${lowerDomain}) are not permitted. Please use a permanent email address (e.g. Gmail, Yahoo, Outlook, or official work email).`;
  }

  // 2. Detect Common Typo Domains (e.g., @gmai.com -> @gmail.com)
  if (COMMON_DOMAIN_TYPOS[lowerDomain]) {
    const suggested = COMMON_DOMAIN_TYPOS[lowerDomain];
    return `It looks like a typo in your email domain "@${lowerDomain}". Did you mean "@${suggested}"?`;
  }

  // 3. Detect Obvious Dummy / Placeholder Domains
  if (DUMMY_DOMAINS.has(lowerDomain)) {
    return `Placeholder domain "@${lowerDomain}" cannot be registered. Please enter a real, active email address.`;
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
