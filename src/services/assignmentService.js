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
    archived: false,
    archiveId: null,
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
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })).filter(row => !row.archived);
}

export async function listAllAssignments() {
  requireDb();
  const snapshot = await db.collection('assignments').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })).filter(row => !row.archived);
}

export async function assignTrainingsToUsers({ userIds, courseIds, assignedBy, dueDate = null }) {
  requireDb();
  const pairs = [...new Set(userIds)].flatMap(uid => [...new Set(courseIds)].map(courseId => ({ uid, courseId })));
  const summary = { created: 0, skipped: 0, failed: 0 };
  // Limit concurrent transactions for large classes. Each assignment is idempotent.
  for (let start = 0; start < pairs.length; start += 10) {
    const results = await Promise.allSettled(pairs.slice(start, start + 10).map(({ uid, courseId }) => {
      const ref = db.collection('assignments').doc(assignmentId(uid, courseId));
      return db.runTransaction(async transaction => {
        const existing = await transaction.get(ref);
        if (existing.exists && !existing.data().archived) return 'skipped';
        transaction.set(ref, { uid, courseId, assignedBy, assignedAt: serverTimestamp(), dueDate, status: 'assigned' });
        return 'created';
      });
    }));
    results.forEach(result => { summary[result.status === 'fulfilled' ? result.value : 'failed'] += 1; });
  }
  return summary;
}
