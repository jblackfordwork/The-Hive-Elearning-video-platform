import { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { buildQuiz, gradeQuiz } from '../../domain/quiz';

export default function LessonQuiz({ questions = [], count = 3, passingScore = 80, onSubmitted }) {
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const makeQuiz = () => {
    setQuiz(buildQuiz(questions, count));
    setAnswers({});
    setResult(null);
    setSubmitError('');
  };

  useEffect(() => { makeQuiz(); }, [questions, count]);

  const submit = async () => {
    const graded = gradeQuiz(quiz, answers, passingScore);
    setSubmitting(true);
    try {
      await onSubmitted?.(graded);
      setResult(graded);
    } catch (error) {
      setSubmitError(error.message || 'Your quiz result could not be saved. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!quiz.length) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-900">This lesson does not have enough active quiz questions yet. Ask an administrator to update the course.</div>;

  const allAnswered = quiz.every((question) => answers[question.id]);
  return (
    <section className="hive-panel p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
        <div><p className="text-xs font-black uppercase tracking-[.16em] text-amber-600">Knowledge Check</p><h2 className="mt-1 text-2xl font-black">Lesson Quiz</h2><p className="mt-1 text-sm text-slate-500">Passing score: {passingScore}% • {quiz.length} randomized question{quiz.length === 1 ? '' : 's'}</p></div>
        {!result && <button type="button" onClick={makeQuiz} className="hive-secondary-button text-xs"><RefreshCw size={15} /> New question set</button>}
      </div>
      <div className="mt-6 space-y-7">
        {quiz.map((question, qIndex) => (
          <fieldset key={question.id} className="rounded-2xl bg-slate-50 p-5">
            <legend className="w-full font-black text-slate-900">{qIndex + 1}. {question.prompt}</legend>
            <div className="mt-4 space-y-2">
              {question.options.map((option) => {
                const selected = answers[question.id] === option.id;
                const correct = result && option.id === question.correctOptionId;
                const incorrectSelected = result && selected && !correct;
                return (
                  <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-semibold transition ${correct ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : incorrectSelected ? 'border-red-300 bg-red-50 text-red-900' : selected ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <input type="radio" name={question.id} value={option.id} checked={selected} disabled={Boolean(result)} onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option.id }))} />
                    <span className="flex-1">{option.text}</span>
                    {correct && <CheckCircle2 size={18} className="text-emerald-600" />}{incorrectSelected && <XCircle size={18} className="text-red-600" />}
                  </label>
                );
              })}
            </div>
            {result && question.explanation && <p className="mt-3 rounded-lg bg-white p-3 text-xs text-slate-600"><strong>Why:</strong> {question.explanation}</p>}
          </fieldset>
        ))}
      </div>
      {submitError && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{submitError}</div>}
      {!result ? <button type="button" disabled={!allAnswered || submitting} onClick={submit} className="hive-primary-button mt-6 w-full justify-center">{submitting ? 'Saving results…' : 'Submit quiz'}</button> : (
        <div className={`mt-6 rounded-2xl border p-5 ${result.passed ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center gap-3">{result.passed ? <CheckCircle2 className="text-emerald-700" /> : <XCircle className="text-red-700" />}<div><p className="font-black">{result.passed ? 'Passed — lesson complete!' : 'Not quite — try another question set.'}</p><p className="text-sm">Score: {result.scorePercent}% ({result.correctCount}/{result.totalQuestions})</p></div></div>
          {!result.passed && <button type="button" onClick={makeQuiz} className="hive-secondary-button mt-4"><RefreshCw size={16} /> Retry with randomized questions</button>}
        </div>
      )}
    </section>
  );
}
