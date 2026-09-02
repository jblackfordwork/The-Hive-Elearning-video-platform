import { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { listAssignmentsForUser } from '../../services/assignmentService';
import { getCoursesByIds } from '../../services/courseService';
import { listProgressForUser } from '../../services/progressService';
import { splitCoursesByCompletion } from '../../domain/courseProgress';
import CourseCard from '../../components/course/CourseCard';
import EmptyState from '../../components/ui/EmptyState';

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [assignments, progressList] = await Promise.all([listAssignmentsForUser(user.uid), listProgressForUser(user.uid)]);
        const courses = await getCoursesByIds(assignments.map((assignment) => assignment.courseId));
        const courseMap = Object.fromEntries(courses.map((course) => [course.id, course]));
        const progressMap = Object.fromEntries(progressList.map((progress) => [progress.courseId, progress]));
        const nextItems = assignments.map((assignment) => ({ assignment, course: courseMap[assignment.courseId], progress: progressMap[assignment.courseId] })).filter((item) => item.course && item.course.status !== 'archived');
        if (active) setItems(nextItems);
      } catch (err) {
        if (active) setError(err.message || 'Unable to load your assigned training.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [user.uid]);

  const grouped = splitCoursesByCompletion(items);
  const visibleItems = activeTab === 'completed' ? grouped.completed : grouped.active;
  const completed = grouped.completed.length;
  if (loading) return <div className="hive-loading">Loading assigned training…</div>;

  return (
    <div className="hive-page">
      <section className="overflow-hidden rounded-3xl bg-slate-950 p-7 sm:p-10 text-white relative">
        <div className="absolute inset-0 hive-grid opacity-30" />
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">The Hive School Store</p><h1 className="mt-3 text-4xl sm:text-5xl font-black">Welcome, {profile?.displayName?.split(' ')[0] || 'Learner'}.</h1><p className="mt-3 max-w-2xl text-slate-300">Complete your assigned equipment training in order. Each lesson unlocks after you finish the video and pass its randomized knowledge check.</p></div>
          <div className="grid grid-cols-2 gap-3 shrink-0"><div className="rounded-2xl border border-slate-700 bg-slate-900 p-4"><p className="text-3xl font-black text-amber-300">{items.length}</p><p className="text-xs font-bold text-slate-400">Assigned courses</p></div><div className="rounded-2xl border border-slate-700 bg-slate-900 p-4"><p className="text-3xl font-black text-emerald-300">{completed}</p><p className="text-xs font-bold text-slate-400">Completed</p></div></div>
        </div>
      </section>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300"><GraduationCap /></div><div><h2 className="text-2xl font-black">My Training</h2><p className="text-sm text-slate-500">Your assigned Hive equipment courses</p></div></div><div className="inline-flex rounded-xl border border-slate-200 bg-white p-1"><button type="button" onClick={() => setActiveTab('active')} className={`rounded-lg px-4 py-2 text-sm font-black ${activeTab === 'active' ? 'bg-slate-950 text-white' : 'text-slate-600'}`}>Active ({grouped.active.length})</button><button type="button" onClick={() => setActiveTab('completed')} className={`rounded-lg px-4 py-2 text-sm font-black ${activeTab === 'completed' ? 'bg-slate-950 text-white' : 'text-slate-600'}`}>Completed ({grouped.completed.length})</button></div></div>
      {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">{visibleItems.map((item) => <CourseCard key={item.assignment.id} {...item} />)}</div>
      {!items.length && !error && <div className="mt-6"><EmptyState title="No training assigned yet" description="When an administrator assigns an equipment course to you, it will appear here automatically." /></div>}
      {items.length > 0 && !visibleItems.length && !error && <div className="mt-6"><EmptyState title={activeTab === 'active' ? 'No active courses' : 'No completed courses yet'} description={activeTab === 'active' ? 'Finished courses move to the Completed tab automatically.' : 'Courses appear here after every lesson is complete.'} /></div>}
    </div>
  );
}
