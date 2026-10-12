import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import ThreeDButton from '../components/ThreeDButton';
import InfoCard from '../components/InfoCard';
import type { Shift, TaxSettings } from '../types';
import { calculateTotalHours, calculateTotalEarnings, calculateTotalBreakHours, formatAUD } from '../utils/calculations';
import { calculateWeeklyTax, FINANCIAL_YEAR } from '../utils/tax';
import { filterShiftsByWeek, formatWeekRange } from '../utils/week';

interface ConfirmationPageProps {
  shifts: Shift[];
  onClearShifts: () => void;
  selectedWeekStart: Date;
  taxSettings: TaxSettings;
}

export default function ConfirmationPage({ shifts, onClearShifts, selectedWeekStart, taxSettings }: ConfirmationPageProps) {
  const navigate = useNavigate();

  const weekShifts = filterShiftsByWeek(shifts, selectedWeekStart);
  const totalHours = calculateTotalHours(weekShifts);
  const totalEarnings = calculateTotalEarnings(weekShifts);
  const totalBreakHours = calculateTotalBreakHours(weekShifts);
  const tax = calculateWeeklyTax(totalEarnings, taxSettings);

  function handleStartAgain() {
    onClearShifts();
    navigate('/');
  }

  function handleAddAnother() {
    navigate('/add-shift');
  }

  return (
    <div className="min-h-screen bg-peach">
      <Header />
      <div className="flex items-center justify-center px-6 py-10">
        <div className="max-w-md w-full text-center">
          {/* Success icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-navy mb-2">Shifts Confirmed!</h1>
          <p className="text-gray-500 mb-2">
            Your shift information for the week of {formatWeekRange(selectedWeekStart)} has been processed.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            {totalBreakHours > 0 && `${totalBreakHours} hrs unpaid break deducted · `}FY {FINANCIAL_YEAR}
          </p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <InfoCard label="Shifts Logged" value={weekShifts.length} className="px-3 py-4" />
            <InfoCard label="Paid Hours" value={`${totalHours} hrs`} className="px-3 py-4" />
            <InfoCard label="Gross Earnings" value={formatAUD(totalEarnings)} accent className="px-3 py-4" />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <InfoCard label="Est. Withholding" value={`−${formatAUD(tax.totalWithholding)}`} />
            <InfoCard label="Est. Take-Home Pay" value={formatAUD(tax.takeHomePay)} accent />
          </div>

          <p className="text-xs text-gray-400 text-center leading-relaxed mb-8">
            Gross earnings are based on your recorded shifts and hourly rates.
            Estimated take-home pay includes calculated PAYG withholding and may differ
            from an actual payslip due to penalty rates, employer payroll arrangements
            and other adjustments.
          </p>

          <div className="flex flex-col gap-3">
            <ThreeDButton fullWidth onClick={handleAddAnother}>
              + Add Another Shift
            </ThreeDButton>
            <Button variant="secondary" fullWidth onClick={handleStartAgain}>
              Start Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}