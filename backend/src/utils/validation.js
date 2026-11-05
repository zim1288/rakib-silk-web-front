/**
 * Field Validation Utilities for Silk & Fashion Backend.
 *
 * Implements strict server-side validation rules to guard against:
 * - Malformed email addresses
 * - Incomplete domains (e.g. user@gmail without .com)
 * - Temporary / disposable burner emails (e.g. tempmail, mailinator, guerrillamail)
 * - Common typo domains (e.g. gmai.com, yaho.com)
 * - Dummy / placeholder domains (e.g. test.com, fake.com)
 */

const DISPOSABLE_EMAIL_DOMAINS = new Set([
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

const COMMON_DOMAIN_TYPOS = {
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

const DUMMY_DOMAINS = new Set([
  'test.com', 'example.com', 'fake.com', 'dummy.com', 'sample.com',
  'asdf.com', 'qwerty.com', 'xyz.com', 'abc.com', 'none.com', 'nowhere.com'
]);

/**
 * Validates an email address against RFC syntax, TLD rules,
 * disposable burner blacklists, common typos, and placeholder dummy domains.
 *
 * @param {string} email
 * @returns {string | null} Error message or null if valid
 */
function validateEmail(email) {
  if (!email || !email.trim()) {
    return 'Email is required';
  }

  const cleanEmail = email.trim();

  if (cleanEmail.length > 254) {
    return 'Email address is too long (maximum 254 characters)';
  }

  const atParts = cleanEmail.split('@');
  if (atParts.length !== 2) {
    return 'Email must contain a valid username and domain separated by @ (e.g. name@domain.com)';
  }

  const [localPart, domain] = atParts;

  if (!localPart || localPart.length === 0) {
    return 'Email username before @ cannot be empty';
  }
  if (localPart.length > 64) {
    return 'Email username cannot exceed 64 characters';
  }

  if (!domain || domain.length === 0) {
    return 'Email domain after @ cannot be empty (e.g. @gmail.com)';
  }
  if (domain.includes('..')) {
    return 'Email domain cannot contain consecutive dots (..)';
  }
  if (!domain.includes('.')) {
    return `Incomplete email domain "${domain}". Did you forget the extension (e.g. @gmail.com or @yahoo.com)?`;
  }

  const domainParts = domain.toLowerCase().split('.');
  const tld = domainParts[domainParts.length - 1];

  if (!/^[a-zA-Z]{2,24}$/.test(tld)) {
    return `".${tld}" is not a valid domain extension. Please enter a valid email address (e.g. name@domain.com)`;
  }

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

module.exports = {
  validateEmail,
  DISPOSABLE_EMAIL_DOMAINS,
  COMMON_DOMAIN_TYPOS,
  DUMMY_DOMAINS,
};
