function orderedLessons(lessons = []) {
  return [...lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function canCompleteLesson({ videoCompleted, quizPassed, requireQuiz = true }) {
  return Boolean(videoCompleted && (requireQuiz === false || quizPassed));
}

export function calculateCourseProgress(lessonIds = [], completedLessonIds = []) {
  if (!lessonIds.length) return 0;
  const lessonSet = new Set(lessonIds);
  const completedCount = new Set(completedLessonIds)
    .intersection
    ? new Set(completedLessonIds).intersection(lessonSet).size
    : [...new Set(completedLessonIds)].filter((id) => lessonSet.has(id)).length;
  return Math.round((completedCount / lessonIds.length) * 100);
}

export function getNextLesson(lessons = [], completedLessonIds = []) {
  const completed = new Set(completedLessonIds);
  return orderedLessons(lessons).find((lesson) => !completed.has(lesson.id)) || null;
}

export function isLessonUnlocked(lessons = [], lessonId, completedLessonIds = []) {
  const ordered = orderedLessons(lessons);
  const targetIndex = ordered.findIndex((lesson) => lesson.id === lessonId);
  if (targetIndex < 0) return false;
  if (targetIndex === 0) return true;
  const completed = new Set(completedLessonIds);
  return ordered.slice(0, targetIndex).every((lesson) => completed.has(lesson.id));
}
