import { db, serverTimestamp } from '../lib/firebase.js';

function requireDb() {
  if (!db) throw new Error('Firebase is not configured.');
}

export async function ensureUserProfile(firebaseUser) {
  requireDb();
  const ref = db.collection('users').doc(firebaseUser.uid);
  const snapshot = await ref.get();
  const baseProfile = {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName || firebaseUser.email || 'Hive Learner',
    email: firebaseUser.email || '',
    photoURL: firebaseUser.photoURL || '',
    lastLoginAt: serverTimestamp(),
  };

  if (snapshot.exists) {
    await ref.set(baseProfile, { merge: true });
    return { id: snapshot.id, ...snapshot.data(), ...baseProfile, role: snapshot.data().role || 'student' };
  }

  const created = {
    ...baseProfile,
    role: 'student',
    createdAt: serverTimestamp(),
  };
  await ref.set(created);
  return { id: firebaseUser.uid, ...created };
}

export async function getUserProfile(uid) {
  requireDb();
  const snapshot = await db.collection('users').doc(uid).get();
  return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
}
