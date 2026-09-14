import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Classes from '../../src/pages/Admin/Classes';
import { AuthContext } from '../../src/context/AuthContext';
import { assignTrainingsToUsers } from '../../src/services/assignmentService';

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
vi.mock('../../src/services/assignmentService', () => ({ assignTrainingsToUsers: vi.fn(async () => ({ created: 3, skipped: 1, failed: 0 })) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function mount() {
  render(<AuthContext.Provider value={{ user: { uid: 'teacher' } }}><MemoryRouter><Classes /></MemoryRouter></AuthContext.Provider>);
}
test('opens a class roster and assigns multiple published trainings to every student', async () => {
  mount();
  fireEvent.click(await screen.findByRole('button', { name: /First.*2 students/ }));
  expect(screen.getByRole('link', { name: 'Alice' }).getAttribute('href')).toBe('/admin/students/alice');
  expect(screen.queryByText('Carol')).toBeNull();
  expect(screen.queryByText('Teacher')).toBeNull();
  expect(screen.queryByText('Unpublished training')).toBeNull();
  fireEvent.click(screen.getByLabelText('Printer training'));
  fireEvent.click(screen.getByLabelText('Heat press'));
  fireEvent.click(screen.getByRole('button', { name: 'Assign 2 trainings to 2 students' }));
  await waitFor(() => expect(assignTrainingsToUsers).toHaveBeenCalledWith({ userIds: ['alice', 'bob'], courseIds: ['printer', 'press'], assignedBy: 'teacher', dueDate: null }));
  expect(await screen.findByRole('status')).toHaveProperty('textContent', '3 assignments added. 1 already assigned; existing progress was kept.');
});
test('switching classes resets selected trainings and targets only the new class', async () => {
  mount();
  fireEvent.click(await screen.findByRole('button', { name: /First.*2 students/ }));
  fireEvent.click(screen.getByLabelText('Printer training'));
  fireEvent.click(screen.getByRole('button', { name: /Second.*1 student/ }));
  expect(screen.getByLabelText('Printer training').checked).toBe(false);
  fireEvent.click(screen.getByLabelText('Heat press'));
  fireEvent.click(screen.getByRole('button', { name: 'Assign 1 training to 1 student' }));
  await waitFor(() => expect(assignTrainingsToUsers).toHaveBeenCalledWith(expect.objectContaining({ userIds: ['carol'], courseIds: ['press'] })));
});
test('partial failure stays visible and allows a safe retry', async () => {
  assignTrainingsToUsers.mockResolvedValueOnce({ created: 1, skipped: 0, failed: 1 });
  mount();
  fireEvent.click(await screen.findByRole('button', { name: /First.*2 students/ }));
  fireEvent.click(screen.getByLabelText('Printer training'));
  fireEvent.click(screen.getByRole('button', { name: 'Assign 1 training to 2 students' }));
  expect((await screen.findByRole('alert')).textContent).toContain('1 assignment could not be saved');
  expect(screen.getByLabelText('Printer training').checked).toBe(true);
  expect(screen.getByRole('button', { name: 'Assign 1 training to 2 students' }).disabled).toBe(false);
});
