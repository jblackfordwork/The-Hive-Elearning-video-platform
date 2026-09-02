import { AlertTriangle, Database, ExternalLink } from 'lucide-react';
import { firebaseSetup } from '../../lib/firebase';

export default function FirebaseSetup() {
  return (
    <main className="min-h-screen bg-slate-100 p-6 sm:p-12 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl">
        <div className="h-14 w-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center"><Database /></div>
        <h1 className="mt-6 text-3xl font-black text-slate-950">Connect The Hive to Firebase</h1>
        <p className="mt-3 text-slate-600">The website is ready, but Google sign-in and saved training data require your Firebase project configuration.</p>
        {firebaseSetup.missingKeys.length > 0 && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-3 font-bold text-amber-900"><AlertTriangle size={20} /> Missing environment values</div>
            <ul className="mt-3 grid sm:grid-cols-2 gap-2 text-sm text-amber-900 font-mono">
              {firebaseSetup.missingKeys.map((key) => <li key={key}>{key}</li>)}
            </ul>
          </div>
        )}
        <div className="mt-7 rounded-2xl bg-slate-950 text-slate-100 p-6">
          <h2 className="font-bold">Setup instructions are included</h2>
          <p className="mt-2 text-sm text-slate-300">Open <code className="text-amber-300">docs/FIREBASE_SETUP.md</code> in the repository for the exact Firebase, Google Auth, Firestore rules, GitHub Pages, and first-admin steps.</p>
        </div>
        <a className="mt-6 inline-flex items-center gap-2 font-bold text-amber-700" href="https://console.firebase.google.com/" target="_blank" rel="noreferrer">Firebase Console <ExternalLink size={16} /></a>
      </div>
    </main>
  );
}
