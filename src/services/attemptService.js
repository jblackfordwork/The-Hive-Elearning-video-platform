import { db, serverTimestamp } from '../lib/firebase.js';

function requireDb() {
  if (!db) throw new Error('Firebase is not configured.');
}

export async function createAttempt({ uid, courseId, lessonId, passingScorePercent, result }) {
  requireDb();
  const ref = await db.collection('attempts').add({
    uid,
    courseId,
    lessonId,
    startedAt: new Date(),
    submittedAt: serverTimestamp(),
    passingScorePercent,
    scorePercent: result.scorePercent,
    correctCount: result.correctCount,
    totalQuestions: result.totalQuestions,
    passed: result.passed,
    questions: result.questions,
  });
  return ref.id;
}

export async function getAttempt(attemptId) {
  requireDb();
  const snapshot = await db.collection('attempts').doc(attemptId).get();
  return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function listAttemptsForUser(uid) {
  requireDb();
  const snapshot = await db.collection('attempts').where('uid', '==', uid).get();
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
}

export async function listAllAttempts() {
  requireDb();
  const snapshot = await db.collection('attempts').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
