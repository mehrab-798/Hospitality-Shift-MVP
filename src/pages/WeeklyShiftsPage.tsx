import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import { IconButton } from '../components/IconButton';
import ShiftCard from '../components/ShiftCard';
import type { Shift, ShiftFormData } from '../types';
import { calculateTotalHours, calculateTotalEarnings, formatAUD } from '../utils/calculations';

interface WeeklyShiftsPageProps {
  shifts: Shift[];
  onDeleteShift: (id: string) => void;
  onUpdateShift: (id: string, form: ShiftFormData) => void;
}

export default function WeeklyShiftsPage({ shifts, onDeleteShift, onUpdateShift }: WeeklyShiftsPageProps) {
  const navigate = useNavigate();

  const totalHours = calculateTotalHours(shifts);
  const totalEarnings = calculateTotalEarnings(shifts);

  return (
    <div className="min-h-screen bg-peach">
      <Header />
      <div className="px-6 py-10">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Your Shifts</p>
            <h1 className="text-2xl font-bold text-navy">Weekly Shifts</h1>
            <p className="text-gray-500 mt-1">Review your shifts before viewing the summary</p>
          </div>

          {shifts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-peach rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-6">No shifts added yet</p>
              <Button onClick={() => navigate('/add-shift')}>
                Add Your First Shift
              </Button>
            </div>
          ) : (
            <>
              {/* Quick stats bar */}
              <div className="flex justify-between items-center bg-peach rounded-xl border border-peach-100 p-5 mb-6">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Total Hours</p>
                  <p className="text-xl font-bold text-navy">{totalHours} hrs</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Total Earnings</p>
                  <p className="text-xl font-bold text-primary">{formatAUD(totalEarnings)}</p>
                </div>
              </div>

              {/* Shift list */}
              <div className="space-y-4 mb-8">
                {shifts
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                  .map((shift) => (
                    <ShiftCard key={shift.id} shift={shift} onDelete={onDeleteShift} onUpdate={onUpdateShift} />
                  ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="secondary" fullWidth onClick={() => navigate('/add-shift')}>
                  + Add Another Shift
                </Button>
                <IconButton
                  text="Next: Weekly Summary"
                  onClick={() => navigate('/weekly-summary')}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}