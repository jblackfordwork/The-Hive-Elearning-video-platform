import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { getUserProfile } from '../../services/userService';
import { listAssignmentsForUser } from '../../services/assignmentService';
import {
  listProgressForUser,
  resetCourseProgress,
  resetStudentLessonProgress,
} from '../../services/progressService';
import { listAttemptsForUser } from '../../services/attemptService';
import { getCoursesByIds, listLessons } from '../../services/courseService';
import { formatDuration, hasWatchedVideoLength } from '../../domain/videoProgress';
import ProgressBar from '../../components/ui/ProgressBar';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatTimestamp } from '../../utils/format';

export default function StudentDetail() {
  const { uid } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState('');

  const load = useCallback(async () => {
    const [user, assignments, progress, attempts] = await Promise.all([
      getUserProfile(uid),
      listAssignmentsForUser(uid),
      listProgressForUser(uid),
      listAttemptsForUser(uid),
    ]);
    const courseIds = [...new Set([
      ...assignments.map((assignment) => assignment.courseId),
      ...attempts.map((attempt) => attempt.courseId),
    ])];
    const courses = await getCoursesByIds(courseIds);
    const lessonPairs = await Promise.all(
      courseIds.map(async (courseId) => [courseId, await listLessons(courseId)]),
    );
    setData({
      user,
      assignments,
      progress,
      attempts,
      courses,
      lessonsByCourseId: Object.fromEntries(lessonPairs),
    });
  }, [uid]);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  const runReset = async (id, resetAction) => {
    setActionId(id);
    setError('');
    try {
      await resetAction();
      await load();
    } catch (err) {
      setError(err.message || 'Unable to reset training progress.');
    } finally {
      setActionId('');
    }
  };

  const handleResetCourse = async (assignment, courseTitle) => {
    if (!window.confirm(`Reset all progress for ${courseTitle}? The course will remain assigned.`)) return;
    await runReset(`course:${assignment.courseId}`, () => resetCourseProgress(uid, assignment.courseId));
  };

  const handleResetLesson = async (row) => {
    if (!window.confirm(`Reset progress for ${row.lessonTitle}?`)) return;
    await runReset(`lesson:${row.courseId}:${row.lessonId}`, () => resetStudentLessonProgress({
      uid,
      courseId: row.courseId,
      lessonId: row.lessonId,
      lessonIds: data.lessonsByCourseId[row.courseId].map((lesson) => lesson.id),
    }));
  };

  const courseMap = useMemo(
    () => Object.fromEntries((data?.courses || []).map((course) => [course.id, course])),
    [data],
  );
  const progressMap = useMemo(
    () => Object.fromEntries((data?.progress || []).map((item) => [item.courseId, item])),
    [data],
  );

  if (error) return <div className="hive-page"><div className="rounded-xl bg-red-50 p-5 text-red-700">{error}</div></div>;
  if (!data) return <div className="hive-loading">Loading student record...</div>;

  const watchRows = data.assignments.flatMap((assignment) => {
    const course = courseMap[assignment.courseId];
    const progress = progressMap[assignment.courseId];
    const lessons = data.lessonsByCourseId[assignment.courseId] || [];
    return lessons.map((lesson) => {
      const lessonProgress = progress?.lessons?.[lesson.id] || {};
      const watchedSeconds = lessonProgress.watchedSeconds || 0;
      const durationSeconds = lessonProgress.videoDurationSeconds || 0;
      return {
        id: `${assignment.courseId}_${lesson.id}`,
        courseId: assignment.courseId,
        lessonId: lesson.id,
        courseTitle: course?.title || assignment.courseId,
        lessonTitle: lesson.title,
        watchedSeconds,
        durationSeconds,
        watchedEnough: hasWatchedVideoLength({ watchedSeconds, durationSeconds }),
      };
    });
  });

  return (
    <div className="hive-page max-w-6xl">
      <Link to="/admin/students" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500">
        <ArrowLeft size={16} /> Students
      </Link>
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-amber-100 text-2xl font-black">
          {data.user?.photoURL ? <img src={data.user.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : data.user?.displayName?.charAt(0) || '?'}
        </div>
        <div>
          <h1 className="text-3xl font-black">{data.user?.displayName || 'User'}</h1>
          <p className="text-slate-500">{data.user?.email}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">Class: {data.user?.className || 'Unassigned'}</p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-black">Assigned training</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {data.assignments.map((assignment) => {
            const progress = progressMap[assignment.courseId];
            const course = courseMap[assignment.courseId];
            return (
              <div key={assignment.id} className="hive-panel p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-amber-600">{course?.equipmentName || 'Equipment'}</p>
                    <h3 className="mt-1 font-black">{course?.title || assignment.courseId}</h3>
                  </div>
                  <StatusBadge status={progress?.percentComplete >= 100 ? 'completed' : assignment.status} />
                </div>
                <div className="mt-5"><ProgressBar value={progress?.percentComplete || 0} /></div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">{progress?.completedLessonIds?.length || 0} lessons completed</p>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={actionId === `course:${assignment.courseId}`}
                    onClick={() => handleResetCourse(assignment, course?.title || assignment.courseId)}
                  >
                    <RotateCcw size={14} /> Reset course
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {!data.assignments.length && <p className="mt-4 text-sm text-slate-500">No courses assigned.</p>}
      </section>

      <section className="hive-panel mt-8 overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-xl font-black">Lesson watch time</h2>
          <p className="mt-1 text-sm text-slate-500">Active playback time saved while each video is playing.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-5 py-3">Course</th><th className="px-5 py-3">Lesson</th><th className="px-5 py-3">Watched</th><th className="px-5 py-3">Video length</th><th className="px-5 py-3">Status</th><th className="px-5 py-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {watchRows.map((row) => (
                <tr key={row.id}>
                  <td className="px-5 py-4 font-bold">{row.courseTitle}</td>
                  <td className="px-5 py-4">{row.lessonTitle}</td>
                  <td className="px-5 py-4 font-black">{formatDuration(row.watchedSeconds)}</td>
                  <td className="px-5 py-4 text-slate-600">{row.durationSeconds ? formatDuration(row.durationSeconds) : 'Unknown'}</td>
                  <td className="px-5 py-4"><StatusBadge status={row.watchedEnough ? 'completed' : 'assigned'}>{row.watchedEnough ? 'Enough time' : 'Short'}</StatusBadge></td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={actionId === `lesson:${row.courseId}:${row.lessonId}`}
                      onClick={() => handleResetLesson(row)}
                    >
                      <RotateCcw size={14} /> Reset
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!watchRows.length && <p className="p-6 text-center text-sm text-slate-500">No lessons assigned yet.</p>}
      </section>

      <section className="hive-panel mt-8 overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-xl font-black">Quiz attempts</h2>
          <p className="mt-1 text-sm text-slate-500">Every submitted result is retained for review.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-5 py-3">Course</th><th className="px-5 py-3">Score</th><th className="px-5 py-3">Result</th><th className="px-5 py-3">Submitted</th><th className="px-5 py-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.attempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td className="px-5 py-4 font-bold">{courseMap[attempt.courseId]?.title || attempt.courseId}</td>
                  <td className="px-5 py-4 font-black">{attempt.scorePercent}%</td>
                  <td className="px-5 py-4"><StatusBadge status={attempt.passed ? 'passed' : 'failed'} /></td>
                  <td className="px-5 py-4 text-slate-500">{formatTimestamp(attempt.submittedAt)}</td>
                  <td className="px-5 py-4 text-right"><Link to={`/admin/attempts/${attempt.id}`} className="font-black text-amber-700">Details -&gt;</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data.attempts.length && <p className="p-6 text-center text-sm text-slate-500">No quiz attempts yet.</p>}
      </section>
    </div>
  );
}
