import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Archives from '../../src/pages/Archive/Archives';
import { AuthContext } from '../../src/context/AuthContext';
import { getClassArchive, listClassArchives, reactivateStudent, archiveClass } from '../../src/services/archiveService';
vi.mock('../../src/lib/firebase', () => ({ firebaseReady: true, auth: null, db: null }));
vi.mock('../../src/services/archiveService', () => ({ getClassArchive: vi.fn(), listClassArchives: vi.fn(), reactivateStudent: vi.fn(async () => {}), archiveClass: vi.fn(async () => 'old') }));
const data = {
  archive: { id: 'old', className: 'Graphics', label: '2025–2026', status: 'complete' },
  users: [{ id: 'alice', uid: 'alice', displayName: 'Alice' }, { id: 'bob', uid: 'bob', displayName: 'Bob' }],
  assignments: [{ uid: 'alice', courseId: 'printer', status: 'completed' }, { uid: 'bob', courseId: 'printer' }],
  progress: [{ uid: 'alice', courseId: 'printer', percentComplete: 100, lessons: { intro: { watchedSeconds: 120, videoDurationSeconds: 120 } } }],
  attempts: [{ id: 'try', uid: 'alice', courseId: 'printer', lessonId: 'intro', scorePercent: 100, passed: true, questions: [{ prompt: 'Safety first?', options: [{ id: 'yes', text: 'Yes' }], selectedOptionId: 'yes', correctOptionId: 'yes' }] }],
  courses: [{ id: 'printer', title: 'Printer training' }],
  lessons: [{ id: 'printer_intro', lessonId: 'intro', courseId: 'printer', title: 'Introduction', videoUrl: '/training.mp4' }],
};
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.restoreAllMocks(); });
function mount(admin = false, path = '/archives?archive=old') { render(<AuthContext.Provider value={{ user: { uid: admin ? 'teacher' : 'alice' } }}><MemoryRouter initialEntries={[path]}><Archives admin={admin} /></MemoryRouter></AuthContext.Provider>); }
test('student archive requests only own records and offers read-only video and saved results', async () => {
  getClassArchive.mockResolvedValue(data);
  mount();
  expect(await screen.findByText('Alice')).toBeTruthy();
  expect(getClassArchive).toHaveBeenCalledWith('old', 'alice');
  expect(screen.queryByText('Bob')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Reactivate student' })).toBeNull();
  expect(screen.getByText('Safety first?', { exact: false })).toBeTruthy();
  expect(screen.getByLabelText('Introduction').getAttribute('src')).toBe('/training.mp4');
  expect(screen.getByText('Saved watch time: 2:00 / 2:00')).toBeTruthy();
  fireEvent.ended(screen.getByLabelText('Introduction'));
  expect(reactivateStudent).not.toHaveBeenCalled();
});
test('admin can select one student and reactivate them while keeping archived results visible', async () => {
  getClassArchive.mockResolvedValue(data);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  mount(true);
  fireEvent.change(await screen.findByLabelText('Student'), { target: { value: 'alice' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reactivate student' }));
  await waitFor(() => expect(reactivateStudent).toHaveBeenCalledWith('alice', 'old'));
  expect(screen.getByText('Safety first?', { exact: false })).toBeTruthy();
  expect(await screen.findByRole('status')).toBeTruthy();
});
test('students see completed archives only and admins can resume interrupted archives', async () => {
  listClassArchives.mockResolvedValue([{ id: 'old', className: 'Graphics', label: '2025', status: 'building' }]);
  mount(false, '/archives');
  expect(await screen.findByText('No archived classes yet.')).toBeTruthy();
  cleanup();
  mount(true, '/admin/archives');
  fireEvent.click(await screen.findByRole('button', { name: 'Finish archiving' }));
  await waitFor(() => expect(archiveClass).toHaveBeenCalledWith(expect.objectContaining({ archiveId: 'old', archivedBy: 'teacher' })));
});
