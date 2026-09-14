import { beforeEach, expect, test, vi } from 'vitest';
import { recordVideoWatchProgress, markVideoCompleted } from '../../src/services/progressService';
const store = vi.hoisted(() => ({ progress: { uid: 'student', courseId: 'course', lessons: {}, completedLessonIds: [] } }));
vi.mock('../../src/lib/firebase.js', () => ({
  serverTimestamp: () => 'now',
  db: { collection: () => ({ doc: () => ({
    get: async () => { const snapshot = structuredClone(store.progress); return { exists: true, data: () => snapshot }; },
    set: async payload => { store.progress = { ...store.progress, ...structuredClone(payload) }; },
  }) }) },
}));
beforeEach(() => { store.progress = { uid: 'student', courseId: 'course', lessons: {}, completedLessonIds: [] }; });
test('overlapping saves for consecutive lessons preserve both video counters', async () => {
  await Promise.all([
    recordVideoWatchProgress({ uid: 'student', courseId: 'course', lessonId: 'one', watchedSeconds: 10, durationSeconds: 10 }),
    recordVideoWatchProgress({ uid: 'student', courseId: 'course', lessonId: 'two', watchedSeconds: 2, durationSeconds: 20 }),
  ]);
  expect(store.progress.lessons.one.watchedSeconds).toBe(10);
  expect(store.progress.lessons.two.watchedSeconds).toBe(2);
});
test('final watch-time save and completion preserve both timing and completed state', async () => {
  await Promise.all([
    recordVideoWatchProgress({ uid: 'student', courseId: 'course', lessonId: 'one', watchedSeconds: 10, durationSeconds: 10 }),
    markVideoCompleted({ uid: 'student', courseId: 'course', lessonId: 'one', lessonIds: ['one'], requireQuiz: false }),
  ]);
  expect(store.progress.lessons.one.watchedSeconds).toBe(10);
  expect(store.progress.lessons.one.videoCompleted).toBe(true);
});
