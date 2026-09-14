import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Classes from '../../src/pages/Admin/Classes';
import { AuthContext } from '../../src/context/AuthContext';
import { assignTrainingsToUsers, unassignCourse } from '../../src/services/assignmentService';

vi.mock('../../src/lib/firebase', () => ({ firebaseReady: true, auth: null, db: null }));
vi.mock('../../src/services/adminService', () => ({ listUsers: vi.fn(async () => [
  { uid: 'alice', displayName: 'Alice', className: 'First', role: 'student' },
  { uid: 'bob', displayName: 'Bob', className: 'First', role: 'student' },
  { uid: 'carol', displayName: 'Carol', className: 'Second', role: 'student' },
  { uid: 'teacher', displayName: 'Teacher', className: 'First', role: 'admin' },
]) }));
vi.mock('../../src/services/courseService', () => ({ listAllCourses: vi.fn(async () => [
  { id: 'printer', title: 'Printer training', status: 'published' },
  { id: 'press', title: 'Heat press', status: 'published' },
  { id: 'draft', title: 'Unpublished training', status: 'draft' },
]) }));
vi.mock('../../src/services/assignmentService', () => ({
  assignTrainingsToUsers: vi.fn(async () => ({ created: 3, skipped: 1, failed: 0 })),
  unassignCourse: vi.fn(async () => {}),
  listAllAssignments: vi.fn(async () => [
    { id: 'alice_printer', uid: 'alice', courseId: 'printer', status: 'in_progress' },
    { id: 'bob_printer', uid: 'bob', courseId: 'printer', status: 'assigned' },
    { id: 'carol_printer', uid: 'carol', courseId: 'printer', status: 'assigned' },
  ]),
}));
vi.mock('../../src/services/progressService', () => ({ listAllProgress: vi.fn(async () => [
  { uid: 'alice', courseId: 'printer', percentComplete: 60 },
  { uid: 'alice', courseId: 'removed', percentComplete: 100 },
  { uid: 'carol', courseId: 'printer', percentComplete: 100 },
]) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.restoreAllMocks(); });
function mount(path = "/admin/classes") {
  render(<AuthContext.Provider value={{ user: { uid: 'teacher' } }}><MemoryRouter initialEntries={[path]}><Classes /></MemoryRouter></AuthContext.Provider>);
}
test('opens a class roster and assigns multiple published trainings to every student', async () => {
  mount();
  fireEvent.click(await screen.findByRole('button', { name: /First.*2 students/ }));
  expect((await screen.findByRole('link', { name: 'Alice' })).getAttribute('href')).toBe('/admin/students/alice');
  expect(screen.queryByText('Carol')).toBeNull();
  expect(screen.queryByText('Teacher')).toBeNull();
  expect(screen.queryByText('Unpublished training')).toBeNull();
  fireEvent.click(await screen.findByLabelText('Printer training'));
  fireEvent.click(screen.getByLabelText('Heat press'));
  fireEvent.click(screen.getByRole('button', { name: 'Assign 2 trainings to 2 students' }));
  await waitFor(() => expect(assignTrainingsToUsers).toHaveBeenCalledWith({ userIds: ['alice', 'bob'], courseIds: ['printer', 'press'], assignedBy: 'teacher', dueDate: null }));
  expect(await screen.findByRole('status')).toHaveProperty('textContent', '3 assignments added. 1 already assigned; existing progress was kept.');
});
test('switching classes resets selected trainings and targets only the new class', async () => {
  mount();
  fireEvent.click(await screen.findByRole('button', { name: /First.*2 students/ }));
  fireEvent.click(await screen.findByLabelText('Printer training'));
  fireEvent.click(screen.getByRole('button', { name: /Second.*1 student/ }));
  expect((await screen.findByLabelText('Printer training')).checked).toBe(false);
  fireEvent.click(screen.getByLabelText('Heat press'));
  fireEvent.click(screen.getByRole('button', { name: 'Assign 1 training to 1 student' }));
  await waitFor(() => expect(assignTrainingsToUsers).toHaveBeenCalledWith(expect.objectContaining({ userIds: ['carol'], courseIds: ['press'] })));
});
test('partial failure stays visible and allows a safe retry', async () => {
  assignTrainingsToUsers.mockResolvedValueOnce({ created: 1, skipped: 0, failed: 1 });
  mount();
  fireEvent.click(await screen.findByRole('button', { name: /First.*2 students/ }));
  fireEvent.click(await screen.findByLabelText('Printer training'));
  fireEvent.click(screen.getByRole('button', { name: 'Assign 1 training to 2 students' }));
  expect((await screen.findByRole('alert')).textContent).toContain('1 assignment could not be saved');
  expect((await screen.findByLabelText('Printer training')).checked).toBe(true);
  expect(screen.getByRole('button', { name: 'Assign 1 training to 2 students' }).disabled).toBe(false);
});


test('class detail can be opened directly and shows progress for current assignments only', async () => {
  mount('/admin/classes?class=First');
  expect(await screen.findByRole('heading', { name: 'First' })).toBeTruthy();
  const table = await screen.findByRole('table', { name: 'Student assignments' });
  expect(within(table).getByText('60%')).toBeTruthy();
  expect(within(table).getByText('0%')).toBeTruthy();
  expect(within(table).queryByText('Carol')).toBeNull();
  expect(screen.getByRole('region', { name: 'Class progress' }).textContent).toContain('30%');
});
test('removes a training from this class only after confirmation', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  mount('/admin/classes?class=First');
  fireEvent.click(await screen.findByRole('button', { name: 'Remove Printer training from class' }));
  await waitFor(() => expect(unassignCourse).toHaveBeenCalledTimes(2));
  expect(unassignCourse).toHaveBeenCalledWith('alice', 'printer');
  expect(unassignCourse).toHaveBeenCalledWith('bob', 'printer');
  expect(unassignCourse).not.toHaveBeenCalledWith('carol', 'printer');
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Remove Printer training from Alice' })).toBeNull());
  expect(window.confirm.mock.calls[0][0]).toContain('Progress and quiz history will be kept');
});
test('individual removal supports cancellation and does not remove classmates assignments', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  mount('/admin/classes?class=First');
  const button = await screen.findByRole('button', { name: 'Remove Printer training from Alice' });
  fireEvent.click(button);
  expect(unassignCourse).not.toHaveBeenCalled();
  confirm.mockReturnValue(true);
  fireEvent.click(button);
  await waitFor(() => expect(unassignCourse).toHaveBeenCalledTimes(1));
  expect(unassignCourse).toHaveBeenCalledWith('alice', 'printer');
  expect(screen.getByRole('button', { name: 'Remove Printer training from Bob' })).toBeTruthy();
});
test('failed class removals remain visible for retry while successful removals disappear', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  unassignCourse.mockRejectedValueOnce(new Error('Network unavailable'));
  mount('/admin/classes?class=First');
  fireEvent.click(await screen.findByRole('button', { name: 'Remove Printer training from class' }));
  expect((await screen.findByRole('alert')).textContent).toContain('1 assignment could not be removed');
  expect(screen.getByRole('button', { name: 'Remove Printer training from Alice' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Remove Printer training from Bob' })).toBeNull();
});

test('removes all assignments for one student while keeping classmates assignments', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  mount('/admin/classes?class=First');
  fireEvent.click(await screen.findByRole('button', { name: 'Remove all assignments from Alice' }));
  await waitFor(() => expect(unassignCourse).toHaveBeenCalledTimes(1));
  expect(unassignCourse).toHaveBeenCalledWith('alice', 'printer');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Remove all assignments from Alice' }).disabled).toBe(true));
  expect(screen.getByRole('button', { name: 'Remove Printer training from Bob' })).toBeTruthy();
});

test('student filter shows only that students assignments', async () => {
  mount('/admin/classes?class=First');
  fireEvent.change(await screen.findByLabelText('Filter by student'), { target: { value: 'alice' } });
  const table = screen.getByRole('table', { name: 'Student assignments' });
  expect(within(table).getByText('Alice')).toBeTruthy();
  expect(within(table).queryByText('Bob')).toBeNull();
});
