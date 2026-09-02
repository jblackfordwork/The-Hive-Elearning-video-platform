import test from 'node:test';
import assert from 'node:assert/strict';
import { splitCoursesByCompletion } from './courseProgress.js';

test('splits assigned courses into active and completed groups', () => {
  const result = splitCoursesByCompletion([
    { course: { id: 'a' }, progress: { percentComplete: 0 } },
    { course: { id: 'b' }, progress: { percentComplete: 99 } },
    { course: { id: 'c' }, progress: { percentComplete: 100 } },
    { course: { id: 'd' } },
  ]);

  assert.deepEqual(result.active.map((item) => item.course.id), ['a', 'b', 'd']);
  assert.deepEqual(result.completed.map((item) => item.course.id), ['c']);
});
