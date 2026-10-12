import { useNavigate } from 'react-router-dom';
import { Clock, DollarSign } from 'lucide-react';
import Header from '../components/Header';
import Button from '../components/Button';
import ThreeDButton from '../components/ThreeDButton';
import Card from '../components/Card';
import InfoCard from '../components/InfoCard';
import TaxSettingsForm from '../components/TaxSettingsForm';
import WeekSelector from '../components/WeekSelector';
import type { Shift, TaxSettings } from '../types';
import { calculateTotalHours, calculateTotalEarnings, calculateTotalBreakHours, formatAUD, formatDate, formatTime, calculateShiftHours, calculateShiftEarnings } from '../utils/calculations';
import { calculateWeeklyTax, FINANCIAL_YEAR } from '../utils/tax';
import { filterShiftsByWeek } from '../utils/week';

interface WeeklySummaryPageProps {
  shifts: Shift[];
  taxSettings: TaxSettings;
  onTaxSettingsChange: (settings: TaxSettings) => void;
  selectedWeekStart: Date;
  onWeekChange: (weekStart: Date) => void;
}

export default function WeeklySummaryPage({ shifts, taxSettings, onTaxSettingsChange, selectedWeekStart, onWeekChange }: WeeklySummaryPageProps) {
  const navigate = useNavigate();

  const weekShifts = filterShiftsByWeek(shifts, selectedWeekStart);
  const totalHours = calculateTotalHours(weekShifts);
  const totalEarnings = calculateTotalEarnings(weekShifts);
  const totalBreakHours = calculateTotalBreakHours(weekShifts);
  const tax = calculateWeeklyTax(totalEarnings, taxSettings);

  return (
    <div className="min-h-screen bg-peach">
      <Header />
      <div className="px-6 py-10">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Your Week</p>
            <h1 className="text-2xl font-bold text-navy">Weekly Summary</h1>
            <p className="text-gray-500 mt-1">Your expected hours and earnings for the week</p>
          </div>

          {/* Week Navigation */}
          <WeekSelector weekStart={selectedWeekStart} onWeekChange={onWeekChange} />

          {/* Empty week */}
          {weekShifts.length === 0 && (
            <div className="text-center py-12 mb-8 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-peach rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-2 font-medium">No shifts recorded for this week</p>
              <p className="text-sm text-gray-400 mb-6">Add a shift to see your hours and earnings here.</p>
              <Button onClick={() => navigate('/add-shift')}>+ Add a Shift</Button>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <InfoCard label="Total Hours" value={totalHours} subtitle="hours this week" icon={<Clock className="w-5 h-5 text-gray-400" />} />
            <InfoCard label="Total Earnings" value={formatAUD(totalEarnings)} subtitle="gross earnings" accent icon={<DollarSign className="w-5 h-5 text-primary" />} />
          </div>

          <p className="text-xs text-gray-400 text-center leading-relaxed mb-8">
            Gross earnings are based on your recorded shifts and hourly rates.
            Estimated take-home pay includes calculated PAYG withholding and may differ
            from an actual payslip due to penalty rates, employer payroll arrangements
            and other adjustments.
          </p>

          {/* Tax Settings */}
          <TaxSettingsForm settings={taxSettings} onChange={onTaxSettingsChange} />

          {/* Weekly Earnings Summary */}
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-navy mb-4 text-left">Weekly Earnings Summary</h2>
            <div className="space-y-3">
              {[
                { label: 'Total Shifts', value: String(weekShifts.length) },
                { label: 'Total Paid Hours', value: `${totalHours} hrs` },
                { label: 'Total Unpaid Break Hours', value: `${totalBreakHours} hrs` },
                { label: 'Gross Weekly Earnings', value: formatAUD(totalEarnings), bold: true },
                { label: 'Estimated PAYG Withholding', value: `−${formatAUD(tax.paygWithholding)}` },
                ...(taxSettings.hasHelpLoan ? [{ label: 'Estimated HELP Withholding', value: `−${formatAUD(tax.helpWithholding)}` }] : []),
                { label: 'Total Estimated Withholding', value: `−${formatAUD(tax.totalWithholding)}`, bold: true },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className={`text-sm ${row.bold ? 'font-semibold text-navy' : 'text-gray-600'}`}>{row.label}</span>
                  <span className={`text-sm ${row.bold ? 'font-bold text-navy' : 'text-gray-800'}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Take-Home Pay (emphasised) */}
          <InfoCard
            label="Estimated Take-Home Pay"
            value={formatAUD(tax.takeHomePay)}
            subtitle={`after estimated tax (FY ${FINANCIAL_YEAR})`}
            accent
            className="mb-4"
          />

          <p className="text-xs text-gray-400 text-center leading-relaxed mb-8">
            Tax amounts are estimates based on Australian ATO PAYG withholding schedules.
            Actual payslip withholding may vary depending on individual circumstances and payroll adjustments.
          </p>

          {/* Breakdown */}
          {weekShifts.length > 0 && (
            <Card className="mb-8">
              <h2 className="text-lg font-semibold text-navy mb-4 text-left">Breakdown</h2>
              <div className="space-y-3">
                {weekShifts
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                  .map((shift) => (
                    <div key={shift.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                      <div className="text-left">
                        <p className="font-semibold text-navy">{shift.workplace}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(shift.date)} · {formatTime(shift.startTime)}–{formatTime(shift.endTime)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-navy">{formatAUD(calculateShiftEarnings(shift))}</p>
                        <p className="text-xs text-gray-400">{calculateShiftHours(shift.startTime, shift.endTime, shift.breakMinutes ?? 0)} hrs</p>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" fullWidth onClick={() => navigate('/weekly-shifts')}>
              ← Back to Shifts
            </Button>
            <ThreeDButton fullWidth onClick={() => navigate('/confirmation')}>
              Confirm & Finish
            </ThreeDButton>
          </div>
        </div>
      </div>
    </div>
  );
}