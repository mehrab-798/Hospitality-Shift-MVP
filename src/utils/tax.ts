import type { TaxSettings } from '../types';

/**
 * Australian PAYG Withholding Calculation Module
 * Financial Year: 2026-27
 *
 * LIMITATIONS:
 * - Exact ATO weekly formula coefficients not verifiable (ATO site blocked).
 *   Uses verified annual tax rates from PwC applied via ATO weekly methodology.
 * - HELP thresholds use FY2025-26 rates (FY2026-27 not verifiable).
 * - Medicare levy family tests and LITO simplified for individual taxpayers.
 */

export const FINANCIAL_YEAR = '2026-27';

const WEEKS_PER_YEAR = 52;
const TAX_FREE_THRESHOLD_ANNUAL = 18200;
const MEDICARE_LEVY_RATE = 0.02;
const LITO_MAX = 700;
const LITO_PHASE_OUT_START = 37500;
const LITO_PHASE_OUT_END = 66667;

interface TaxBracket {
  min: number;
  max: number;
  rate: number;
  base: number;
}

const RESIDENT_BRACKETS: TaxBracket[] = [
  { min: 0, max: 18200, rate: 0.00, base: 0 },
  { min: 18200, max: 45000, rate: 0.15, base: 0 },
  { min: 45000, max: 135000, rate: 0.30, base: 4020 },
  { min: 135000, max: 190000, rate: 0.37, base: 31020 },
  { min: 190000, max: Infinity, rate: 0.45, base: 51370 },
];

const RESIDENT_NO_TFT_BRACKETS: TaxBracket[] = [
  { min: 0, max: 45000, rate: 0.15, base: 0 },
  { min: 45000, max: 135000, rate: 0.30, base: 6750 },
  { min: 135000, max: 190000, rate: 0.37, base: 33750 },
  { min: 190000, max: Infinity, rate: 0.45, base: 54100 },
];

const FOREIGN_BRACKETS: TaxBracket[] = [
  { min: 0, max: 135000, rate: 0.30, base: 0 },
  { min: 135000, max: 190000, rate: 0.37, base: 40500 },
  { min: 190000, max: Infinity, rate: 0.45, base: 60850 },
];

const WHM_BRACKETS: TaxBracket[] = [
  { min: 0, max: 45000, rate: 0.15, base: 0 },
  { min: 45000, max: 135000, rate: 0.30, base: 6750 },
  { min: 135000, max: 190000, rate: 0.37, base: 33750 },
  { min: 190000, max: Infinity, rate: 0.45, base: 54100 },
];

// HELP repayment bands (FY2025-26)
interface HelpBand { min: number; max: number; rate: number; }
const HELP_BANDS: HelpBand[] = [
  { min: 0, max: 54435, rate: 0 },
  { min: 54435, max: 62262, rate: 0.01 },
  { min: 62262, max: 66345, rate: 0.02 },
  { min: 66345, max: 70428, rate: 0.025 },
  { min: 70428, max: 74512, rate: 0.03 },
  { min: 74512, max: 80274, rate: 0.035 },
  { min: 80274, max: 86040, rate: 0.04 },
  { min: 86040, max: 93234, rate: 0.045 },
  { min: 93234, max: 100564, rate: 0.05 },
  { min: 100564, max: 110698, rate: 0.055 },
  { min: 110698, max: 121369, rate: 0.06 },
  { min: 121369, max: 133030, rate: 0.065 },
  { min: 133030, max: 145781, rate: 0.07 },
  { min: 145781, max: 158615, rate: 0.075 },
  { min: 158615, max: 172769, rate: 0.08 },
  { min: 172769, max: 185785, rate: 0.085 },
  { min: 185785, max: 201177, rate: 0.09 },
  { min: 201177, max: 217458, rate: 0.095 },
  { min: 217458, max: Infinity, rate: 0.10 },
];

function calculateAnnualTax(annualIncome: number, brackets: TaxBracket[]): number {
  if (annualIncome <= 0) return 0;
  for (const b of brackets) {
    if (annualIncome <= b.max) return b.base + b.rate * (annualIncome - b.min);
  }
  return 0;
}

function calculateLITO(annualIncome: number): number {
  if (annualIncome <= LITO_PHASE_OUT_START) return LITO_MAX;
  if (annualIncome >= LITO_PHASE_OUT_END) return 0;
  if (annualIncome <= 45000) {
    return LITO_MAX - 0.05 * (annualIncome - LITO_PHASE_OUT_START);
  }
  const at45k = LITO_MAX - 0.05 * (45000 - LITO_PHASE_OUT_START);
  return Math.max(0, at45k - 0.015 * (annualIncome - 45000));
}

function calculateHelpRepayment(annualIncome: number): number {
  for (const b of HELP_BANDS) {
    if (annualIncome <= b.max) return b.rate * (annualIncome - b.min);
  }
  return 0;
}

export interface WeeklyTaxResult {
  grossWeekly: number;
  paygWithholding: number;
  helpWithholding: number;
  totalWithholding: number;
  takeHomePay: number;
}

export function calculateWeeklyTax(weeklyGross: number, settings: TaxSettings): WeeklyTaxResult {
  const annualGross = weeklyGross * WEEKS_PER_YEAR;
  let brackets: TaxBracket[];
  let appliesMedicare: boolean;
  let appliesTFT: boolean;

  switch (settings.residency) {
    case 'foreign':
      brackets = FOREIGN_BRACKETS; appliesMedicare = false; appliesTFT = false; break;
    case 'working-holiday':
      brackets = WHM_BRACKETS; appliesMedicare = false; appliesTFT = false; break;
    default:
      appliesMedicare = true;
      appliesTFT = settings.claimTaxFreeThreshold;
      brackets = settings.claimTaxFreeThreshold ? RESIDENT_BRACKETS : RESIDENT_NO_TFT_BRACKETS;
  }

  let incomeTax: number;
  if (appliesTFT) {
    incomeTax = Math.max(0, calculateAnnualTax(annualGross, brackets) - calculateAnnualTax(TAX_FREE_THRESHOLD_ANNUAL, brackets));
  } else {
    incomeTax = calculateAnnualTax(annualGross, brackets);
  }

  const medicare = appliesMedicare ? annualGross * MEDICARE_LEVY_RATE : 0;
  const lito = appliesTFT ? calculateLITO(annualGross) : 0;
  const totalAnnual = Math.max(0, incomeTax + medicare - lito);
  const paygWeekly = Math.round(totalAnnual / WEEKS_PER_YEAR);
  const helpWeekly = settings.hasHelpLoan ? Math.round(calculateHelpRepayment(annualGross) / WEEKS_PER_YEAR) : 0;

  return {
    grossWeekly: Math.round(weeklyGross * 100) / 100,
    paygWithholding: paygWeekly,
    helpWithholding: helpWeekly,
    totalWithholding: paygWeekly + helpWeekly,
    takeHomePay: Math.round(Math.max(0, weeklyGross - paygWeekly - helpWeekly) * 100) / 100,
  };
}