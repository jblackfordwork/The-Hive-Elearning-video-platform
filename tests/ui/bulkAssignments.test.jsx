import { beforeEach, expect, test, vi } from 'vitest';
import { assignTrainingsToUsers } from '../../src/services/assignmentService';

const store = vi.hoisted(() => ({ docs: new Map(), failed: new Set() }));
vi.mock('../../src/lib/firebase.js', () => ({
  serverTimestamp: () => 'server-time',
  db: {
    collection: () => ({ doc: id => ({ id }) }),
    runTransaction: async callback => callback({
      get: async ref => {
        if (store.failed.has(ref.id)) throw new Error('Connection failed');
        return { exists: store.docs.has(ref.id), data: () => store.docs.get(ref.id) };
      },
      set: (ref, data) => store.docs.set(ref.id, data),
    }),
  },
}));
beforeEach(() => { store.docs.clear(); store.failed.clear(); });
test('creates all student-course pairs once and preserves existing completed assignments', async () => {
  const existing = { uid: 'a', courseId: 'printer', status: 'completed', dueDate: 'old-date' };
  store.docs.set('a_printer', existing);
  const result = await assignTrainingsToUsers({ userIds: ['a', 'b', 'b'], courseIds: ['printer', 'press'], assignedBy: 'teacher', dueDate: 'new-date' });
  expect(result).toEqual({ created: 3, skipped: 1, failed: 0 });
  expect(store.docs.get('a_printer')).toEqual(existing);
  expect(store.docs.get('b_press')).toEqual({ uid: 'b', courseId: 'press', assignedBy: 'teacher', assignedAt: 'server-time', dueDate: 'new-date', status: 'assigned' });
  expect(store.docs.size).toBe(4);
});
test('reports failed writes and safely retries without overwriting successful assignments', async () => {
  store.failed.add('b_printer');
  const input = { userIds: ['a', 'b'], courseIds: ['printer'], assignedBy: 'teacher' };
  expect(await assignTrainingsToUsers(input)).toEqual({ created: 1, skipped: 0, failed: 1 });
  store.failed.clear();
  expect(await assignTrainingsToUsers(input)).toEqual({ created: 1, skipped: 1, failed: 0 });
});
