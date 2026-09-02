function shuffledCopy(items, randomFn) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomFn() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function buildQuiz(questionBank = [], count = 0, randomFn = Math.random) {
  const activeQuestions = questionBank.filter(
    (question) => question?.active !== false && question?.id && question?.prompt,
  );
  const requestedCount = Number.isFinite(Number(count)) ? Math.max(0, Number(count)) : 0;
  const selected = shuffledCopy(activeQuestions, randomFn).slice(
    0,
    Math.min(requestedCount || activeQuestions.length, activeQuestions.length),
  );

  return selected.map((question) => ({
    ...question,
    options: shuffledCopy(question.options || [], randomFn).map((option) => ({ ...option })),
  }));
}

export function gradeQuiz(quiz = [], answers = {}, passingScorePercent = 80) {
  const questions = quiz.map((question) => {
    const selectedOptionId = answers[question.id] ?? null;
    const correct = selectedOptionId === question.correctOptionId;
    return {
      id: question.id,
      questionId: question.id,
      prompt: question.prompt,
      options: (question.options || []).map((option) => ({ ...option })),
      correctOptionId: question.correctOptionId,
      selectedOptionId,
      explanation: question.explanation || '',
      correct,
    };
  });

  const correctCount = questions.filter((question) => question.correct).length;
  const totalQuestions = questions.length;
  const scorePercent = totalQuestions
    ? Math.round((correctCount / totalQuestions) * 100)
    : 0;

  return {
    correctCount,
    totalQuestions,
    scorePercent,
    passed: totalQuestions > 0 && scorePercent >= Number(passingScorePercent || 0),
    questions,
  };
}
