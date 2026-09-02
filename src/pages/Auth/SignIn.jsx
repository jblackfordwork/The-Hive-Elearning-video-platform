import { Navigate } from 'react-router-dom';
import { Store, GraduationCap, ShieldCheck, LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { firebaseReady } from '../../lib/firebase';
import hiveLogoUrl from '../../../Hive Logo.svg';

export default function SignIn() {
  const { isAuthenticated, loading, signInWithGoogle, authError } = useAuth();
  if (!firebaseReady) return <Navigate to="/setup" replace />;
  if (!loading && isAuthenticated) return <Navigate to="/" replace />;

  return (
    <main className="min-h-screen bg-slate-950 text-white grid lg:grid-cols-2">
      <section className="relative overflow-hidden p-8 sm:p-12 lg:p-16 flex flex-col justify-between min-h-[48vh] lg:min-h-screen">
        <div className="absolute inset-0 hive-grid opacity-30" aria-hidden="true" />
        <div className="relative z-10">
          <img src={hiveLogoUrl} alt="The Hive" className="mb-6 h-24 w-24 rounded-2xl bg-white object-contain p-2 shadow-2xl shadow-black/25" />
          <div className="inline-flex items-center gap-3 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-200">
            <Store size={18} /> Genesee Career Institute
          </div>
          <h1 className="mt-10 max-w-2xl text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]">
            THE HIVE
            <span className="block text-amber-300">Training Center</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-300 leading-relaxed">
            Learn the equipment, demonstrate safe operation, pass your knowledge checks, and keep your school-store training in one place.
          </p>
        </div>
        <div className="relative z-10 grid sm:grid-cols-2 gap-4 mt-12 max-w-xl">
          <div className="hive-dark-card"><GraduationCap /><span>Equipment training that unlocks step by step</span></div>
          <div className="hive-dark-card"><ShieldCheck /><span>Progress and quiz results saved automatically</span></div>
        </div>
      </section>

      <section className="bg-slate-50 text-slate-900 p-8 sm:p-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="rounded-3xl bg-white border border-slate-200 shadow-2xl shadow-slate-900/10 p-8 sm:p-10">
            <p className="text-xs font-black tracking-[0.24em] text-amber-600 uppercase">The Hive School Store</p>
            <h2 className="mt-3 text-3xl font-black">Sign in to training</h2>
            <p className="mt-3 text-slate-600">Use your approved Google account. Your training record is created automatically the first time you sign in.</p>
            {authError && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{authError}</div>}
            <button type="button" onClick={signInWithGoogle} className="hive-primary-button mt-7 w-full justify-center">
              <LogIn size={20} /> Continue with Google
            </button>
            <p className="mt-6 text-xs text-slate-500 leading-relaxed">By signing in, you are accessing a Genesee Career Institute instructional system. Course activity and quiz attempts may be visible to authorized instructors and administrators.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
