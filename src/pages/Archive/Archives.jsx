import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useStudentView } from '../../hooks/useStudentView';
import { archiveClass, getClassArchive, listClassArchives, reactivateStudent } from '../../services/archiveService';
import { parseVideoUrl, getYouTubeEmbedUrl } from '../../domain/video';
import { formatTimestamp } from '../../utils/format';
import { formatDuration } from '../../domain/videoProgress';

export default function Archives({ admin = false }) {
  const [params, setParams] = useSearchParams();
  const id = params.get('archive');
  const { user } = useStudentView();
  return <ArchivePage key={`${admin}-${user?.uid}-${id}`} admin={admin} uid={user?.uid} id={id} onSelect={value => setParams(value ? { archive: value } : {})} />;
}

function ArchivePage({ admin, uid, id, onSelect }) {
  const { user } = useAuth();
  const [archives, setArchives] = useState(null);
  const [data, setData] = useState(null);
  const [studentId, setStudentId] = useState(admin ? '' : uid);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [reactivated, setReactivated] = useState([]);
  useEffect(() => {
    let active = true;
    const request = id ? getClassArchive(id, admin ? null : uid) : listClassArchives(admin ? null : uid);
    request.then(result => { if (active) { if (id) setData(result); else setArchives(result.filter(item => admin || item.status === 'complete')); } }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [admin, uid, id]);

  const restore = async student => {
    if (!window.confirm(`Reactivate ${student.displayName || student.email}? Their archived results will stay here. Assign them to a new class in Admin Access.`)) return;
    setBusy(true); setError('');
    try { await reactivateStudent(student.uid || student.id, id); setReactivated(current => [...current, student.uid || student.id]); setMessage('Student reactivated. You can now place them in a new class in Admin Access.'); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const resume = async archive => {
    setBusy(true); setError('');
    try { await archiveClass({ archiveId: archive.id, className: archive.className, label: archive.label, archivedBy: user.uid }); onSelect(archive.id); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const students = data?.users.filter(item => !studentId || (item.uid || item.id) === studentId) || [];
  return <div className="hive-page">
    <p className="text-xs font-black uppercase tracking-[.18em] text-amber-600">Previous training</p>
    {id && <button className="mt-3 font-bold text-amber-700" onClick={() => onSelect(null)}>← All archives</button>}
    <h1 className="mt-2 text-4xl font-black">{data ? `${data.archive.className || 'Unassigned'} · ${data.archive.label}` : admin ? 'Archived classes' : 'Archive'}</h1>
    <p className="mt-2 text-slate-500">Review previous courses and results. Viewing archived training does not change progress.</p>
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    {message && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-800">{message}</p>}
    {!data && !archives && !error && <p className="mt-6">Loading archives…</p>}
    {archives && !archives.length && <p className="hive-panel mt-6 p-6">No archived classes yet.</p>}
    {archives && <div className="mt-6 grid gap-4 md:grid-cols-2">{archives.map(archive => <section key={archive.id} className="hive-panel p-6"><h2 className="text-xl font-black">{archive.className || 'Unassigned'}</h2><p className="mt-1 text-slate-500">{archive.label} · {formatTimestamp(archive.archivedAt)}</p>{archive.status === 'complete' ? <button className="hive-primary-button mt-4" onClick={() => onSelect(archive.id)}>View archive</button> : <><p className="mt-3 text-sm">Archiving is incomplete. Finish it to make the saved records available.</p><button disabled={busy} className="hive-primary-button mt-4" onClick={() => resume(archive)}>{busy ? 'Finishing…' : 'Finish archiving'}</button></>}</section>)}</div>}
    {data && data.archive.status !== 'complete' && <p className="mt-6">This archive is still being prepared. Return to all archives to finish archiving.</p>}
    {data && data.archive.status === 'complete' && <>
      {admin && <label className="mt-6 block max-w-md"><span className="hive-label">Student</span><select className="hive-input" value={studentId} onChange={event => setStudentId(event.target.value)}><option value="">All students</option>{data.users.map(student => <option key={student.uid || student.id} value={student.uid || student.id}>{student.displayName || student.email}</option>)}</select></label>}
      {students.map(student => { const studentUid = student.uid || student.id; return <section key={studentUid} className="hive-panel mt-6 p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-black">{student.displayName || student.email}</h2><p className="text-sm text-slate-500">{student.email}</p></div>{admin && <button disabled={busy || reactivated.includes(studentUid)} className="hive-secondary-button" onClick={() => restore(student)}>{reactivated.includes(studentUid) ? 'Reactivated' : 'Reactivate student'}</button>}</div><StudentRecords data={data} uid={studentUid} /></section>; })}
      {!students.length && <p className="mt-6">No student records in this archive.</p>}
    </>}
  </div>;
}

function StudentRecords({ data, uid }) {
  const assignments = data.assignments.filter(item => item.uid === uid);
  const progress = data.progress.filter(item => item.uid === uid);
  const attempts = data.attempts.filter(item => item.uid === uid);
  const ids = [...new Set([...assignments, ...progress, ...attempts].map(item => item.courseId))];
  return <div className="mt-5 space-y-4">{!ids.length && <p className="text-slate-500">No training records were saved for this student.</p>}{ids.map(courseId => {
    const course = data.courses.find(item => item.id === courseId);
    const record = progress.find(item => item.courseId === courseId);
    const assignment = assignments.find(item => item.courseId === courseId);
    const percent = assignment?.status === 'completed' ? 100 : Math.min(100, Math.max(0, Number(record?.percentComplete || 0)));
    const lessons = data.lessons.filter(item => item.courseId === courseId).sort((a, b) => (a.order || 0) - (b.order || 0));
    return <details key={courseId} className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-black">{course?.title || 'Previous course'} <span className="ml-2 text-sm font-bold text-slate-500">{Math.round(percent)}% complete</span></summary><p className="mt-3 text-sm text-slate-500">{course?.description}</p>{lessons.map(lesson => { const lessonId = lesson.lessonId || lesson.id; const saved = record?.lessons?.[lessonId]; return <details key={lesson.id} className="mt-4 rounded-xl bg-slate-50 p-4"><summary className="cursor-pointer font-bold">{lesson.title || 'Lesson'}</summary><p className="my-3 text-sm text-slate-500">Saved watch time: {formatDuration(saved?.watchedSeconds || 0)}{saved?.videoDurationSeconds ? ` / ${formatDuration(saved.videoDurationSeconds)}` : ''}</p><ArchiveVideo lesson={lesson} /></details>; })}<h3 className="mt-5 font-black">Quiz attempts</h3>{attempts.filter(item => item.courseId === courseId).map(attempt => <details key={attempt.id} className="mt-3 rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-bold">{lessons.find(lesson => (lesson.lessonId || lesson.id) === attempt.lessonId)?.title || 'Quiz'} · {attempt.scorePercent}% · {attempt.passed ? 'Passed' : 'Not passed'} · {formatTimestamp(attempt.submittedAt)}</summary>{(attempt.questions || []).map((question, index) => <div key={index} className="mt-4"><p className="font-bold">{index + 1}. {question.prompt}</p>{(question.options || []).map(option => <p key={option.id} className={`mt-1 text-sm ${option.id === question.correctOptionId ? 'font-bold text-emerald-700' : 'text-slate-600'}`}>{option.text}{option.id === question.selectedOptionId ? ' — Selected' : ''}{option.id === question.correctOptionId ? ' — Correct answer' : ''}</p>)}{question.explanation && <p className="mt-2 text-sm">{question.explanation}</p>}</div>)}</details>)}{!attempts.some(item => item.courseId === courseId) && <p className="mt-2 text-sm text-slate-500">No quiz attempts recorded.</p>}</details>;
  })}</div>;
}

function ArchiveVideo({ lesson }) {
  const video = parseVideoUrl(lesson.videoUrl);
  if (!video) return <p className="text-sm text-slate-500">No playable video was saved for this lesson.</p>;
  return video.type === 'youtube' ? <iframe title={lesson.title || 'Archived lesson video'} loading="lazy" className="aspect-video w-full rounded-xl" src={getYouTubeEmbedUrl(video.id)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <video aria-label={lesson.title || 'Archived lesson video'} controls preload="none" className="aspect-video w-full rounded-xl" src={video.url} />;
}
