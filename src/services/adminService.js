import { db, serverTimestamp } from '../lib/firebase.js';

function requireDb() {
  if (!db) throw new Error('Firebase is not configured.');
}

export async function listUsers() {
  requireDb();
  const snapshot = await db.collection('users').get();
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || ''));
}

export async function setUserRole(uid, role) {
  requireDb();
  if (!['student', 'admin'].includes(role)) throw new Error('Invalid user role.');
  await db.collection('users').doc(uid).set(
    { role, roleUpdatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function setUserClass(uid, className) {
  requireDb();
  await db.collection('users').doc(uid).set(
    {
      className: String(className || '').trim(),
      classUpdatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
