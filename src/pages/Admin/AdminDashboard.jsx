import { createElement, useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, CheckCircle2, ClipboardList, Users } from 'lucide-react';
import { listUsers } from '../../services/adminService';
import { listAllCourses } from '../../services/courseService';
import { listAllAssignments } from '../../services/assignmentService';
import { listAllProgress } from '../../services/progressService';
import { listAllAttempts } from '../../services/attemptService';
import { formatTimestamp } from '../../utils/format';
import StatusBadge from '../../components/ui/StatusBadge';

function Stat({ icon, label, value, note }) {
  return <div className="hive-panel p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">{createElement(icon)}</div></div></div>;
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([listUsers(), listAllCourses(), listAllAssignments(), listAllProgress(), listAllAttempts()])
      .then(([users, courses, assignments, progress, attempts]) => setData({ users, courses, assignments, progress, attempts }))
      .catch((err) => setError(err.message));
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;
    const learners = data.users.filter((user) => user.role !== 'admin');
    const published = data.courses.filter((course) => course.status === 'published').length;
    const completed = data.progress.filter((progress) => progress.percentComplete >= 100).length;
    const avg = data.progress.length ? Math.round(data.progress.reduce((sum, p) => sum + Number(p.percentComplete || 0), 0) / data.progress.length) : 0;
    return { learners: learners.length, published, completed, avg };
  }, [data]);

  if (error) return <div className="hive-page"><div className="rounded-xl bg-red-50 p-5 text-red-700">{error}</div></div>;
  if (!data || !stats) return <div className="hive-loading">Loading admin overview…</div>;
  const recentAttempts = [...data.attempts].sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)).slice(0, 8);
  const userMap = Object.fromEntries(data.users.map((user) => [user.uid || user.id, user]));
  const courseMap = Object.fromEntries(data.courses.map((course) => [course.id, course]));

  return (
    <div className="hive-page">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-amber-600">The Hive Administration</p><h1 className="mt-2 text-4xl font-black">Training overview</h1><p className="mt-2 text-slate-500">Monitor equipment training, quiz activity, and completion across The Hive.</p></div></div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={Users} label="Students" value={stats.learners} note="Signed-in learners" /><Stat icon={BookOpenCheck} label="Published courses" value={stats.published} note={`${data.courses.length} total courses`} /><Stat icon={CheckCircle2} label="Completions" value={stats.completed} note="Completed assignments" /><Stat icon={ClipboardList} label="Average progress" value={`${stats.avg}%`} note={`${data.assignments.length} assignments`} /></div>
      <section className="hive-panel mt-7 overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="text-xl font-black">Recent quiz attempts</h2><p className="mt-1 text-sm text-slate-500">Newest submitted knowledge checks across assigned courses.</p></div><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Course</th><th className="px-5 py-3">Score</th><th className="px-5 py-3">Result</th><th className="px-5 py-3">Submitted</th></tr></thead><tbody className="divide-y divide-slate-100">{recentAttempts.map((attempt) => <tr key={attempt.id}><td className="px-5 py-4 font-bold">{userMap[attempt.uid]?.displayName || userMap[attempt.uid]?.email || attempt.uid}</td><td className="px-5 py-4 text-slate-600">{courseMap[attempt.courseId]?.title || 'Course'}</td><td className="px-5 py-4 font-black">{attempt.scorePercent}%</td><td className="px-5 py-4"><StatusBadge status={attempt.passed ? 'passed' : 'failed'} /></td><td className="px-5 py-4 text-slate-500">{formatTimestamp(attempt.submittedAt)}</td></tr>)}</tbody></table></div>{!recentAttempts.length && <p className="p-6 text-center text-sm text-slate-500">No quiz attempts yet.</p>}</section>
    </div>
  );
}
