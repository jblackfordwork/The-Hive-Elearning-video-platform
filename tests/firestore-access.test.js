import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

let environment;
before(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'demo-hive-access',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users/member'), { uid: 'member', role: 'admin' });
  });
});
after(async () => { await environment?.cleanup(); });

for (const [email, verified, provider, allowed] of [
  ['student@students.geneseeisd.org', true, 'google.com', true],
  ['STAFF@GENESEEISD.ORG', true, 'google.com', true],
  ['person@gmail.com', true, 'google.com', false],
  ['x@geneseeisd.org.evil.com', true, 'google.com', false],
  ['x@other.geneseeisd.org', true, 'google.com', false],
  ['x@y@geneseeisd.org', true, 'google.com', false],
  ['staff@geneseeisd.org', false, 'google.com', false],
  ['staff@geneseeisd.org', true, 'password', false],
]) {
  test(`profile and admin access: ${email}, verified=${verified}, provider=${provider}`, async () => {
    const db = environment.authenticatedContext('member', {
      email, email_verified: verified, firebase: { sign_in_provider: provider },
    }).firestore();
    const check = allowed ? assertSucceeds : assertFails;
    await check(getDoc(doc(db, 'users/member')));
    await check(setDoc(doc(db, 'courses/example'), { status: 'draft' }));
  });
}
test('signed-out users cannot read profiles', async () => {
  await assertFails(getDoc(doc(environment.unauthenticatedContext().firestore(), 'users/member')));
});
