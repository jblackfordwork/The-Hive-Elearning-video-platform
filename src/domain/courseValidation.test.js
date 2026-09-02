import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCourseForPublish } from './courseValidation.js';

const course = { title: 'Heat Press', equipmentName: 'Heat Press' };
const validLesson = {
  id: 'l1',
  title: 'Safety',
  videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
  quizQuestionCount: 2,
  questions: [
    { id: 'q1', active: true, prompt: 'One', options: [{id:'a',text:'A'},{id:'b',text:'B'}], correctOptionId: 'a' },
    { id: 'q2', active: true, prompt: 'Two', options: [{id:'a',text:'A'},{id:'b',text:'B'}], correctOptionId: 'b' },
  ],
};

test('valid course can be published', () => {
  assert.deepEqual(validateCourseForPublish(course, [validLesson]), { valid: true, errors: [] });
});

test('video-only lesson can be published without quiz questions', () => {
  const result = validateCourseForPublish(course, [
    {
      ...validLesson,
      requireQuiz: false,
      quizQuestionCount: 0,
      questions: [],
    },
  ]);

  assert.deepEqual(result, { valid: true, errors: [] });
});

test('publishing is blocked for missing lessons, unsupported videos, or too-small question banks', () => {
  assert.equal(validateCourseForPublish(course, []).valid, false);
  const result = validateCourseForPublish(course, [{ ...validLesson, videoUrl: 'https://example.com/page', quizQuestionCount: 3 }]);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('supported video')));
  assert.ok(result.errors.some((error) => error.includes('3 active quiz questions')));
});
