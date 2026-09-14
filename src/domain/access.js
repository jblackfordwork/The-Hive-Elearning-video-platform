export const ALLOWED_EMAIL_DOMAINS = Object.freeze(['students.geneseeisd.org', 'geneseeisd.org']);
export const DOMAIN_ACCESS_MESSAGE = 'Please sign in with your Genesee ISD student or staff account.';

export function normalizeAllowedDomains(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
  }
  return String(value || '')
    .replace(/^VITE_ALLOWED_EMAIL_DOMAINS\s*=\s*/i, '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email, allowedDomains = ALLOWED_EMAIL_DOMAINS) {
  const domains = normalizeAllowedDomains(allowedDomains);
  if (!domains.length) return false;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const at = normalizedEmail.lastIndexOf('@');
  if (at <= 0 || normalizedEmail.indexOf('@') !== at || /\s/.test(normalizedEmail)) return false;
  return domains.includes(normalizedEmail.slice(at + 1));
}

export function canAccessAdmin({ isAuthenticated, role }) {
  return Boolean(isAuthenticated && role === 'admin');
}
