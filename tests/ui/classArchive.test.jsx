import { beforeEach, expect, test, vi } from 'vitest';
const state = vi.hoisted(() => ({ records: new Map(), next: 0 }));
vi.mock('../../src/lib/firebase.js', () => {
  function ref(path) {
    return { path, id: path.split('/').at(-1), collection: name => collection(`${path}/${name}`),
      get: async () => ({ exists: state.records.has(path), id: path.split('/').at(-1), ref: ref(path), data: () => structuredClone(state.records.get(path)) }),
      set: async value => state.records.set(path, structuredClone(value)),
      update: async value => state.records.set(path, { ...state.records.get(path), ...structuredClone(value) }) };
  }
  function collection(path, filters = []) {
    return { doc: id => ref(`${path}/${id || `archive${++state.next}`}`),
      where: (key, op, value) => collection(path, [...filters, [key, op, value]]),
      get: async () => ({ docs: await Promise.all([...state.records.keys()].filter(key => key.startsWith(`${path}/`) && key.split('/').length === path.split('/').length + 1 && filters.every(([field, op, value]) => op === 'array-contains' ? state.records.get(key)[field]?.includes(value) : state.records.get(key)[field] === value)).map(key => ref(key).get())) }) };
  }
  const writer = () => ({ get: target => target.get(), set: (target, data) => target.set(data), update: (target, data) => target.update(data), commit: async () => {} });
  return { serverTimestamp: () => ({ seconds: 1 }), db: { collection, batch: writer, runTransaction: async callback => callback(writer()) } };
});
import { archiveClass, getClassArchive, reactivateStudent, listClassArchives } from '../../src/services/archiveService.js';
import { assignTrainingsToUsers } from '../../src/services/assignmentService.js';
beforeEach(() => {
  state.records.clear(); state.next = 0;
  for (const [key, value] of Object.entries({
    'users/s1': { uid: 's1', role: 'student', className: 'Design' },
    'users/s2': { uid: 's2', role: 'student', className: 'Other' },
    'assignments/s1_c1': { uid: 's1', courseId: 'c1', status: 'completed' },
    'progress/s1_c1': { uid: 's1', courseId: 'c1', percentComplete: 100 },
    'attempts/a1': { uid: 's1', courseId: 'c1', scorePercent: 90 },
    'courses/c1': { title: 'Safety' },
    'courses/c1/lessons/l1': { title: 'Intro', videoUrl: 'video.mp4' },
  })) state.records.set(key, value);
});
test('archives roster, content and results while clearing active training; reactivation preserves history', async () => {
  const id = await archiveClass({ className: 'Design', label: '2025–26', archivedBy: 'admin' });
  expect(state.records.get('users/s1').archived).toBe(true);
  expect(state.records.get('users/s2').archived).toBeUndefined();
  const archive = await getClassArchive(id, 's1');
  expect(archive.archive.status).toBe('complete');
  expect(archive.progress[0].percentComplete).toBe(100);
  expect(archive.lessons[0].videoUrl).toBe('video.mp4');
  expect(await listClassArchives('s2')).toEqual([]);
  await reactivateStudent('s1', id);
  expect(state.records.get('users/s1')).toMatchObject({ archived: false, className: '' });
  expect(await assignTrainingsToUsers({ userIds: ['s1'], courseIds: ['c1'], assignedBy: 'admin' })).toMatchObject({ created: 1 });
  expect((await getClassArchive(id, 's1')).assignments[0].status).toBe('completed');
});
test('resuming an archive keeps the original results and does not copy previous years', async () => {
  const id = await archiveClass({ className: 'Design', archivedBy: 'admin' });
  state.records.get(`classArchives/${id}`).status = 'building';
  state.records.get('progress/s1_c1').percentComplete = 0;
  await archiveClass({ archiveId: id });
  expect((await getClassArchive(id)).progress[0].percentComplete).toBe(100);
  await reactivateStudent('s1', id);
  state.records.get('users/s1').className = 'Design';
  const next = await archiveClass({ className: 'Design', archivedBy: 'admin' });
  expect((await getClassArchive(next)).attempts).toEqual([]);
  expect((await getClassArchive(id)).attempts).toHaveLength(1);
});
