export function parseISO(s?: string | null) {
  return s ? new Date(s) : null;
}

export function toISO(d: Date | null) {
  return d ? d.toISOString() : null;
}
export function toShort(d?: Date | null) {
  return d ? d.toDateString() : "Select date";
}
export function diffDays(a: Date | null, b: Date | null) {
  if (!a || !b) return undefined;
  const ms = Math.abs(b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0));
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
