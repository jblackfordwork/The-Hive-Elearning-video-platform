import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { getAttempt } from '../../services/attemptService';
import { getCourse, getLesson } from '../../services/courseService';
import { getUserProfile } from '../../services/userService';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatTimestamp } from '../../utils/format';

export default function AttemptDetail() {
  const { attemptId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { getAttempt(attemptId).then(async (attempt) => { if (!attempt) throw new Error('Quiz attempt not found.'); const [user, course, lesson] = await Promise.all([getUserProfile(attempt.uid), getCourse(attempt.courseId), getLesson(attempt.courseId, attempt.lessonId)]); setData({ attempt, user, course, lesson }); }).catch((err) => setError(err.message)); }, [attemptId]);
  if (error) return <div className="hive-page"><div className="rounded-xl bg-red-50 p-5 text-red-700">{error}</div></div>;
  if (!data) return <div className="hive-loading">Loading quiz result…</div>;
  const { attempt } = data;
  return <div className="hive-page max-w-5xl"><Link to={`/admin/students/${attempt.uid}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"><ArrowLeft size={16} /> Student record</Link><section className="hive-panel mt-5 p-6 sm:p-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-amber-600">Quiz attempt</p><h1 className="mt-2 text-3xl font-black">{data.course?.title || 'Course'} — {data.lesson?.title || 'Lesson'}</h1><p className="mt-2 text-slate-500">{data.user?.displayName || data.user?.email || attempt.uid} • {formatTimestamp(attempt.submittedAt)}</p></div><div className="text-left sm:text-right"><StatusBadge status={attempt.passed ? 'passed' : 'failed'} /><p className="mt-2 text-4xl font-black">{attempt.scorePercent}%</p><p className="text-xs text-slate-500">{attempt.correctCount}/{attempt.totalQuestions} correct • {attempt.passingScorePercent}% required</p></div></div></section><div className="mt-6 space-y-4">{(attempt.questions || []).map((question, index) => <section key={`${question.questionId || question.id}-${index}`} className="hive-panel p-5 sm:p-6"><div className="flex items-start gap-3">{question.correct ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 shrink-0 text-red-600" />}<div className="flex-1"><p className="text-xs font-black uppercase text-slate-400">Question {index + 1}</p><h2 className="mt-1 font-black">{question.prompt}</h2><div className="mt-4 grid gap-2">{(question.options || []).map((option) => { const selected = option.id === question.selectedOptionId; const correct = option.id === question.correctOptionId; return <div key={option.id} className={`rounded-xl border p-3 text-sm ${correct ? 'border-emerald-300 bg-emerald-50 font-bold text-emerald-900' : selected ? 'border-red-300 bg-red-50 font-bold text-red-900' : 'border-slate-200 bg-slate-50 text-slate-600'}`}><span>{option.text}</span>{correct && <span className="ml-2 text-xs uppercase">Correct answer</span>}{selected && <span className="ml-2 text-xs uppercase">Student selected</span>}</div>; })}</div>{question.explanation && <p className="mt-4 text-sm text-slate-600"><strong>Explanation:</strong> {question.explanation}</p>}</div></div></section>)}</div></div>;
}
