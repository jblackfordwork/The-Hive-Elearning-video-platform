import test from 'node:test';
import assert from 'node:assert/strict';
import { isEmailAllowed, canAccessAdmin, normalizeAllowedDomains } from './access.js';

test('email restriction accepts configured domains case-insensitively and allows all when empty', () => {
  assert.equal(isEmailAllowed('student@students.geneseeisd.org', ['students.geneseeisd.org']), true);
  assert.equal(isEmailAllowed('TEACHER@GENESEEISD.ORG', ['geneseeisd.org']), true);
  assert.equal(isEmailAllowed('person@gmail.com', ['geneseeisd.org']), false);
  assert.equal(isEmailAllowed('person@gmail.com', []), true);
});

test('normalizes allowed domains pasted with the GitHub variable name', () => {
  assert.deepEqual(
    normalizeAllowedDomains('VITE_ALLOWED_EMAIL_DOMAINS = students.geneseeisd.org,geneseeisd.org'),
    ['students.geneseeisd.org', 'geneseeisd.org'],
  );
});

test('admin access requires an authenticated admin profile', () => {
  assert.equal(canAccessAdmin({ isAuthenticated: true, role: 'admin' }), true);
  assert.equal(canAccessAdmin({ isAuthenticated: true, role: 'student' }), false);
  assert.equal(canAccessAdmin({ isAuthenticated: false, role: 'admin' }), false);
});
