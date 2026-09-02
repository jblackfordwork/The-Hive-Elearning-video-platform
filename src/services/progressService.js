import { db, serverTimestamp } from '../lib/firebase.js';
import {
  calculateCourseProgress,
  canCompleteLesson,
  getNextLesson,
  resetLessonProgress,
} from '../domain/progress.js';
import { hasWatchedVideoLength } from '../domain/videoProgress.js';

function requireDb() {
  if (!db) throw new Error('Firebase is not configured.');
}

export function progressId(uid, courseId) {
  return `${uid}_${courseId}`;
}

function emptyProgress(uid, courseId) {
  return {
    uid,
    courseId,
    currentLessonId: null,
    completedLessonIds: [],
    percentComplete: 0,
    lessons: {},
    completedAt: null,
  };
}

export async function getProgress(uid, courseId) {
  requireDb();
  const snapshot = await db.collection('progress').doc(progressId(uid, courseId)).get();
  return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : emptyProgress(uid, courseId);
}

async function writeProgress(uid, courseId, nextProgress) {
  const ref = db.collection('progress').doc(progressId(uid, courseId));
  const existing = await ref.get();
  const payload = {
    ...nextProgress,
    uid,
    courseId,
    updatedAt: serverTimestamp(),
  };
  if (!existing.exists) payload.startedAt = serverTimestamp();
  await ref.set(payload, { merge: true });
  return payload;
}

export async function markVideoCompleted({ uid, courseId, lessonId, lessonIds = [], requireQuiz = true }) {
  requireDb();
  const progress = await getProgress(uid, courseId);
  const previous = progress.lessons?.[lessonId] || {};
  const quizPassed = Boolean(previous.quizPassed);
  const completed = canCompleteLesson({ videoCompleted: true, quizPassed, requireQuiz });
  const completedLessonIds = completed
    ? [...new Set([...(progress.completedLessonIds || []), lessonId])]
    : progress.completedLessonIds || [];
  const percentComplete = calculateCourseProgress(lessonIds, completedLessonIds);

  return writeProgress(uid, courseId, {
    ...progress,
    completedLessonIds,
    percentComplete,
    lessons: {
      ...(progress.lessons || {}),
      [lessonId]: {
        ...previous,
        videoCompleted: true,
        quizPassed,
        completedAt: completed ? serverTimestamp() : previous.completedAt || null,
      },
    },
  });
}

export async function recordVideoWatchProgress({ uid, courseId, lessonId, watchedSeconds = 0, durationSeconds = 0 }) {
  requireDb();
  const progress = await getProgress(uid, courseId);
  const previous = progress.lessons?.[lessonId] || {};
  const nextWatchedSeconds = Math.max(Number(previous.watchedSeconds || 0), Math.round(Number(watchedSeconds || 0)));
  const nextDurationSeconds = Math.max(Number(previous.videoDurationSeconds || 0), Math.round(Number(durationSeconds || 0)));

  return writeProgress(uid, courseId, {
    ...progress,
    lessons: {
      ...(progress.lessons || {}),
      [lessonId]: {
        ...previous,
        watchedSeconds: nextWatchedSeconds,
        videoDurationSeconds: nextDurationSeconds,
        watchedEnough: hasWatchedVideoLength({
          watchedSeconds: nextWatchedSeconds,
          durationSeconds: nextDurationSeconds,
        }),
        lastWatchedAt: serverTimestamp(),
      },
    },
  });
}

export async function recordQuizProgress({ uid, courseId, lessonId, lessonIds = [], lessons = [], result }) {
  requireDb();
  const progress = await getProgress(uid, courseId);
  const previous = progress.lessons?.[lessonId] || {};
  const quizPassed = Boolean(previous.quizPassed || result.passed);
  const videoCompleted = Boolean(previous.videoCompleted);
  const completed = canCompleteLesson({ videoCompleted, quizPassed });
  const completedLessonIds = completed
    ? [...new Set([...(progress.completedLessonIds || []), lessonId])]
    : progress.completedLessonIds || [];
  const percentComplete = calculateCourseProgress(lessonIds, completedLessonIds);
  const nextLesson = getNextLesson(lessons, completedLessonIds);

  const nextProgress = {
    ...progress,
    currentLessonId: nextLesson?.id || lessonId,
    completedLessonIds,
    percentComplete,
    completedAt: lessonIds.length > 0 && completedLessonIds.length === lessonIds.length
      ? serverTimestamp()
      : progress.completedAt || null,
    lessons: {
      ...(progress.lessons || {}),
      [lessonId]: {
        ...previous,
        videoCompleted,
        quizPassed,
        bestScorePercent: Math.max(Number(previous.bestScorePercent || 0), result.scorePercent),
        attemptCount: Number(previous.attemptCount || 0) + 1,
        completedAt: completed ? serverTimestamp() : previous.completedAt || null,
      },
    },
  };

  return writeProgress(uid, courseId, nextProgress);
}

export async function listAllProgress() {
  requireDb();
  const snapshot = await db.collection('progress').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function listProgressForUser(uid) {
  requireDb();
  const snapshot = await db.collection('progress').where('uid', '==', uid).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function resetCourseProgress(uid, courseId) {
  requireDb();
  await db.collection('progress').doc(progressId(uid, courseId)).delete();
}

export async function resetStudentLessonProgress({ uid, courseId, lessonId, lessonIds = [] }) {
  requireDb();
  const progress = await getProgress(uid, courseId);
  const nextProgress = resetLessonProgress(progress, lessonId, lessonIds);
  return writeProgress(uid, courseId, nextProgress);
}
