import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQuiz, gradeQuiz } from './quiz.js';

const bank = [
  {
    id: 'q1',
    prompt: 'Question one?',
    active: true,
    options: [{ id: 'a', text: 'A1' }, { id: 'b', text: 'B1' }],
    correctOptionId: 'a',
    explanation: 'One',
  },
  {
    id: 'q2',
    prompt: 'Question two?',
    active: true,
    options: [{ id: 'a', text: 'A2' }, { id: 'b', text: 'B2' }],
    correctOptionId: 'b',
    explanation: 'Two',
  },
  {
    id: 'q3',
    prompt: 'Question three?',
    active: true,
    options: [{ id: 'a', text: 'A3' }, { id: 'b', text: 'B3' }],
    correctOptionId: 'a',
    explanation: 'Three',
  },
  {
    id: 'inactive',
    prompt: 'Inactive',
    active: false,
    options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }],
    correctOptionId: 'a',
  },
];

test('buildQuiz chooses only the configured number of active questions and shuffles options', () => {
  const quiz = buildQuiz(bank, 2, () => 0);
  assert.deepEqual(quiz.map((question) => question.id), ['q2', 'q3']);
  assert.deepEqual(quiz[0].options.map((option) => option.id), ['b', 'a']);
  assert.notEqual(quiz[0].options, bank[1].options);
});

test('gradeQuiz records exact answers and passing result', () => {
  const quiz = [bank[0], bank[1]];
  const result = gradeQuiz(quiz, { q1: 'a', q2: 'a' }, 50);
  assert.equal(result.correctCount, 1);
  assert.equal(result.totalQuestions, 2);
  assert.equal(result.scorePercent, 50);
  assert.equal(result.passed, true);
  assert.deepEqual(result.questions.map((q) => [q.id, q.selectedOptionId, q.correct]), [
    ['q1', 'a', true],
    ['q2', 'a', false],
  ]);
});
