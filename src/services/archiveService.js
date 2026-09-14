import { db, serverTimestamp } from '../lib/firebase.js';

const rows = snapshot => snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
function requireDb() { if (!db) throw new Error('Firebase is not configured.'); }

export async function listClassArchives(uid = null) {
  requireDb();
  let query = db.collection('classArchives');
  if (uid) query = query.where('studentIds', 'array-contains', uid);
  return rows(await query.get()).sort((a, b) => (b.archivedAt?.seconds || 0) - (a.archivedAt?.seconds || 0));
}

export async function getClassArchive(id, uid = null) {
  requireDb();
  const ref = db.collection('classArchives').doc(id);
  const metadata = await ref.get();
  if (!metadata.exists) throw new Error('Archive not found.');
  const result = { archive: { ...metadata.data(), id } };
  await Promise.all(['users', 'assignments', 'progress', 'attempts', 'courses', 'lessons'].map(async name => {
    let query = ref.collection(name);
    if (uid) query = ['courses', 'lessons'].includes(name) ? query.where('studentIds', 'array-contains', uid) : query.where('uid', '==', uid);
    result[name] = rows(await query.get());
  }));
  return result;
}

// Freeze the roster before copying results. Each copy and source marker commit
// together, so an interrupted archive can be resumed without losing its history.
export async function archiveClass({ className, label, archivedBy, archiveId = null }) {
  requireDb();
  const ref = archiveId ? db.collection('classArchives').doc(archiveId) : db.collection('classArchives').doc();
  let metadata;
  if (archiveId) {
    const existing = await ref.get();
    if (!existing.exists) throw new Error('Archive not found.');
    metadata = existing.data();
    if (metadata.status === 'complete') return ref.id;
  } else {
    const users = rows(await db.collection('users').get()).filter(user => user.role !== 'admin' && !user.archived && (user.className || '') === (className || ''));
    if (!users.length) throw new Error('This class has no active students to archive.');
    metadata = { className: className || '', label: String(label || className || 'Archived class').trim(), archivedBy, archivedAt: serverTimestamp(), studentIds: users.map(user => user.id), status: 'building' };
    await ref.set(metadata);
  }
  for (const uid of metadata.studentIds) {
    const source = db.collection('users').doc(uid);
    await db.runTransaction(async transaction => {
      const user = await transaction.get(source);
      const saved = await transaction.get(ref.collection('users').doc(uid));
      if (saved.exists) return;
      if (!user.exists || user.data().role === 'admin' || user.data().archived || (user.data().className || '') !== metadata.className) throw new Error('A student changed classes during archiving. Restore their original class and finish archiving.');
      transaction.set(ref.collection('users').doc(uid), { ...user.data(), uid });
      transaction.update(source, { archived: true, archiveId: ref.id, archivedAt: serverTimestamp() });
    });
  }
  const courseIds = new Set();
  const courseStudents = new Map();
  for (const name of ['assignments', 'progress', 'attempts']) {
    for (const uid of metadata.studentIds) {
      const documents = await db.collection(name).where('uid', '==', uid).get();
      for (const document of documents.docs) {
        const data = document.data();
        if (data.archived && data.archiveId !== ref.id) continue;
        if (data.courseId) {
          courseIds.add(data.courseId);
          if (!courseStudents.has(data.courseId)) courseStudents.set(data.courseId, new Set());
          courseStudents.get(data.courseId).add(uid);
        }
        if (data.archiveId === ref.id) continue;
        const batch = db.batch();
        batch.set(ref.collection(name).doc(document.id), data);
        batch.update(document.ref, { archived: true, archiveId: ref.id });
        await batch.commit();
      }
    }
  }
  for (const courseId of courseIds) {
    const source = db.collection('courses').doc(courseId);
    const course = await source.get();
    const target = ref.collection('courses').doc(courseId);
    if (course.exists && !(await target.get()).exists) await target.set({ ...course.data(), studentIds: [...courseStudents.get(courseId)] });
    const lessons = await source.collection('lessons').get();
    for (const lesson of lessons.docs) {
      const targetLesson = ref.collection('lessons').doc(`${courseId}_${lesson.id}`);
      if (!(await targetLesson.get()).exists) await targetLesson.set({ ...lesson.data(), courseId, lessonId: lesson.id, studentIds: [...courseStudents.get(courseId)] });
    }
  }
  await ref.update({ status: 'complete', completedAt: serverTimestamp() });
  return ref.id;
}

export async function reactivateStudent(uid, archiveId) {
  requireDb();
  await db.runTransaction(async transaction => {
    const archive = await transaction.get(db.collection('classArchives').doc(archiveId));
    const ref = db.collection('users').doc(uid);
    const user = await transaction.get(ref);
    if (!archive.exists || archive.data().status !== 'complete') throw new Error('Finish archiving this class first.');
    if (!user.exists || user.data().role === 'admin' || user.data().archiveId !== archiveId) throw new Error('This student is already active or belongs to another archive.');
    transaction.update(ref, { archived: false, archiveId: null, className: '', classUpdatedAt: serverTimestamp() });
  });
}
