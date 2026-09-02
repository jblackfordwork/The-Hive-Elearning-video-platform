const styles = {
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  published: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  assigned: 'bg-amber-100 text-amber-900 border-amber-200',
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  archived: 'bg-slate-200 text-slate-600 border-slate-300',
  passed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  admin: 'bg-violet-100 text-violet-800 border-violet-200',
  student: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function StatusBadge({ status, children }) {
  const key = String(status || '').toLowerCase();
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-black uppercase tracking-wide ${styles[key] || styles.draft}`}>{children || key.replaceAll('_', ' ')}</span>;
}
