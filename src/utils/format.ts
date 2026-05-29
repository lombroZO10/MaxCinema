export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours ? `${hours}h ${mins}m` : `${mins}m`;
}

export function formatProgress(progressSeconds: number, durationSeconds: number) {
  if (!durationSeconds) return 0;
  return Math.min(100, Math.round((progressSeconds / durationSeconds) * 100));
}
