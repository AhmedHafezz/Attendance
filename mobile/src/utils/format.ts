export function formatTime(iso?: string | null): string {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDateLabel(iso?: string | null): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatDuration(duration?: string | null): string {
  if (!duration) return '--';
  const [h, m] = duration.split(':');
  return `${parseInt(h, 10)}h ${parseInt(m, 10)}m`;
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
