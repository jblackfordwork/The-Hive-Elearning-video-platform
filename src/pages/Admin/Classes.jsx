import ClassAssignmentReport from '../../components/admin/ClassAssignmentReport';
import { listAllProgress } from '../../services/progressService';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardPlus, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { listUsers } from '../../services/adminService';
import { listAllCourses } from '../../services/courseService';
import { assignTrainingsToUsers, listAllAssignments, unassignCourse } from '../../services/assignmentService';
import { getClassOptions, normalizeClassName } from '../../domain/classes';

export default function Classes() {
  const [params, setParams] = useSearchParams();
  const className = params.has('class') ? params.get('class') : null;
  return <ClassPage key={JSON.stringify(className)} className={className} onOpenClass={name => setParams(name === null ? {} : { class: name })} />;
}

function ClassPage({ className, onOpenClass }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [courseIds, setCourseIds] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([listUsers(), listAllCourses(), listAllAssignments(), listAllProgress()]).then(([users, courses, assignments, progress]) => {
      if (active) setData({ users: users.filter(item => item.role !== 'admin'), courses: courses.filter(item => item.status === 'published'), allCourses: courses, assignments, progress });
    }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  const students = data?.users.filter(item => normalizeClassName(item.className) === className) || [];
  const classOptions = getClassOptions(data?.users || []);
  const openClass = value => {
    onOpenClass(value);
    setCourseIds([]);
    setDueDate('');
    setMessage('');
    setError('');
  };
  const toggleCourse = id => setCourseIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  const assign = async () => {
    if (busy || !students.length || !courseIds.length) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await assignTrainingsToUsers({
        userIds: students.map(student => student.uid || student.id), courseIds,
        assignedBy: user.uid, dueDate: dueDate ? new Date(`${dueDate}T23:59:59`) : null,
      });
      setMessage(`${result.created} assignment${result.created === 1 ? '' : 's'} added. ${result.skipped} already assigned; existing progress was kept.`);
      if (result.failed) setError(`${result.failed} assignment${result.failed === 1 ? '' : 's'} could not be saved. Try again; assignments already saved will be kept.`);
      else setCourseIds([]);
      try {
        const assignments = await listAllAssignments();
        setData(current => ({ ...current, assignments }));
      } catch {
        setError('Assignments were processed, but the updated list could not be loaded. Refresh this page to see the latest assignments.');
      }
    } catch (err) {
      setError(err.message || 'Unable to assign training. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const removeAssignments = async (items, description) => {
    if (busy || !items.length) return;
    if (!window.confirm(`Remove ${description} (${items.length} assignment${items.length === 1 ? '' : 's'})? Progress and quiz history will be kept.`)) return;
    setBusy(true);
    setError('');
    setMessage('');
    const removed = new Set();
    let failed = 0;
    try {
      for (let start = 0; start < items.length; start += 10) {
        const chunk = items.slice(start, start + 10);
        const results = await Promise.allSettled(chunk.map(item => unassignCourse(item.uid, item.courseId)));
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') removed.add(chunk[index].id);
          else failed += 1;
        });
      }
      setData(current => ({ ...current, assignments: current.assignments.filter(item => !removed.has(item.id)) }));
      setMessage(`${removed.size} assignment${removed.size === 1 ? '' : 's'} removed. Progress and quiz history were kept.`);
      if (failed) setError(`${failed} assignment${failed === 1 ? '' : 's'} could not be removed. Try again to remove the remaining assignments.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hive-page">
      <p className="text-xs font-black uppercase tracking-[.18em] text-amber-600">Class management</p>
      {className !== null && <button type="button" disabled={busy} onClick={() => onOpenClass(null)} className="mt-3 font-bold text-amber-700">← All classes</button>}
      <h1 className="mt-2 text-4xl font-black">{className === null ? 'Classes' : className || 'Unassigned'}</h1>
      <p className="mt-2 text-slate-500">Open a class to view its students and assign trainings to everyone at once.</p>
      {!data && !error && <p className="mt-6">Loading classes…</p>}
      {data && !classOptions.length && <div className="hive-panel mt-6 p-6"><p>No students have signed in yet.</p><Link to="/admin/users" className="hive-secondary-button mt-4">Manage class membership</Link></div>}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {classOptions.map(name => {
          const count = data.users.filter(item => normalizeClassName(item.className) === name).length;
          return <button key={name} type="button" disabled={busy} aria-pressed={className === name} onClick={() => openClass(name)} className={`rounded-2xl border p-5 text-left transition disabled:opacity-60 ${className === name ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300' : 'border-slate-200 bg-white hover:border-amber-300'}`}><span className="flex items-center gap-3 text-lg font-black"><Users size={22} />{name || 'Unassigned'}</span><span className="mt-2 block text-sm text-slate-500">{count} student{count === 1 ? '' : 's'}</span></button>;
        })}
      </div>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
      {message && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">{message}</p>}
      {className !== null && data && <ClassAssignmentReport students={students} assignments={data.assignments} courses={data.allCourses} progress={data.progress} busy={busy} onRemove={removeAssignments} />}
      {className !== null && data && <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_1.3fr]">
        <section className="hive-panel p-6">
          <h2 className="text-2xl font-black">{className || 'Unassigned'} roster</h2>
          <p className="mt-2 text-sm text-slate-500">{students.length} students • <Link to="/admin/users" className="font-bold text-amber-700">Manage class membership</Link></p>
          <ul className="mt-5 divide-y divide-slate-100">{students.map(student => <li key={student.uid || student.id} className="py-3"><Link to={`/admin/students/${student.uid || student.id}`} className="font-bold text-amber-700 hover:underline">{student.displayName || student.email}</Link><p className="break-all text-sm text-slate-500">{student.email}</p></li>)}</ul>
        </section>
        <section className="hive-panel p-6">
          <h2 className="text-2xl font-black">Assign training to the whole class</h2>
          <p className="mt-2 text-sm text-slate-500">Select one or more published trainings. Existing assignments, due dates, and progress will be kept. This applies to the current roster.</p>
          <fieldset disabled={busy} className="mt-5">
            <legend className="hive-label">Trainings</legend>
            {data.courses.length > 0 ? <><button type="button" className="mb-3 text-sm font-bold text-amber-700" onClick={() => setCourseIds(courseIds.length === data.courses.length ? [] : data.courses.map(course => course.id))}>{courseIds.length === data.courses.length ? 'Clear trainings' : 'Select all trainings'}</button><div className="max-h-80 space-y-2 overflow-y-auto">{data.courses.map(course => <label key={course.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${courseIds.includes(course.id) ? 'border-amber-400 bg-amber-50' : 'border-slate-200'}`}><input type="checkbox" checked={courseIds.includes(course.id)} onChange={() => toggleCourse(course.id)} /><span className="font-bold">{course.title}</span></label>)}</div></> : <p className="text-sm text-slate-500">No published trainings yet. <Link to="/admin/courses" className="font-bold text-amber-700">Manage courses</Link></p>}
            <label htmlFor="class-due-date" className="hive-label mt-5">Due date (optional)</label>
            <input id="class-due-date" type="date" className="hive-input" value={dueDate} onChange={event => setDueDate(event.target.value)} />
          </fieldset>
          <button type="button" disabled={busy || !courseIds.length || !students.length} onClick={assign} className="hive-primary-button mt-5"><ClipboardPlus size={18} />{busy ? 'Assigning…' : `Assign ${courseIds.length} training${courseIds.length === 1 ? '' : 's'} to ${students.length} student${students.length === 1 ? '' : 's'}`}</button>
        </section>
      </div>}
      {data && classOptions.length > 0 && className === null && <p className="mt-7 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">Select a class above to get started.</p>}
    </div>
  );
}
