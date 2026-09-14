import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listUsers } from '../../services/adminService';
import ClassUserFilters from '../../components/admin/ClassUserFilters';

export default function StudentViewPicker() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [userId, setUserId] = useState('');
  useEffect(() => {
    let active = true;
    listUsers().then(users => { if (active) setUsers(users); }).catch(error => { if (active) setError(error.message); });
    return () => { active = false; };
  }, []);
  return <div className="hive-page max-w-4xl"><h1 className="text-4xl font-black">Student view</h1><p className="mt-3 text-slate-500">Choose a class and student to preview their assigned training, progress, and lesson availability.</p><section className="hive-panel mt-7 p-6">{error ? <p role="alert" className="text-red-700">{error}</p> : !users ? <p>Loading students…</p> : <><ClassUserFilters users={users} classFilter={classFilter} userId={userId} onClassChange={value => { setClassFilter(value); setUserId(''); }} onUserChange={setUserId} /><p className="mt-5 text-sm text-slate-500">This preview is read-only. Viewing videos and quizzes will not change the student’s record.</p>{userId ? <Link to={`/student-view/${encodeURIComponent(userId)}`} className="hive-primary-button mt-5">Open student view</Link> : <p className="mt-5 text-sm font-bold text-slate-600">Select a user to open their student view.</p>}</>}</section></div>;
}
