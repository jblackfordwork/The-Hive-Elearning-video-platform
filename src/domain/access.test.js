import test from 'node:test';
import assert from 'node:assert/strict';
import { isEmailAllowed, canAccessAdmin, normalizeAllowedDomains } from './access.js';

test('email restriction accepts configured domains and fails closed when empty', () => {
  assert.equal(isEmailAllowed('student@students.geneseeisd.org', ['students.geneseeisd.org']), true);
  assert.equal(isEmailAllowed('TEACHER@GENESEEISD.ORG', ['geneseeisd.org']), true);
  assert.equal(isEmailAllowed('person@gmail.com', ['geneseeisd.org']), false);
  assert.equal(isEmailAllowed('person@gmail.com', []), false);
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

test('default policy only accepts exact school domains and rejects malformed addresses', () => {
  for (const email of ['student@students.geneseeisd.org', 'TEACHER@GENESEEISD.ORG']) {
    assert.equal(isEmailAllowed(email), true);
  }
  for (const email of ['person@gmail.com', 'x@geneseeisd.org.evil.com', 'x@other.geneseeisd.org', 'x@y@geneseeisd.org', '@geneseeisd.org', '', null]) {
    assert.equal(isEmailAllowed(email), false, String(email));
  }
});
