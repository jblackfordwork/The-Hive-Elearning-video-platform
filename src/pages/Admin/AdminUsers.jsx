import { useEffect, useState } from 'react';
import { Save, ShieldCheck, ShieldOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { listUsers, setUserClass, setUserRole } from '../../services/adminService';
import { getClassOptions } from '../../domain/classes';
import StatusBadge from '../../components/ui/StatusBadge';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const load = () => listUsers().then(setUsers).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);
  const changeRole = async (target, role) => { if ((target.uid || target.id) === currentUser.uid && role !== 'admin') { setError('You cannot remove your own administrator access.'); return; } setBusy(target.id); setError(''); try { await setUserRole(target.uid || target.id, role); await load(); } catch (err) { setError(err.message); } finally { setBusy(''); } };
  const saveClass = async (target, className) => { setBusy(`${target.id}-class`); setError(''); try { await setUserClass(target.uid || target.id, className); await load(); } catch (err) { setError(err.message); } finally { setBusy(''); } };
  const classOptions = getClassOptions(users).filter(Boolean);
  return <div className="hive-page max-w-5xl"><div><p className="text-xs font-black uppercase tracking-[.18em] text-amber-600">Access control</p><h1 className="mt-2 text-4xl font-black">Administrators</h1><p className="mt-2 text-slate-500">Promote users and organize students into class groups.</p></div>{error && <div className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}<datalist id="class-options">{classOptions.map((className) => <option key={className} value={className} />)}</datalist><div className="mt-6 space-y-3">{users.map((target) => { const isAdmin = target.role === 'admin'; const self = (target.uid || target.id) === currentUser.uid; return <UserAccessRow key={target.id} target={target} self={self} busy={busy} isAdmin={isAdmin} onChangeRole={changeRole} onSaveClass={saveClass} />; })}</div></div>;
}

function UserAccessRow({ target, self, busy, isAdmin, onChangeRole, onSaveClass }) {
  const [className, setClassName] = useState(target.className || '');
  useEffect(() => { setClassName(target.className || ''); }, [target.className]);
  return <div className="hive-panel flex flex-col gap-4 p-5 lg:grid lg:grid-cols-[1fr_260px_auto] lg:items-center"><div className="flex items-center gap-3">{target.photoURL ? <img src={target.photoURL} alt="" className="h-11 w-11 rounded-full" referrerPolicy="no-referrer" /> : <div className="h-11 w-11 rounded-full bg-slate-100" />}<div><div className="flex items-center gap-2"><p className="font-black">{target.displayName || target.email}</p>{self && <span className="text-xs font-bold text-slate-400">You</span>}</div><p className="text-xs text-slate-500">{target.email}</p></div></div><div><label className="hive-label">Class</label><div className="flex gap-2"><input className="hive-input" list="class-options" value={className} onChange={(event) => setClassName(event.target.value)} placeholder="Unassigned" /><button type="button" disabled={busy === `${target.id}-class` || className.trim() === String(target.className || '').trim()} onClick={() => onSaveClass(target, className)} className="hive-secondary-button px-3" title="Save class"><Save size={16} /></button></div></div><div className="flex items-center gap-3 lg:justify-end"><StatusBadge status={target.role || 'student'} />{isAdmin ? <button type="button" disabled={self || busy === target.id} onClick={() => onChangeRole(target, 'student')} className="hive-secondary-button text-xs"><ShieldOff size={15} /> Remove admin</button> : <button type="button" disabled={busy === target.id} onClick={() => onChangeRole(target, 'admin')} className="hive-primary-button text-xs"><ShieldCheck size={15} /> Make admin</button>}</div></div>;
}
