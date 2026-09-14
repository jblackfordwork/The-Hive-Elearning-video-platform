import test from 'node:test';
import assert from 'node:assert/strict';
import { getRecentAttempts } from './recentAttempts.js';

const users = [
  { uid: 'a', className: ' First ' },
  { id: 'b', className: 'Second' },
  { uid: 'c', className: '' },
];
const attempts = [
  { id: 'old', uid: 'a', submittedAt: { seconds: 1 } },
  ...Array.from({ length: 10 }, (_, i) => ({ id: `b${i}`, uid: 'b', submittedAt: { seconds: 10 + i } })),
  { id: 'new', uid: 'a', submittedAt: { seconds: 2 } },
  { id: 'unassigned', uid: 'c', submittedAt: { seconds: 3 } },
];

test('filters by class before taking newest attempts', () => {
  assert.deepEqual(getRecentAttempts(attempts, users, 'First').map(a => a.id), ['new', 'old']);
});
test('selected user must belong to the selected class', () => {
  assert.deepEqual(getRecentAttempts(attempts, users, 'First', 'b'), []);
  assert.deepEqual(getRecentAttempts(attempts, users, 'all', 'a').map(a => a.id), ['new', 'old']);
});
test('unassigned excludes users in named classes', () => {
  assert.deepEqual(getRecentAttempts(attempts, users, '').map(a => a.id), ['unassigned']);
});
test('all classes returns latest eight without mutating source', () => {
  assert.equal(getRecentAttempts(attempts, users).length, 8);
  assert.equal(getRecentAttempts(attempts, users)[0].id, 'b9');
  assert.equal(attempts[0].id, 'old');
});
