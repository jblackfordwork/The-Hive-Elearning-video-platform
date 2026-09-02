import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserRound } from 'lucide-react';
import { listUsers } from '../../services/adminService';
import { listAllProgress } from '../../services/progressService';
import { getClassOptions, userMatchesClass } from '../../domain/classes';
import ProgressBar from '../../components/ui/ProgressBar';
import StatusBadge from '../../components/ui/StatusBadge';

export default function Students() {
  const [users, setUsers] = useState([]);
  const [progress, setProgress] = useState([]);
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => { Promise.all([listUsers(), listAllProgress()]).then(([u, p]) => { setUsers(u); setProgress(p); }).catch((err) => setError(err.message)); }, []);
  const rows = useMemo(() => users.map((user) => {
    const userProgress = progress.filter((item) => item.uid === (user.uid || user.id));
    const average = userProgress.length ? Math.round(userProgress.reduce((sum, item) => sum + Number(item.percentComplete || 0), 0) / userProgress.length) : 0;
    const completed = userProgress.filter((item) => item.percentComplete >= 100).length;
    return { user, average, completed, courseCount: userProgress.length };
  }).filter(({ user }) => userMatchesClass(user, classFilter) && `${user.displayName || ''} ${user.email || ''} ${user.className || ''}`.toLowerCase().includes(query.toLowerCase())), [users, progress, query, classFilter]);
  const classOptions = getClassOptions(users);

  return <div className="hive-page"><div><p className="text-xs font-black uppercase tracking-[.18em] text-amber-600">Reporting</p><h1 className="mt-2 text-4xl font-black">Students</h1><p className="mt-2 text-slate-500">Open a student record to see assigned courses and every quiz attempt.</p></div><div className="mt-6 grid gap-3 lg:grid-cols-[1fr_240px]"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input className="hive-input pl-10" placeholder="Search students by name, email, or class" value={query} onChange={(event) => setQuery(event.target.value)} /></div><select className="hive-input" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}><option value="all">All classes</option>{classOptions.map((className) => <option key={className || 'unassigned'} value={className}>{className || 'Unassigned'}</option>)}</select></div>{error && <div className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}<div className="hive-panel mt-6 overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Class</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Training</th><th className="px-5 py-3 min-w-52">Average progress</th><th className="px-5 py-3"></th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map(({ user, average, completed, courseCount }) => <tr key={user.id}><td className="px-5 py-4"><div className="flex items-center gap-3">{user.photoURL ? <img src={user.photoURL} alt="" className="h-9 w-9 rounded-full" referrerPolicy="no-referrer" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100"><UserRound size={17} /></div>}<div><p className="font-black">{user.displayName || 'Unnamed user'}</p><p className="text-xs text-slate-500">{user.email}</p></div></div></td><td className="px-5 py-4 text-slate-600">{user.className || 'Unassigned'}</td><td className="px-5 py-4"><StatusBadge status={user.role || 'student'} /></td><td className="px-5 py-4 text-slate-600">{completed}/{courseCount} completed</td><td className="px-5 py-4"><ProgressBar value={average} /></td><td className="px-5 py-4 text-right"><Link to={`/admin/students/${user.uid || user.id}`} className="font-black text-amber-700 hover:text-amber-900">View record →</Link></td></tr>)}</tbody></table></div>{!rows.length && <p className="p-8 text-center text-slate-500">No matching users.</p>}</div></div>;
}
