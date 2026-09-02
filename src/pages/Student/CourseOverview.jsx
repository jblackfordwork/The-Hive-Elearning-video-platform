import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Award, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getCourse, listLessons } from '../../services/courseService';
import { getProgress } from '../../services/progressService';
import LessonList from '../../components/course/LessonList';
import ProgressBar from '../../components/ui/ProgressBar';

export default function CourseOverview() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getCourse(courseId), listLessons(courseId), getProgress(user.uid, courseId)])
      .then(([course, lessons, progress]) => setData({ course, lessons, progress }))
      .catch((err) => setError(err.message));
  }, [courseId, user.uid]);

  if (error) return <div className="hive-page"><div className="rounded-xl bg-red-50 p-5 text-red-700">{error}</div></div>;
  if (!data) return <div className="hive-loading">Loading course…</div>;
  if (!data.course) return <div className="hive-page">Course not found.</div>;

  const complete = data.progress.percentComplete >= 100;
  return (
    <div className="hive-page max-w-6xl">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> My Training</Link>
      <section className="mt-5 overflow-hidden rounded-3xl bg-slate-950 text-white">
        <div className="grid lg:grid-cols-[1fr_340px]">
          <div className="p-7 sm:p-10"><p className="text-xs font-black uppercase tracking-[.18em] text-amber-300">{data.course.equipmentName || 'Equipment Training'}</p><h1 className="mt-3 text-4xl sm:text-5xl font-black">{data.course.title}</h1><p className="mt-4 max-w-2xl text-slate-300 leading-relaxed">{data.course.description}</p><div className="mt-7 max-w-xl"><ProgressBar value={data.progress.percentComplete} /></div></div>
          <div className="hive-grid border-t border-slate-800 p-7 lg:border-l lg:border-t-0 flex items-center justify-center">{complete ? <div className="text-center"><Award size={62} className="mx-auto text-amber-300" /><p className="mt-4 text-xl font-black">Training Complete</p><p className="mt-2 text-sm text-slate-300">You may review any lesson at any time.</p></div> : <div className="text-center"><ClipboardCheck size={56} className="mx-auto text-amber-300" /><p className="mt-4 font-black">{data.progress.completedLessonIds?.length || 0} of {data.lessons.length} lessons complete</p><p className="mt-2 text-sm text-slate-300">Finish each lesson in order to unlock the next.</p></div>}</div>
        </div>
      </section>
      <section className="mt-8"><div className="mb-5"><h2 className="text-2xl font-black">Course lessons</h2><p className="text-sm text-slate-500">Complete each video, then pass the quiz when one is required.</p></div><LessonList courseId={courseId} lessons={data.lessons} completedLessonIds={data.progress.completedLessonIds || []} /></section>
    </div>
  );
}
