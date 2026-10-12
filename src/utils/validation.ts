import type { ShiftFormData } from '../types';
import { calculateShiftHours } from './calculations';

const VALID_BREAK_VALUES = ['0', '15', '30', '45', '60'];

/**
 * Validate a shift form. Returns an errors object (empty = valid).
 * Shared between Add Shift and Edit Shift forms.
 */
export function validateShiftForm(form: ShiftFormData): Partial<Record<keyof ShiftFormData, string>> {
  const errors: Partial<Record<keyof ShiftFormData, string>> = {};

  // Workplace must not be empty or contain only spaces
  if (!form.workplace.trim()) errors.workplace = 'Workplace is required';

  // Date must be a valid calendar date
  if (!form.date) {
    errors.date = 'Date is required';
  } else if (isNaN(new Date(form.date).getTime())) {
    errors.date = 'Please enter a valid date';
  }

  // Start and end times must be provided
  if (!form.startTime) errors.startTime = 'Start time is required';
  if (!form.endTime) errors.endTime = 'End time is required';

  // Start and end times must not be identical
  if (form.startTime && form.endTime && form.startTime === form.endTime) {
    errors.endTime = 'Start and end times cannot be identical';
  }

  // Hourly rate must be a valid number greater than zero
  if (!form.hourlyRate) {
    errors.hourlyRate = 'Hourly rate is required';
  } else if (isNaN(Number(form.hourlyRate)) || Number(form.hourlyRate) <= 0) {
    errors.hourlyRate = 'Please enter a valid hourly rate';
  }

  // Break duration must be a valid dropdown option
  if (!VALID_BREAK_VALUES.includes(form.breakMinutes)) {
    errors.breakMinutes = 'Please select a valid break duration';
  }

  // Break must be shorter than total shift duration
  if (
    form.startTime &&
    form.endTime &&
    form.startTime !== form.endTime &&
    VALID_BREAK_VALUES.includes(form.breakMinutes)
  ) {
    const startH = Number(form.startTime.split(':')[0]);
    const startM = Number(form.startTime.split(':')[1]);
    const endH = Number(form.endTime.split(':')[0]);
    const endM = Number(form.endTime.split(':')[1]);
    let totalMinutes = endH * 60 + endM - (startH * 60 + startM);
    if (totalMinutes < 0) totalMinutes += 24 * 60;

    const breakM = Number(form.breakMinutes);
    if (breakM >= totalMinutes) {
      errors.breakMinutes = 'Break must be shorter than the shift duration';
    }
  }

  // Paid hours must be greater than zero
  if (
    form.startTime &&
    form.endTime &&
    form.startTime !== form.endTime &&
    !errors.breakMinutes
  ) {
    const paidHours = calculateShiftHours(form.startTime, form.endTime, Number(form.breakMinutes));
    if (paidHours <= 0) {
      errors.endTime = 'Paid working hours must be greater than zero';
    }
  }

  return errors;
}

export { VALID_BREAK_VALUES };
