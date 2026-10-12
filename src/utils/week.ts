/**
 * Week calculation utilities.
 * All dates are handled as local dates (YYYY-MM-DD strings) to avoid timezone issues.
 * A week runs from Monday to Sunday.
 * Overnight shifts are assigned to the week containing their start date.
 */

/**
 * Get the Monday of the week containing the given date.
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * Get the Sunday of the week containing the given date.
 */
export function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d;
}

/**
 * Convert a Date to YYYY-MM-DD string using local date components.
 */
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Format a week range as e.g. "28 Sep – 4 Oct 2026".
 */
export function formatWeekRange(weekStart: Date): string {
  const end = getWeekEnd(weekStart);
  const startStr = weekStart.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  const endStr = end.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${startStr} – ${endStr}`;
}

/**
 * Check if a shift date (YYYY-MM-DD) falls within the week starting on weekStart (Monday).
 */
export function isDateInWeek(dateStr: string, weekStart: Date): boolean {
  const weekEnd = getWeekEnd(weekStart);
  const startStr = toDateStr(weekStart);
  const endStr = toDateStr(weekEnd);
  return dateStr >= startStr && dateStr <= endStr;
}

/**
 * Filter shifts to only those within the given week (Mon–Sun).
 * Overnight shifts are assigned to the week containing their start date.
 */
export function filterShiftsByWeek<T extends { date: string }>(shifts: T[], weekStart: Date): T[] {
  return shifts.filter((shift) => isDateInWeek(shift.date, weekStart));
}
