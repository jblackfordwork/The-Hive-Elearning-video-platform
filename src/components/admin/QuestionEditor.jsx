import { useEffect, useState } from 'react';
import { Save, Trash2 } from 'lucide-react';

const defaultOptions = [
  { id: 'a', text: '' },
  { id: 'b', text: '' },
  { id: 'c', text: '' },
  { id: 'd', text: '' },
];

export default function QuestionEditor({ question, onSave, onDelete }) {
  const [form, setForm] = useState({ prompt: '', options: defaultOptions, correctOptionId: 'a', explanation: '', active: true });
  const [busy, setBusy] = useState(false);
  useEffect(() => { setForm({ prompt: question?.prompt || '', options: question?.options?.length ? question.options : defaultOptions, correctOptionId: question?.correctOptionId || 'a', explanation: question?.explanation || '', active: question?.active !== false }); }, [question]);
  const setOption = (id, text) => setForm((current) => ({ ...current, options: current.options.map((option) => option.id === id ? { ...option, text } : option) }));
  const save = async () => { setBusy(true); try { await onSave({ ...question, ...form }); } finally { setBusy(false); } };
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div><label className="hive-label">Question</label><textarea className="hive-input min-h-20" value={form.prompt} onChange={(event) => setForm((current) => ({ ...current, prompt: event.target.value }))} placeholder="What should the student know after this video?" /></div><div className="mt-4 grid gap-2">{form.options.map((option) => <div key={option.id} className="grid grid-cols-[34px_1fr] items-center gap-2"><label className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border text-xs font-black ${form.correctOptionId === option.id ? 'border-emerald-500 bg-emerald-100 text-emerald-800' : 'border-slate-300 bg-white text-slate-500'}`} title="Mark as correct"><input className="sr-only" type="radio" name={`correct-${question?.id || question?._tempId}`} checked={form.correctOptionId === option.id} onChange={() => setForm((current) => ({ ...current, correctOptionId: option.id }))} />{option.id.toUpperCase()}</label><input className="hive-input" value={option.text} onChange={(event) => setOption(option.id, event.target.value)} placeholder={`Answer ${option.id.toUpperCase()}`} /></div>)}</div><div className="mt-4"><label className="hive-label">Explanation shown after submission</label><input className="hive-input" value={form.explanation} onChange={(event) => setForm((current) => ({ ...current, explanation: event.target.value }))} placeholder="Optional explanation" /></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-2 text-sm font-bold text-slate-600"><input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} /> Active question</label><div className="flex gap-2">{question?.id && <button type="button" onClick={() => onDelete(question)} className="hive-danger-button text-xs"><Trash2 size={14} /> Delete</button>}<button type="button" onClick={save} disabled={busy || !form.prompt.trim()} className="hive-primary-button text-xs"><Save size={14} /> {busy ? 'Saving…' : 'Save question'}</button></div></div></div>;
}
