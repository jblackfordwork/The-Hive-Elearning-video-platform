import { db, serverTimestamp } from '../lib/firebase.js';

function requireDb() {
  if (!db) throw new Error('Firebase is not configured.');
}

export function assignmentId(uid, courseId) {
  return `${uid}_${courseId}`;
}

export async function assignCourse({ uid, courseId, assignedBy, dueDate = null }) {
  requireDb();
  const id = assignmentId(uid, courseId);
  await db.collection('assignments').doc(id).set({
    uid,
    courseId,
    assignedBy,
    assignedAt: serverTimestamp(),
    dueDate: dueDate || null,
    status: 'assigned',
  }, { merge: true });
  return id;
}

export async function unassignCourse(uid, courseId) {
  requireDb();
  await db.collection('assignments').doc(assignmentId(uid, courseId)).delete();
}

export async function updateAssignmentStatus(uid, courseId, status) {
  requireDb();
  await db.collection('assignments').doc(assignmentId(uid, courseId)).set(
    { status, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function listAssignmentsForUser(uid) {
  requireDb();
  const snapshot = await db.collection('assignments').where('uid', '==', uid).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function listAllAssignments() {
  requireDb();
  const snapshot = await db.collection('assignments').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
