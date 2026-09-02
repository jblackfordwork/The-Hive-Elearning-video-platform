import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, Edit3, Plus } from 'lucide-react';
import { archiveCourse, listAllCourses } from '../../services/courseService';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';

export default function Courses() {
  const [courses, setCourses] = useState([]); const [error, setError] = useState('');
  const load = () => listAllCourses().then(setCourses).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);
  const archive = async (course) => { if (!window.confirm(`Archive “${course.title}”? Existing records are preserved.`)) return; await archiveCourse(course.id); await load(); };
  return <div className="hive-page"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-amber-600">Course authoring</p><h1 className="mt-2 text-4xl font-black">Equipment courses</h1><p className="mt-2 text-slate-500">Build ordered training videos with administrator-authored randomized quizzes.</p></div><Link to="/admin/courses/new" className="hive-primary-button"><Plus size={17} /> New course</Link></div>{error && <div className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}<div className="mt-7 grid gap-4 lg:grid-cols-2">{courses.map((course) => <article key={course.id} className="hive-panel p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.14em] text-amber-600">{course.equipmentName || 'Equipment'}</p><h2 className="mt-1 text-xl font-black">{course.title}</h2></div><StatusBadge status={course.status} /></div><p className="mt-3 line-clamp-2 text-sm text-slate-600">{course.description || 'No description yet.'}</p><div className="mt-5 flex justify-end gap-2"><Link to={`/admin/courses/${course.id}`} className="hive-secondary-button text-xs"><Edit3 size={15} /> Edit course</Link>{course.status !== 'archived' && <button type="button" onClick={() => archive(course)} className="hive-danger-button text-xs"><Archive size={15} /> Archive</button>}</div></article>)}</div>{!courses.length && <div className="mt-7"><EmptyState title="Create the first Hive course" description="Start with one piece of equipment. Add the lesson videos, safety directions, and a quiz question bank for each video." action={<Link to="/admin/courses/new" className="hive-primary-button"><Plus size={16} /> New equipment course</Link>} /></div>}</div>;
}
