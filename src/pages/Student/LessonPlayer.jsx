import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getCourse, listLessons, listQuestions } from '../../services/courseService';
import { getProgress, markVideoCompleted, recordQuizProgress, recordVideoWatchProgress } from '../../services/progressService';
import { createAttempt } from '../../services/attemptService';
import { updateAssignmentStatus } from '../../services/assignmentService';
import { isLessonUnlocked, getNextLesson } from '../../domain/progress';
import TrainingVideo from '../../components/course/TrainingVideo';
import LessonQuiz from '../../components/quiz/LessonQuiz';

export default function LessonPlayer() {
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [savingVideo, setSavingVideo] = useState(false);

  const load = useCallback(async () => {
    const [course, lessons, progress, questions] = await Promise.all([
      getCourse(courseId), listLessons(courseId), getProgress(user.uid, courseId), listQuestions(courseId, lessonId),
    ]);
    setData({ course, lessons, progress, questions });
  }, [courseId, lessonId, user.uid]);

  useEffect(() => { load().catch((err) => setError(err.message)); }, [load]);

  const lesson = useMemo(() => data?.lessons.find((item) => item.id === lessonId), [data, lessonId]);
  const lessonIds = useMemo(() => data?.lessons.map((item) => item.id) || [], [data]);
  const completedIds = data?.progress.completedLessonIds || [];
  const lessonProgress = data?.progress.lessons?.[lessonId] || {};
  const unlocked = data ? isLessonUnlocked(data.lessons, lessonId, completedIds) : true;
  const lessonComplete = completedIds.includes(lessonId);
  const requireQuiz = lesson?.requireQuiz !== false;
  const nextLesson = data && lessonComplete ? getNextLesson(data.lessons, completedIds) : null;

  const handleWatchProgress = useCallback(async ({ watchedSeconds, durationSeconds }) => {
    try {
      const nextProgress = await recordVideoWatchProgress({
        uid: user.uid,
        courseId,
        lessonId,
        watchedSeconds,
        durationSeconds,
      });
      setData((current) => ({ ...current, progress: nextProgress }));
    } catch (err) {
      setError(err.message || 'Unable to save watch time.');
    }
  }, [user.uid, courseId, lessonId]);

  const handleVideoComplete = useCallback(async () => {
    if (!data || savingVideo || lessonProgress.videoCompleted) return;
    setSavingVideo(true);
    try {
      const nextProgress = await markVideoCompleted({ uid: user.uid, courseId, lessonId, lessonIds, requireQuiz });
      setData((current) => ({ ...current, progress: nextProgress }));
      await updateAssignmentStatus(user.uid, courseId, nextProgress.percentComplete >= 100 ? 'completed' : 'in_progress');
    } catch (err) {
      setError(err.message || 'Unable to save video completion.');
    } finally {
      setSavingVideo(false);
    }
  }, [data, savingVideo, lessonProgress.videoCompleted, user.uid, courseId, lessonId, lessonIds, requireQuiz]);

  const handleQuizSubmitted = async (result) => {
    await createAttempt({ uid: user.uid, courseId, lessonId, passingScorePercent: lesson.passingScorePercent, result });
    const nextProgress = await recordQuizProgress({ uid: user.uid, courseId, lessonId, lessonIds, lessons: data.lessons, result });
    setData((current) => ({ ...current, progress: nextProgress }));
    await updateAssignmentStatus(user.uid, courseId, nextProgress.percentComplete >= 100 ? 'completed' : 'in_progress');
  };

  if (error && !data) return <div className="hive-page"><div className="rounded-xl bg-red-50 p-5 text-red-700">{error}</div></div>;
  if (!data) return <div className="hive-loading">Loading lesson…</div>;
  if (!lesson || !data.course) return <Navigate to={`/course/${courseId}`} replace />;
  if (!unlocked) return <div className="hive-page max-w-3xl"><div className="hive-panel p-8 text-center"><LockKeyhole className="mx-auto text-slate-400" size={40} /><h1 className="mt-4 text-2xl font-black">This lesson is still locked</h1><p className="mt-2 text-slate-600">Complete the lessons before this one first.</p><Link to={`/course/${courseId}`} className="hive-primary-button mt-6">Back to course</Link></div></div>;

  return (
    <div className="hive-page max-w-6xl">
      <Link to={`/course/${courseId}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> {data.course.title}</Link>
      <div className="mt-5 grid gap-6 xl:grid-cols-[1fr_330px]">
        <section>
          <div className="mb-5"><p className="text-xs font-black uppercase tracking-[.16em] text-amber-600">Lesson {data.lessons.findIndex((item) => item.id === lessonId) + 1} of {data.lessons.length}</p><h1 className="mt-2 text-3xl sm:text-4xl font-black">{lesson.title}</h1>{lesson.description && <p className="mt-3 text-slate-600 leading-relaxed">{lesson.description}</p>}</div>
          <TrainingVideo videoUrl={lesson.videoUrl} completed={Boolean(lessonProgress.videoCompleted)} watchedSeconds={lessonProgress.watchedSeconds || 0} durationSeconds={lessonProgress.videoDurationSeconds || 0} onComplete={handleVideoComplete} onWatchProgress={handleWatchProgress} />
          {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          <div className="mt-7">
            {!lessonProgress.videoCompleted ? <div className="hive-panel p-7 text-center"><LockKeyhole className="mx-auto text-slate-400" /><h2 className="mt-3 text-xl font-black">{requireQuiz ? 'Quiz unlocks after the video' : 'Video completion required'}</h2><p className="mt-2 text-sm text-slate-500">Watch the training video through the end. Your completion is saved automatically.</p></div> : !requireQuiz ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6"><div className="flex gap-3"><CheckCircle2 className="text-emerald-700 shrink-0" /><div><h2 className="font-black text-emerald-950">Video lesson complete</h2><p className="mt-1 text-sm text-emerald-800">No quiz is required for this lesson.</p></div></div></div> : lessonProgress.quizPassed ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6"><div className="flex gap-3"><CheckCircle2 className="text-emerald-700 shrink-0" /><div><h2 className="font-black text-emerald-950">Knowledge check passed</h2><p className="mt-1 text-sm text-emerald-800">Best score: {lessonProgress.bestScorePercent || 0}% • Attempts: {lessonProgress.attemptCount || 1}</p></div></div></div> : <LessonQuiz questions={data.questions} count={lesson.quizQuestionCount} passingScore={lesson.passingScorePercent} onSubmitted={handleQuizSubmitted} />}
          </div>
        </section>
        <aside className="xl:sticky xl:top-8 xl:self-start">
          <div className="hive-panel p-5"><p className="text-xs font-black uppercase tracking-[.14em] text-slate-400">Lesson requirements</p><div className="mt-4 space-y-3"><div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm font-bold"><span>Watch video</span><span className={lessonProgress.videoCompleted ? 'text-emerald-700' : 'text-slate-400'}>{lessonProgress.videoCompleted ? 'Complete' : 'Required'}</span></div><div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm font-bold"><span>Pass quiz</span><span className={!requireQuiz || lessonProgress.quizPassed ? 'text-emerald-700' : 'text-slate-400'}>{!requireQuiz ? 'Not required' : lessonProgress.quizPassed ? 'Passed' : `${lesson.passingScorePercent}%+`}</span></div></div>
            {lessonComplete && (nextLesson ? <Link to={`/course/${courseId}/lesson/${nextLesson.id}`} className="hive-primary-button mt-5 w-full justify-center">Next lesson <ArrowRight size={16} /></Link> : <Link to={`/course/${courseId}`} className="hive-primary-button mt-5 w-full justify-center">Course complete <CheckCircle2 size={16} /></Link>)}
          </div>
        </aside>
      </div>
    </div>
  );
}
