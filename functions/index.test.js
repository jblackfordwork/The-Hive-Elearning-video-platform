import test from 'node:test';
import assert from 'node:assert/strict';
import { restrictAccountCreation, restrictSignIn } from './index.js';

for (const [name, handler] of Object.entries({ restrictAccountCreation, restrictSignIn })) {
  test(`${name} accepts verified school accounts`, () => {
    for (const email of ['student@students.geneseeisd.org', 'STAFF@GENESEEISD.ORG']) {
      assert.doesNotThrow(() => handler.run({ data: { email, emailVerified: true }, additionalUserInfo: { providerId: 'google.com', isNewUser: true } }));
    }
  });
  test(`${name} rejects outsiders, malformed addresses, and unverified accounts`, () => {
    for (const data of [
      { email: 'person@gmail.com', emailVerified: true },
      { email: 'x@geneseeisd.org.evil.com', emailVerified: true },
      { email: 'x@other.geneseeisd.org', emailVerified: true },
      { email: 'x@y@geneseeisd.org', emailVerified: true },
      { email: '@geneseeisd.org', emailVerified: true },
      { email: 'student@students.geneseeisd.org', emailVerified: false },
      {}, undefined,
    ]) {
      assert.throws(() => handler.run({ data, additionalUserInfo: { providerId: 'google.com', isNewUser: true } }), (error) => error.code === 'permission-denied');
    }
  });
}

for (const handler of [restrictAccountCreation, restrictSignIn]) {
  test(`${handler.name || 'blocking hook'} rejects non-Google and missing providers`, () => {
    for (const providerId of ['password', 'microsoft.com', undefined]) {
      assert.throws(() => handler.run({
        data: { email: 'staff@geneseeisd.org', emailVerified: true },
        additionalUserInfo: { providerId, isNewUser: false },
      }), (error) => error.code === 'permission-denied');
    }
  });
}
