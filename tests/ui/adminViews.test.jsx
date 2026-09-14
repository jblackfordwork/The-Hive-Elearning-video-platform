import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../src/App';
import { AuthContext } from '../../src/context/AuthContext';
import { getCourse } from '../../src/services/courseService';
import { listAssignmentsForUser, updateAssignmentStatus } from '../../src/services/assignmentService';
import { recordVideoWatchProgress, markVideoCompleted, recordQuizProgress } from '../../src/services/progressService';
import { createAttempt } from '../../src/services/attemptService';

const fixtures = vi.hoisted(() => ({
  users: [
    { uid: 'alice', id: 'alice', displayName: 'Alice', email: 'alice@students.geneseeisd.org', className: 'First', role: 'student' },
    { uid: 'bob', id: 'bob', displayName: 'Bob', email: 'bob@students.geneseeisd.org', className: 'Second', role: 'student' },
  ],
  courses: [{ id: 'printer', title: 'Printer training', status: 'published' }],
  lessons: [{ id: 'intro', title: 'Introduction', order: 1, requireQuiz: true }, { id: 'advanced', title: 'Advanced', order: 2 }],
  progress: { percentComplete: 0, completedLessonIds: [], lessons: { intro: { videoCompleted: true } } },
}));
vi.mock('../../src/lib/firebase', () => ({ firebaseReady: true, auth: null, db: null }));
vi.mock('../../src/services/adminService', () => ({ listUsers: vi.fn(async () => fixtures.users) }));
vi.mock('../../src/services/userService', () => ({ getUserProfile: vi.fn(async uid => fixtures.users.find(u => u.uid === uid)), ensureUserProfile: vi.fn() }));
vi.mock('../../src/services/courseService', () => ({
  listAllCourses: vi.fn(async () => fixtures.courses), getCoursesByIds: vi.fn(async () => fixtures.courses),
  getCourse: vi.fn(async () => fixtures.courses[0]), listLessons: vi.fn(async () => fixtures.lessons), listQuestions: vi.fn(async () => []),
}));
vi.mock('../../src/services/assignmentService', () => ({
  listAllAssignments: vi.fn(async () => []), listAssignmentsForUser: vi.fn(async uid => [{ id: `${uid}_printer`, uid, courseId: 'printer' }]),
  updateAssignmentStatus: vi.fn(),
}));
vi.mock('../../src/services/progressService', () => ({
  listAllProgress: vi.fn(async () => []), listProgressForUser: vi.fn(async () => []), getProgress: vi.fn(async () => fixtures.progress),
  recordVideoWatchProgress: vi.fn(), markVideoCompleted: vi.fn(), recordQuizProgress: vi.fn(),
}));
vi.mock('../../src/services/attemptService', () => ({
  listAllAttempts: vi.fn(async () => [
    { id: 'attempt-alice', uid: 'alice', courseId: 'printer', scorePercent: 90, submittedAt: { seconds: 1 } },
    { id: 'attempt-bob', uid: 'bob', courseId: 'printer', scorePercent: 70, submittedAt: { seconds: 2 } },
  ]), createAttempt: vi.fn(),
}));
// Replace media/quiz widgets to exercise their callbacks without video playback or random questions.
vi.mock('../../src/components/course/TrainingVideo', () => ({ default: ({ onWatchProgress, onComplete }) => <><button onClick={() => onWatchProgress({ watchedSeconds: 30, durationSeconds: 60 })}>Watch video</button><button onClick={onComplete}>Finish video</button></> }));
vi.mock('../../src/components/quiz/LessonQuiz', () => ({ default: ({ onSubmitted }) => <button onClick={() => onSubmitted({ passed: true, scorePercent: 100 })}>Submit quiz</button> }));

beforeEach(() => { vi.clearAllMocks(); fixtures.progress.lessons.intro.videoCompleted = true; });
afterEach(cleanup);
function mount(path = '/admin', isAdmin = true) {
  return render(<AuthContext.Provider value={{ user: { uid: 'admin' }, profile: { role: isAdmin ? 'admin' : 'student', displayName: 'Teacher' }, isAdmin, isAuthenticated: true, loading: false, signOutUser: vi.fn() }}><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></AuthContext.Provider>);
}

test('class limits user choices and attempts; changing class clears the selected user', async () => {
  mount();
  const classSelect = await screen.findByLabelText('Class');
  fireEvent.change(classSelect, { target: { value: 'First' } });
  const userSelect = screen.getByLabelText('User');
  expect(within(userSelect).queryByText(/Bob/)).toBeNull();
  fireEvent.change(userSelect, { target: { value: 'alice' } });
  expect(within(screen.getByRole('table')).getByText('90%')).toBeTruthy();
  expect(within(screen.getByRole('table')).queryByText('70%')).toBeNull();
  expect(screen.getByRole('link', { name: 'View attempt' }).getAttribute('href')).toBe('/admin/attempts/attempt-alice');
  fireEvent.change(classSelect, { target: { value: 'Second' } });
  expect(userSelect.value).toBe('');
  expect(within(screen.getByRole('table')).getByText('70%')).toBeTruthy();
});

test('preview follows selected student courses and preserves preview links and lesson locks', async () => {
  mount('/student-view/alice');
  expect(await screen.findByText('Welcome, Alice.')).toBeTruthy();
  expect(listAssignmentsForUser).toHaveBeenCalledWith('alice');
  expect(screen.queryByRole('link', { name: 'Admin Overview' })).toBeNull();
  fireEvent.click(screen.getByRole('link', { name: /Start/ }));
  expect(await screen.findByText('Course lessons')).toBeTruthy();
  expect(screen.getByRole('link', { name: /Introduction/ }).getAttribute('href')).toBe('/student-view/alice/course/printer/lesson/intro');
  expect(screen.queryByRole('link', { name: /Advanced/ })).toBeNull();
  fireEvent.click(screen.getByRole('link', { name: 'Return to admin' }));
  expect(await screen.findByText('Training overview')).toBeTruthy();
});

test('preview quiz submission never saves student progress or attempts', async () => {
  mount('/student-view/alice/course/printer/lesson/intro');
  fireEvent.click(await screen.findByRole('button', { name: 'Watch video' }));
  fireEvent.click(screen.getByRole('button', { name: 'Finish video' }));
  fireEvent.click(screen.getByRole('button', { name: 'Submit quiz' }));
  await waitFor(() => expect(screen.getByText('Introduction')).toBeTruthy());
  for (const write of [recordVideoWatchProgress, markVideoCompleted, recordQuizProgress, createAttempt, updateAssignmentStatus]) expect(write).not.toHaveBeenCalled();
});

test('students cannot open another student preview', async () => {
  mount('/student-view/alice', false);
  expect(await screen.findByText('Welcome, Teacher.')).toBeTruthy();
  expect(listAssignmentsForUser).not.toHaveBeenCalledWith('alice');
});


test('preview of an unfinished video cannot record watch time or completion', async () => {
  fixtures.progress.lessons.intro.videoCompleted = false;
  mount('/student-view/alice/course/printer/lesson/intro');
  fireEvent.click(await screen.findByRole('button', { name: 'Watch video' }));
  fireEvent.click(screen.getByRole('button', { name: 'Finish video' }));
  expect(recordVideoWatchProgress).not.toHaveBeenCalled();
  expect(markVideoCompleted).not.toHaveBeenCalled();
  expect(updateAssignmentStatus).not.toHaveBeenCalled();
});

test('preview cannot open a course not assigned to the selected student', async () => {
  mount('/student-view/alice/course/unassigned');
  expect(await screen.findByText('This course is not available to this student.')).toBeTruthy();
  expect(screen.queryByText('Course lessons')).toBeNull();
});

test('preview cannot open an unpublished assigned course', async () => {
  getCourse.mockResolvedValueOnce({ id: 'printer', title: 'Draft training', status: 'draft' });
  mount('/student-view/alice/course/printer');
  expect(await screen.findByText('This course is not available to this student.')).toBeTruthy();
  expect(screen.queryByText('Course lessons')).toBeNull();
});

test('student view picker opens the selected user preview', async () => {
  mount('/admin/student-view');
  fireEvent.change(await screen.findByLabelText('Class'), { target: { value: 'First' } });
  fireEvent.change(screen.getByLabelText('User'), { target: { value: 'alice' } });
  fireEvent.click(screen.getByRole('link', { name: 'Open student view' }));
  expect(await screen.findByText('Welcome, Alice.')).toBeTruthy();
});
