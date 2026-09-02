export function normalizeAllowedDomains(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
  }
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email, allowedDomains = []) {
  const domains = normalizeAllowedDomains(allowedDomains);
  if (!domains.length) return true;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const at = normalizedEmail.lastIndexOf('@');
  if (at < 0) return false;
  return domains.includes(normalizedEmail.slice(at + 1));
}

export function canAccessAdmin({ isAuthenticated, role }) {
  return Boolean(isAuthenticated && role === 'admin');
}
