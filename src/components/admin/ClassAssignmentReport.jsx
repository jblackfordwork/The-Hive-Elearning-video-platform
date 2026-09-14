import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProgressBar from '../ui/ProgressBar';
import { formatTimestamp } from '../../utils/format';

export default function ClassAssignmentReport({ students, assignments, courses, progress, busy, onRemove }) {
  const [studentId, setStudentId] = useState('');
  const studentMap = new Map(students.map(student => [student.uid || student.id, student]));
  const courseMap = new Map(courses.map(course => [course.id, course]));
  const progressMap = new Map(progress.map(item => [JSON.stringify([item.uid, item.courseId]), item]));
  const rows = assignments.filter(item => studentMap.has(item.uid)).map(assignment => {
    const itemProgress = progressMap.get(JSON.stringify([assignment.uid, assignment.courseId]));
    const percent = assignment.status === 'completed' ? 100 : Math.max(0, Math.min(100, Number(itemProgress?.percentComplete) || 0));
    return { assignment, percent, student: studentMap.get(assignment.uid), course: courseMap.get(assignment.courseId) };
  });
  const average = items => items.length ? Math.round(items.reduce((sum, row) => sum + row.percent, 0) / items.length) : 0;
  const courseIds = [...new Set(rows.map(row => row.assignment.courseId))];
  const visibleRows = rows.filter(row => !studentId || row.assignment.uid === studentId);

  return <div className="mt-7 space-y-6">
    <section aria-label="Class progress" className="hive-panel p-6">
      <h2 className="text-2xl font-black">Class progress</h2>
      <p className="mt-2 text-sm text-slate-500">Current assignments only. Students who have not started count as 0%.</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-3"><div><p className="text-3xl font-black">{rows.length}</p><p className="text-sm text-slate-500">Assignments</p></div><div><p className="text-3xl font-black">{rows.filter(row => row.percent >= 100).length}</p><p className="text-sm text-slate-500">Completed</p></div><ProgressBar value={average(rows)} /></div>
    </section>
    <section className="hive-panel p-6">
      <h2 className="text-2xl font-black">Class trainings</h2>
      <p className="mt-2 text-sm text-slate-500">Remove a training from everyone currently in this class. Progress and quiz history will be kept.</p>
      <div className="mt-5 space-y-4">{courseIds.map(id => {
        const items = rows.filter(row => row.assignment.courseId === id);
        const title = courseMap.get(id)?.title || id;
        return <div key={id} className="grid items-center gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-[1fr_160px_auto]"><div><h3 className="font-black">{title}</h3><p className="text-sm text-slate-500">Assigned to {items.length} of {students.length} students • {items.filter(row => row.percent >= 100).length} completed</p></div><ProgressBar value={average(items)} /><button type="button" disabled={busy} aria-label={`Remove ${title} from class`} className="hive-danger-button" onClick={() => onRemove(items.map(row => row.assignment), `${title} from this class`)}>Remove from class</button></div>;
      })}</div>
      {!rows.length && <p className="mt-5 text-slate-500">No trainings assigned to this class.</p>}
    </section>
    <section className="hive-panel overflow-hidden">
      <div className="p-6"><h2 className="text-2xl font-black">Student progress</h2><p className="mt-2 text-sm text-slate-500">Open a student record for lesson progress and quiz attempts.</p></div>
      <div className="overflow-x-auto"><table aria-label="Student progress" className="min-w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-4">Student</th><th className="p-4">Completed</th><th className="p-4 min-w-40">Average progress</th><th className="p-4">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{students.map(student => {
        const uid = student.uid || student.id;
        const items = rows.filter(row => row.assignment.uid === uid);
        const name = student.displayName || student.email || uid;
        return <tr key={uid}><td className="p-4 font-bold">{name}</td><td className="p-4">{items.filter(row => row.percent >= 100).length} / {items.length}</td><td className="p-4"><ProgressBar value={average(items)} /></td><td className="p-4"><div className="flex flex-wrap gap-3"><Link to={`/admin/students/${uid}`} className="font-bold text-amber-700">View record</Link><Link to={`/student-view/${uid}`} className="font-bold text-amber-700">Student view</Link><button type="button" disabled={busy || !items.length} aria-label={`Remove all assignments from ${name}`} className="font-bold text-red-700 disabled:opacity-40" onClick={() => onRemove(items.map(row => row.assignment), `all assignments from ${name}`)}>Remove all assignments</button></div></td></tr>;
      })}</tbody></table></div>
    </section>
    <section className="hive-panel overflow-hidden">
      <div className="p-6"><h2 className="text-2xl font-black">Individual assignments</h2><label htmlFor="assignment-student" className="hive-label mt-4">Filter by student</label><select id="assignment-student" className="hive-input max-w-md" value={studentId} disabled={busy} onChange={event => setStudentId(event.target.value)}><option value="">All students</option>{students.map(student => <option key={student.uid || student.id} value={student.uid || student.id}>{student.displayName || student.email}</option>)}</select></div>
      <div className="overflow-x-auto"><table aria-label="Student assignments" className="min-w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-4">Student</th><th className="p-4">Training</th><th className="p-4 min-w-40">Progress</th><th className="p-4">Due</th><th className="p-4">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleRows.map(({ assignment, percent, student, course }) => {
        const name = student.displayName || student.email || assignment.uid;
        const title = course?.title || assignment.courseId;
        return <tr key={assignment.id}><td className="p-4 font-bold">{name}</td><td className="p-4">{title}</td><td className="p-4"><ProgressBar value={percent} /></td><td className="p-4 text-slate-500">{formatTimestamp(assignment.dueDate)}</td><td className="p-4"><button type="button" disabled={busy} aria-label={`Remove ${title} from ${name}`} className="hive-danger-button" onClick={() => onRemove([assignment], `${title} from ${name}`)}>Remove assignment</button></td></tr>;
      })}</tbody></table></div>
      {!visibleRows.length && <p className="p-6 text-slate-500">No assignments for this selection.</p>}
    </section>
  </div>;
}
