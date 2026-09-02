import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, Wrench } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import StatusBadge from '../ui/StatusBadge';

export default function CourseCard({ course, assignment, progress }) {
  const percent = progress?.percentComplete || 0;
  const status = percent >= 100 ? 'completed' : percent > 0 ? 'in_progress' : assignment?.status || 'assigned';
  return (
    <article className="hive-panel overflow-hidden flex flex-col">
      <div className="relative aspect-[16/7] bg-slate-900 overflow-hidden">
        {course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover opacity-80" /> : <div className="h-full w-full hive-grid flex items-center justify-center text-amber-300"><Wrench size={48} /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-[.16em] text-amber-300">Equipment Training</p><h3 className="mt-1 text-xl font-black text-white">{course.title}</h3></div>
          <StatusBadge status={status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm leading-relaxed text-slate-600 line-clamp-3">{course.description || `Training and safe-operation procedures for ${course.equipmentName || course.title}.`}</p>
        <div className="mt-5"><ProgressBar value={percent} /></div>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="flex items-center gap-2 text-xs font-bold text-slate-500">{percent >= 100 ? <CheckCircle2 size={16} className="text-emerald-600" /> : <BookOpen size={16} />} {percent >= 100 ? 'Training completed' : percent > 0 ? 'Continue where you left off' : 'Ready to begin'}</span>
          <Link to={`/course/${course.id}`} className="hive-primary-button text-sm">{percent > 0 && percent < 100 ? 'Continue' : percent >= 100 ? 'Review' : 'Start'} <ArrowRight size={16} /></Link>
        </div>
      </div>
    </article>
  );
}
