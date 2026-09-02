import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canCompleteLesson,
  calculateCourseProgress,
  getNextLesson,
  isLessonUnlocked,
} from './progress.js';

const lessons = [
  { id: 'l3', order: 3 },
  { id: 'l1', order: 1 },
  { id: 'l2', order: 2 },
];

test('lesson completes only after both video and quiz requirements are satisfied by default', () => {
  assert.equal(canCompleteLesson({ videoCompleted: true, quizPassed: true }), true);
  assert.equal(canCompleteLesson({ videoCompleted: true, quizPassed: false }), false);
  assert.equal(canCompleteLesson({ videoCompleted: false, quizPassed: true }), false);
});

test('lesson can complete after video when quiz is not required', () => {
  assert.equal(canCompleteLesson({ videoCompleted: true, quizPassed: false, requireQuiz: false }), true);
  assert.equal(canCompleteLesson({ videoCompleted: false, quizPassed: true, requireQuiz: false }), false);
});

test('course progress is based on unique completed lessons', () => {
  assert.equal(calculateCourseProgress(['l1', 'l2', 'l3', 'l4'], ['l1', 'l1', 'l3']), 50);
  assert.equal(calculateCourseProgress([], []), 0);
});

test('next lesson is the first ordered lesson not yet complete', () => {
  assert.equal(getNextLesson(lessons, ['l1']).id, 'l2');
  assert.equal(getNextLesson(lessons, ['l1', 'l2', 'l3']), null);
});

test('only the first lesson or a lesson whose predecessors are complete is unlocked', () => {
  assert.equal(isLessonUnlocked(lessons, 'l1', []), true);
  assert.equal(isLessonUnlocked(lessons, 'l2', []), false);
  assert.equal(isLessonUnlocked(lessons, 'l2', ['l1']), true);
  assert.equal(isLessonUnlocked(lessons, 'l3', ['l1']), false);
  assert.equal(isLessonUnlocked(lessons, 'l3', ['l1', 'l2']), true);
});
