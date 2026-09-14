import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LessonPlayer from '../../src/pages/Student/LessonPlayer';
import { recordVideoWatchProgress } from '../../src/services/progressService';
vi.mock('../../src/hooks/useStudentView', () => ({ useStudentView: () => ({ user: { uid: 'learner' }, basePath: '', readOnly: false }) }));
vi.mock('../../src/hooks/useAuth', () => ({ useAuth: () => ({ isAdmin: false }) }));
const fixture = vi.hoisted(() => ({ progress: { uid: 'learner', courseId: 'course', completedLessonIds: ['one'], lessons: { one: { videoCompleted: true, watchedSeconds: 10, videoDurationSeconds: 10 }, two: {} } } }));
vi.mock('../../src/services/courseService', () => ({
  getCourse: vi.fn(async () => ({ id: 'course', title: 'Training' })),
  listLessons: vi.fn(async () => [
    { id: 'one', title: 'First video', order: 1, videoUrl: 'https://youtu.be/abcdefghijk', requireQuiz: false },
    { id: 'two', title: 'Second video', order: 2, videoUrl: 'https://youtu.be/lmnopqrstuv', requireQuiz: false },
  ]), listQuestions: vi.fn(async () => []),
}));
vi.mock('../../src/services/progressService', () => ({ getProgress: vi.fn(async () => structuredClone(fixture.progress)), recordVideoWatchProgress: vi.fn(async () => structuredClone(fixture.progress)), markVideoCompleted: vi.fn(), recordQuizProgress: vi.fn() }));
vi.mock('../../src/services/attemptService', () => ({ createAttempt: vi.fn() }));
vi.mock('../../src/services/assignmentService', () => ({ updateAssignmentStatus: vi.fn() }));
afterEach(() => { cleanup(); delete window.YT; vi.clearAllMocks(); });
test('Next lesson loads its own playable iframe and saves using its own lesson ID', async () => {
  const players = [];
  window.YT = { PlayerState: { PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5, ENDED: 0 }, Player: class {
    constructor(frame, options) { this.frame = frame; this.events = options.events; players.push(this); }
    getDuration() { return 20; }
    destroy() { this.frame.remove(); }
  } };
  render(<MemoryRouter initialEntries={['/course/course/lesson/one']}><Routes><Route path="/course/:courseId/lesson/:lessonId" element={<LessonPlayer />} /></Routes></MemoryRouter>);
  await screen.findByText('First video');
  const firstFrame = await screen.findByTitle('Training video');
  fireEvent.click(screen.getByRole('link', { name: 'Next lesson' }));
  await screen.findByText('Second video');
  const nextFrame = await screen.findByTitle('Training video');
  expect(nextFrame).not.toBe(firstFrame);
  expect(nextFrame.isConnected).toBe(true);
  expect(nextFrame.src).toContain('lmnopqrstuv');
  expect(screen.getByText('0:00 watched')).toBeTruthy();
  await act(async () => players.at(-1).events.onStateChange({ target: players.at(-1), data: 1 }));
  await waitFor(() => expect(recordVideoWatchProgress).toHaveBeenCalledWith(expect.objectContaining({ lessonId: 'two', watchedSeconds: 0, durationSeconds: 20 })));
  expect(recordVideoWatchProgress.mock.calls.filter(([input]) => input.lessonId === 'two').every(([input]) => input.watchedSeconds === 0)).toBe(true);
});
