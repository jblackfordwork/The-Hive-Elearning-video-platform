import { listAssignmentsForUser } from '../../services/assignmentService';
import { getCourse } from '../../services/courseService';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getUserProfile } from '../../services/userService';
import { StudentViewContext } from '../../context/StudentViewContext';
import AppShell from '../layout/AppShell';

export default function StudentPreview() {
  const { uid, courseId } = useParams();
  const [result, setResult] = useState(null);
  useEffect(() => {
    let active = true;
    async function load() {
      const profile = await getUserProfile(uid);
      if (courseId) {
        const assignments = await listAssignmentsForUser(uid);
        if (!assignments.some(assignment => assignment.courseId === courseId)) throw new Error('This course is not available to this student.');
        const course = await getCourse(courseId);
        if (course?.status !== 'published') throw new Error('This course is not available to this student.');
      }
      return profile;
    }
    load().then(profile => {
      if (active) setResult({ uid, courseId, profile });
    }).catch(error => {
      if (active) setResult({ uid, courseId, error: error.message });
    });
    return () => { active = false; };
  }, [uid, courseId]);
  if (result?.uid !== uid || result?.courseId !== courseId) return <div className="hive-loading">Loading student view…</div>;
  if (result.error || !result.profile) return <div className="hive-page"><p role="alert">{result.error || 'Student not found.'}</p><Link to="/admin/student-view" className="hive-secondary-button mt-4">Choose another student</Link></div>;
  return <StudentViewContext.Provider value={{ user: { uid }, profile: result.profile, readOnly: true, basePath: `/student-view/${encodeURIComponent(uid)}` }}><AppShell key={uid} /></StudentViewContext.Provider>;
}
