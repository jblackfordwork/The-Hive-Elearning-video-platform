import { Link } from 'react-router-dom';
import { Check, LockKeyhole, PlayCircle } from 'lucide-react';
import { isLessonUnlocked } from '../../domain/progress';

export default function LessonList({ courseId, lessons, completedLessonIds = [] }) {
  return (
    <div className="space-y-3">
      {lessons.map((lesson, index) => {
        const complete = completedLessonIds.includes(lesson.id);
        const unlocked = isLessonUnlocked(lessons, lesson.id, completedLessonIds);
        const content = (
          <div className={`flex items-center gap-4 rounded-2xl border p-4 transition ${complete ? 'border-emerald-200 bg-emerald-50' : unlocked ? 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-sm' : 'border-slate-200 bg-slate-50 opacity-65'}`}>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black ${complete ? 'bg-emerald-600 text-white' : unlocked ? 'bg-slate-950 text-amber-300' : 'bg-slate-200 text-slate-500'}`}>{complete ? <Check size={20} /> : unlocked ? <PlayCircle size={20} /> : <LockKeyhole size={18} />}</div>
            <div className="min-w-0 flex-1"><p className="text-xs font-black uppercase tracking-[.14em] text-slate-400">Lesson {index + 1}</p><h3 className="truncate font-black text-slate-900">{lesson.title}</h3></div>
            <span className="text-xs font-bold text-slate-500">{complete ? 'Complete' : unlocked ? 'Open' : 'Locked'}</span>
          </div>
        );
        return unlocked ? <Link key={lesson.id} to={`/course/${courseId}/lesson/${lesson.id}`} className="block">{content}</Link> : <div key={lesson.id}>{content}</div>;
      })}
    </div>
  );
}
