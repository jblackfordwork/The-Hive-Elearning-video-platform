import { userMatchesClass } from './classes.js';

export function getRecentAttempts(attempts, users, classFilter = 'all', userId = '') {
  const matchingIds = new Set(users.filter(user => userMatchesClass(user, classFilter)).map(user => user.uid || user.id));
  return attempts
    .filter(attempt => (classFilter === 'all' || matchingIds.has(attempt.uid)) && (!userId || attempt.uid === userId))
    .sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)
      || (b.submittedAt?.nanoseconds || 0) - (a.submittedAt?.nanoseconds || 0))
    .slice(0, 8);
}
