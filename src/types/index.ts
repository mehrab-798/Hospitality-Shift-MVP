export interface User {
  name: string;
  email: string;
}

export interface Shift {
  id: string;
  workplace: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  hourlyRate: number; // AUD
  breakMinutes?: number; // Unpaid break in minutes (0, 15, 30, 45, 60)
}

export interface ShiftFormData {
  workplace: string;
  date: string;
  startTime: string;
  endTime: string;
  hourlyRate: string;
  breakMinutes: string;
}

export const emptyShiftForm: ShiftFormData = {
  workplace: '',
  date: '',
  startTime: '',
  endTime: '',
  hourlyRate: '',
  breakMinutes: '0',
};

export interface TaxSettings {
  residency: 'resident' | 'foreign' | 'working-holiday';
  claimTaxFreeThreshold: boolean;
  hasHelpLoan: boolean;
}

export const defaultTaxSettings: TaxSettings = {
  residency: 'resident',
  claimTaxFreeThreshold: true,
  hasHelpLoan: false,
};