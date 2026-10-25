/**
 * Tenant Email Header Extraction Middleware.
 * 
 * Inspects incoming request headers for 'X-User-Email' to enforce multi-tenant isolation.
 * Defaults to 'anonymous' if no header is present (matching legacy behavior).
 */

function extractTenantEmail(req, res, next) {
  const headerEmail = req.header('X-User-Email');
  req.userEmail = headerEmail && headerEmail.trim() ? headerEmail.trim().toLowerCase() : 'anonymous';
  next();
}

module.exports = {
  extractTenantEmail,
};
