import type { Shift } from '../types';
import { getWeekStart, toDateStr } from './week';

/**
 * Calendar date utilities.
 * All dates are handled as local dates to avoid timezone issues.
 * Weeks start on Monday.
 */

/**
 * Get a flat array of Dates for a month's calendar grid (Mon–Sun columns).
 * Returns 42 cells (6 rows × 7 cols) starting from the Monday of the week
 * containing the 1st of the month.
 */
export function getMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const gridStart = getWeekStart(firstDay);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    cells.push(d);
  }
  return cells;
}

/**
 * Format a date as e.g. "October 2026".
 */
export function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
}

/**
 * Check if a date string (YYYY-MM-DD) is in the given month.
 */
export function isDateInMonth(dateStr: string, year: number, month: number): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  return d.getFullYear() === year && d.getMonth() === month;
}

/**
 * Filter shifts to only those within the given calendar month.
 */
export function filterShiftsByMonth(shifts: Shift[], year: number, month: number): Shift[] {
  return shifts.filter((s) => isDateInMonth(s.date, year, month));
}

/**
 * Group shifts by date string for quick lookup in calendar cells.
 */
export function groupShiftsByDate(shifts: Shift[]): Map<string, Shift[]> {
  const map = new Map<string, Shift[]>();
  for (const shift of shifts) {
    const existing = map.get(shift.date);
    if (existing) {
      existing.push(shift);
    } else {
      map.set(shift.date, [shift]);
    }
  }
  return map;
}

export { toDateStr };
