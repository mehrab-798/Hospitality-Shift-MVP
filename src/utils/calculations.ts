import type { Shift } from '../types';

/**
 * Calculate paid working hours between a start time and end time,
 * subtracting the unpaid break duration.
 * Times are in "HH:mm" format.
 * Supports overnight shifts (e.g. 10:00 PM to 6:00 AM).
 * Identical start and end times return 0 (rejected by validation).
 */
export function calculateShiftHours(startTime: string, endTime: string, breakMinutes: number = 0): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  let totalMinutes = endMinutes - startMinutes;
  if (totalMinutes < 0) {
    // Overnight shift: end time is on the next day
    totalMinutes += 24 * 60;
  }

  const paidMinutes = totalMinutes - breakMinutes;
  return paidMinutes / 60;
}

/**
 * Calculate total paid hours across all shifts.
 */
export function calculateTotalHours(shifts: Shift[]): number {
  return shifts.reduce((total, shift) => {
    return total + calculateShiftHours(shift.startTime, shift.endTime, shift.breakMinutes ?? 0);
  }, 0);
}

/**
 * Calculate earnings for a single shift (paid hours × hourly rate).
 */
export function calculateShiftEarnings(shift: Shift): number {
  const paidHours = calculateShiftHours(shift.startTime, shift.endTime, shift.breakMinutes ?? 0);
  return paidHours * shift.hourlyRate;
}

/**
 * Calculate total earnings across all shifts.
 */
export function calculateTotalEarnings(shifts: Shift[]): number {
  return shifts.reduce((total, shift) => {
    return total + calculateShiftEarnings(shift);
  }, 0);
}

/**
 * Calculate total unpaid break hours across all shifts.
 */
export function calculateTotalBreakHours(shifts: Shift[]): number {
  return shifts.reduce((total, shift) => {
    return total + (shift.breakMinutes ?? 0) / 60;
  }, 0);
}

/**
 * Format a number as AUD currency (e.g. $25.50).
 */
export function formatAUD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Format a date string (YYYY-MM-DD) into a readable format (e.g. "Mon 23 Sep 2026").
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a time string (HH:mm) into 12-hour format (e.g. "9:00 AM").
 */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}