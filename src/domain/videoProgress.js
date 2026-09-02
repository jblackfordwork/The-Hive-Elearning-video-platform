export function addPlaybackSeconds({ watchedSeconds = 0, elapsedSeconds = 0, durationSeconds = 0 }) {
  const next = Math.max(0, Math.round(Number(watchedSeconds || 0) + Number(elapsedSeconds || 0)));
  const duration = Math.round(Number(durationSeconds || 0));
  return duration > 0 ? Math.min(next, duration) : next;
}

export function hasWatchedVideoLength({ watchedSeconds = 0, durationSeconds = 0 }) {
  const duration = Math.round(Number(durationSeconds || 0));
  return duration > 0 && Math.round(Number(watchedSeconds || 0)) >= duration;
}

export function formatDuration(seconds = 0) {
  const total = Math.max(0, Math.round(Number(seconds || 0)));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  if (minutes < 60) return `${minutes}:${String(remainder).padStart(2, '0')}`;
  const hours = Math.floor(minutes / 60);
  return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}
