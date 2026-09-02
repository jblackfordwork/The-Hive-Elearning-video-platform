import { db, serverTimestamp } from '../lib/firebase.js';

function requireDb() {
  if (!db) throw new Error('Firebase is not configured.');
}

function withId(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
}

export async function listAllCourses() {
  requireDb();
  const snapshot = await db.collection('courses').get();
  return snapshot.docs.map(withId).sort((a, b) => (a.title || '').localeCompare(b.title || ''));
}

export async function getCoursesByIds(courseIds = []) {
  requireDb();
  const uniqueIds = [...new Set(courseIds)].filter(Boolean);
  const courses = await Promise.all(uniqueIds.map((id) => getCourse(id).catch(() => null)));
  return courses.filter(Boolean);
}

export async function getCourse(courseId) {
  requireDb();
  const snapshot = await db.collection('courses').doc(courseId).get();
  return snapshot.exists ? withId(snapshot) : null;
}

export async function saveCourse(course) {
  requireDb();
  const payload = {
    title: String(course.title || '').trim(),
    slug: String(course.slug || '').trim(),
    description: String(course.description || '').trim(),
    equipmentName: String(course.equipmentName || '').trim(),
    thumbnailUrl: String(course.thumbnailUrl || '').trim(),
    status: course.status || 'draft',
    updatedAt: serverTimestamp(),
  };

  if (course.id) {
    await db.collection('courses').doc(course.id).set(payload, { merge: true });
    return course.id;
  }

  const ref = await db.collection('courses').add({
    ...payload,
    createdBy: course.createdBy || '',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function archiveCourse(courseId) {
  requireDb();
  await db.collection('courses').doc(courseId).set(
    { status: 'archived', updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function listLessons(courseId) {
  requireDb();
  const snapshot = await db.collection('courses').doc(courseId).collection('lessons').get();
  return snapshot.docs.map(withId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getLesson(courseId, lessonId) {
  requireDb();
  const snapshot = await db.collection('courses').doc(courseId).collection('lessons').doc(lessonId).get();
  return snapshot.exists ? withId(snapshot) : null;
}

export async function saveLesson(courseId, lesson) {
  requireDb();
  const payload = {
    title: String(lesson.title || '').trim(),
    order: Number(lesson.order || 1),
    description: String(lesson.description || '').trim(),
    videoUrl: String(lesson.videoUrl || '').trim(),
    videoType: lesson.videoType || 'youtube',
    passingScorePercent: Number(lesson.passingScorePercent ?? 80),
    quizQuestionCount: Number(lesson.quizQuestionCount ?? 3),
    requireQuiz: lesson.requireQuiz !== false,
    requireVideoCompletion: lesson.requireVideoCompletion !== false,
    updatedAt: serverTimestamp(),
  };
  const collection = db.collection('courses').doc(courseId).collection('lessons');
  if (lesson.id) {
    await collection.doc(lesson.id).set(payload, { merge: true });
    return lesson.id;
  }
  const ref = await collection.add({ ...payload, createdAt: serverTimestamp() });
  return ref.id;
}

export async function deleteLesson(courseId, lessonId) {
  requireDb();
  const lessonRef = db.collection('courses').doc(courseId).collection('lessons').doc(lessonId);
  const questions = await lessonRef.collection('questions').get();
  await Promise.all(questions.docs.map((doc) => doc.ref.delete()));
  await lessonRef.delete();
}

export async function listQuestions(courseId, lessonId) {
  requireDb();
  const snapshot = await db
    .collection('courses')
    .doc(courseId)
    .collection('lessons')
    .doc(lessonId)
    .collection('questions')
    .get();
  return snapshot.docs.map(withId);
}

export async function saveQuestion(courseId, lessonId, question) {
  requireDb();
  const payload = {
    prompt: String(question.prompt || '').trim(),
    options: (question.options || []).map((option) => ({
      id: String(option.id),
      text: String(option.text || '').trim(),
    })),
    correctOptionId: String(question.correctOptionId || ''),
    explanation: String(question.explanation || '').trim(),
    active: question.active !== false,
    updatedAt: serverTimestamp(),
  };
  const collection = db
    .collection('courses')
    .doc(courseId)
    .collection('lessons')
    .doc(lessonId)
    .collection('questions');
  if (question.id) {
    await collection.doc(question.id).set(payload, { merge: true });
    return question.id;
  }
  const ref = await collection.add({ ...payload, createdAt: serverTimestamp() });
  return ref.id;
}

export async function deleteQuestion(courseId, lessonId, questionId) {
  requireDb();
  await db
    .collection('courses')
    .doc(courseId)
    .collection('lessons')
    .doc(lessonId)
    .collection('questions')
    .doc(questionId)
    .delete();
}
