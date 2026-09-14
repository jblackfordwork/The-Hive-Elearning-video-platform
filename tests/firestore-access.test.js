import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

let environment;
before(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'demo-hive-access',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users/member'), { uid: 'member', role: 'admin' });
  });
  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'users/new-student'), { uid: 'new-student', role: 'student' });
    await setDoc(doc(db, 'courses/first-course'), { status: 'published' });
    await setDoc(doc(db, 'courses/first-course/lessons/intro'), { title: 'Introduction' });
    await setDoc(doc(db, 'courses/first-course/lessons/intro/questions/q1'), { prompt: 'Question' });
    await setDoc(doc(db, 'assignments/new-student_first-course'), { uid: 'new-student', courseId: 'first-course', status: 'assigned', assignedBy: 'member' });
    await setDoc(doc(db, 'progress/other_first-course'), { uid: 'other', courseId: 'first-course', percentComplete: 50 });
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

function studentDb(uid = 'new-student') {
  return environment.authenticatedContext(uid, {
    email: 'learner@students.geneseeisd.org', email_verified: true,
    firebase: { sign_in_provider: 'google.com' },
  }).firestore();
}


test('newly assigned student can open course, lessons, questions, and absent progress', async () => {
  const db = studentDb();
  await assertSucceeds(getDoc(doc(db, 'courses/first-course')));
  await assertSucceeds(getDocs(collection(db, 'courses/first-course/lessons')));
  await assertSucceeds(getDocs(collection(db, 'courses/first-course/lessons/intro/questions')));
  await assertSucceeds(getDoc(doc(db, 'progress/new-student_first-course')));
});

test('student can save first progress and update only own assignment status', async () => {
  const db = studentDb();
  await assertSucceeds(setDoc(doc(db, 'progress/new-student_first-course'), { uid: 'new-student', courseId: 'first-course', percentComplete: 0 }));
  await assertSucceeds(updateDoc(doc(db, 'assignments/new-student_first-course'), { status: 'in_progress', updatedAt: new Date() }));
  await assertSucceeds(updateDoc(doc(db, 'assignments/new-student_first-course'), { status: 'completed', updatedAt: new Date() }));
  await assertFails(updateDoc(doc(db, 'assignments/new-student_first-course'), { courseId: 'another-course' }));
  await assertFails(updateDoc(doc(db, 'assignments/new-student_first-course'), { dueDate: null }));
  await assertFails(setDoc(doc(db, 'assignments/new-student_another-course'), { uid: 'new-student', courseId: 'another-course', status: 'assigned' }));
});

test('student cannot access another student progress or an unassigned course', async () => {
  const db = studentDb('outsider-student');
  await assertFails(getDoc(doc(db, 'courses/first-course')));
  await assertFails(getDoc(doc(db, 'progress/other_first-course')));
  await assertFails(updateDoc(doc(db, 'assignments/new-student_first-course'), { status: 'completed' }));
  await assertFails(getDocs(collection(db, 'progress')));
  await assertSucceeds(getDocs(query(collection(db, 'progress'), where('uid', '==', 'outsider-student'))));
});
