export default function ProgressBar({ value = 0, label = true }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="w-full">
      {label && <div className="mb-1 flex justify-between text-xs font-bold text-slate-500"><span>Progress</span><span>{safeValue}%</span></div>}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={safeValue} aria-valuemin="0" aria-valuemax="100">
        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
