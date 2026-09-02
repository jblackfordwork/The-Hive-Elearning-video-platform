import { parseVideoUrl } from './video.js';

export function validateCourseForPublish(course = {}, lessons = []) {
  const errors = [];
  if (!String(course.title || '').trim()) errors.push('Course title is required.');
  if (!String(course.equipmentName || '').trim()) errors.push('Equipment name is required.');
  if (!lessons.length) errors.push('Add at least one lesson before publishing.');

  lessons.forEach((lesson, index) => {
    const label = `Lesson ${index + 1}${lesson.title ? ` (${lesson.title})` : ''}`;
    if (!String(lesson.title || '').trim()) errors.push(`${label} needs a title.`);
    if (!parseVideoUrl(lesson.videoUrl)) errors.push(`${label} needs a supported video URL (YouTube, MP4, or WebM).`);
    if (lesson.requireQuiz === false) return;
    const required = Math.max(1, Number(lesson.quizQuestionCount || 1));
    const activeQuestions = (lesson.questions || []).filter((question) => question.active !== false);
    if (activeQuestions.length < required) {
      errors.push(`${label} needs at least ${required} active quiz questions.`);
    }
    activeQuestions.forEach((question, questionIndex) => {
      if (!String(question.prompt || '').trim()) errors.push(`${label}, question ${questionIndex + 1} needs a prompt.`);
      if ((question.options || []).filter((option) => String(option.text || '').trim()).length < 2) {
        errors.push(`${label}, question ${questionIndex + 1} needs at least two answer options.`);
      }
      if (!(question.options || []).some((option) => option.id === question.correctOptionId)) {
        errors.push(`${label}, question ${questionIndex + 1} needs a valid correct answer.`);
      }
    });
  });

  return { valid: errors.length === 0, errors };
}
