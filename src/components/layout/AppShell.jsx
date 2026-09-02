import { NavLink, Outlet } from 'react-router-dom';
import { BookOpenCheck, ClipboardList, GraduationCap, LayoutDashboard, LogOut, ShieldCheck, Store, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import hiveLogoUrl from '../../../Hive Logo.svg';

const studentNav = [
  { to: '/', label: 'My Training', icon: GraduationCap },
];
const adminNav = [
  { to: '/admin', label: 'Admin Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/courses', label: 'Courses', icon: BookOpenCheck },
  { to: '/admin/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/admin/users', label: 'Admin Access', icon: ShieldCheck },
];

function NavItem({ item }) {
  const Icon = item.icon;
  return (
    <NavLink end={item.end} to={item.to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${isActive ? 'bg-amber-300 text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
      <Icon size={18} /> {item.label}
    </NavLink>
  );
}

export default function AppShell() {
  const { profile, user, isAdmin, signOutUser } = useAuth();
  const navItems = isAdmin ? [...studentNav, ...adminNav] : studentNav;
  const name = profile?.displayName || user?.displayName || 'Hive Learner';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="hidden min-h-screen bg-slate-950 p-5 text-white lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen">
        <NavLink to="/" className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <img src={hiveLogoUrl} alt="" className="h-11 w-11 rounded-xl bg-white object-contain p-1" />
          <div><p className="text-[10px] font-black tracking-[0.2em] text-slate-400">GENESEE CAREER INSTITUTE</p><p className="text-lg font-black">THE HIVE</p></div>
        </NavLink>
        <nav className="mt-7 space-y-1.5">{navItems.map((item) => <NavItem key={item.to} item={item} />)}</nav>
        <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            {profile?.photoURL ? <img src={profile.photoURL} alt="" className="h-10 w-10 rounded-full object-cover" referrerPolicy="no-referrer" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-300 font-black text-slate-950">{name.charAt(0)}</div>}
            <div className="min-w-0"><p className="truncate text-sm font-bold">{name}</p><p className="truncate text-xs text-slate-400">{profile?.role === 'admin' ? 'Administrator' : 'Student'}</p></div>
          </div>
          <button onClick={signOutUser} type="button" className="mt-4 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-300 hover:bg-slate-800"><LogOut size={16} /> Sign out</button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <NavLink to="/" className="flex items-center gap-2 font-black"><img src={hiveLogoUrl} alt="" className="h-8 w-8 rounded-lg object-contain" /> THE HIVE</NavLink>
            <button type="button" onClick={signOutUser} className="rounded-lg p-2 text-slate-600"><LogOut size={19} /></button>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">{navItems.map((item) => {
            const Icon = item.icon;
            return <NavLink key={item.to} end={item.end} to={item.to} className={({ isActive }) => `flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${isActive ? 'bg-amber-300 text-slate-950' : 'bg-slate-100 text-slate-600'}`}><Icon size={14} />{item.label}</NavLink>;
          })}</nav>
        </header>
        <main className="min-h-screen"><Outlet /></main>
        <footer className="border-t border-slate-200 bg-white px-6 py-5 text-center text-xs text-slate-500">
          <span className="inline-flex items-center gap-2"><Store size={14} /> Genesee Career Institute • The Hive School Store Training Center</span>
        </footer>
      </div>
    </div>
  );
}
