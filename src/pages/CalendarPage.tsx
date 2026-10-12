import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';
import Header from '../components/Header';
import Button from '../components/Button';
import InfoCard from '../components/InfoCard';
import ShiftCard from '../components/ShiftCard';
import type { Shift, ShiftFormData } from '../types';
import { calculateTotalHours, calculateTotalEarnings, formatAUD, calculateShiftHours, calculateShiftEarnings } from '../utils/calculations';
import { getWeekStart, formatWeekRange, filterShiftsByWeek, toDateStr } from '../utils/week';
import { getMonthGrid, getMonthLabel, filterShiftsByMonth, groupShiftsByDate } from '../utils/calendar';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface CalendarPageProps {
  shifts: Shift[];
  onUpdateShift: (id: string, form: ShiftFormData) => void;
  onDeleteShift: (id: string) => void;
}

export default function CalendarPage({ shifts, onUpdateShift, onDeleteShift }: CalendarPageProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  // Compute week or month bounds
  const weekStart = useMemo(() => getWeekStart(anchorDate), [anchorDate]);
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();

  // Filter shifts for current period
  const periodShifts = useMemo(
    () => (viewMode === 'weekly' ? filterShiftsByWeek(shifts, weekStart) : filterShiftsByMonth(shifts, year, month)),
    [shifts, viewMode, weekStart, year, month],
  );

  // Summary
  const totalShifts = periodShifts.length;
  const totalHours = calculateTotalHours(periodShifts);
  const totalEarnings = calculateTotalEarnings(periodShifts);

  // Navigation
  function goPrev() {
    const d = new Date(anchorDate);
    if (viewMode === 'weekly') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setAnchorDate(d);
  }
  function goNext() {
    const d = new Date(anchorDate);
    if (viewMode === 'weekly') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setAnchorDate(d);
  }
  function goToday() {
    setAnchorDate(new Date());
  }

  // Period label
  const periodLabel = viewMode === 'weekly' ? formatWeekRange(weekStart) : getMonthLabel(anchorDate);
  const isCurrentWeek = toDateStr(weekStart) === toDateStr(getWeekStart(new Date()));
  const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth();

  // Group shifts by date for calendar cells
  const shiftMap = useMemo(() => groupShiftsByDate(shifts), [shifts]);

  // Month grid
  const monthGrid = useMemo(() => getMonthGrid(year, month), [year, month]);

  return (
    <div className="min-h-screen bg-peach">
      <Header />
      <div className="px-4 sm:px-6 py-10">
        <div className="max-w-5xl mx-auto">
          {/* Page heading */}
          <div className="text-center mb-6">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Schedule</p>
            <h1 className="text-2xl font-bold text-navy">Calendar</h1>
            <p className="text-gray-500 mt-1">View your shifts by week or month</p>
          </div>

          {/* View toggle + Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex bg-white rounded-xl border border-gray-200 p-1">
              {(['weekly', 'monthly'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${viewMode === mode ? 'bg-primary text-white' : 'text-gray-500 hover:text-navy'
                    }`}
                >
                  {mode === 'weekly' ? 'Weekly' : 'Monthly'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={goPrev} className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:border-primary hover:text-primary transition-colors cursor-pointer" aria-label="Previous">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-center min-w-[160px]">
                <p className="text-sm font-semibold text-navy">{periodLabel}</p>
                {!isCurrentWeek && !isCurrentMonth && (
                  <button onClick={goToday} className="text-xs text-primary font-medium hover:underline cursor-pointer">Today</button>
                )}
              </div>
              <button onClick={goNext} className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:border-primary hover:text-primary transition-colors cursor-pointer" aria-label="Next">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <InfoCard label="Total Shifts" value={totalShifts} className="px-3 py-4" />
            <InfoCard label="Paid Hours" value={`${totalHours} hrs`} className="px-3 py-4" />
            <InfoCard label="Gross Earnings" value={formatAUD(totalEarnings)} accent className="px-3 py-4" />
          </div>

          {/* Weekly View */}
          {viewMode === 'weekly' && (
            <div className="grid grid-cols-7 gap-2 mb-6">
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date(weekStart);
                d.setDate(d.getDate() + i);
                const dateStr = toDateStr(d);
                const dayShifts = shiftMap.get(dateStr) ?? [];
                const isToday = dateStr === toDateStr(new Date());
                return (
                  <div key={dateStr} className={`bg-white rounded-xl border p-2 min-h-[120px] ${isToday ? 'border-primary shadow-sm' : 'border-gray-100'}`}>
                    <div className="text-center mb-2">
                      <p className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-gray-400'}`}>{DAY_LABELS[i]}</p>
                      <p className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-navy'}`}>{d.getDate()}</p>
                    </div>
                    <div className="space-y-1">
                      {dayShifts.map((shift) => (
                        <button key={shift.id} onClick={() => setSelectedShift(shift)}
                          className="w-full text-left bg-peach rounded-lg px-2 py-1.5 hover:bg-peach-100 transition-colors cursor-pointer border border-peach-100">
                          <p className="text-xs font-semibold text-navy truncate">{shift.workplace}</p>
                          <p className="text-xs text-gray-500">{calculateShiftHours(shift.startTime, shift.endTime, shift.breakMinutes ?? 0)}h</p>
                          <p className="text-xs font-medium text-primary">{formatAUD(calculateShiftEarnings(shift))}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Monthly View */}
          {viewMode === 'monthly' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
              <div className="grid grid-cols-7 border-b border-gray-100">
                {DAY_LABELS.map((day) => (
                  <div key={day} className="p-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthGrid.map((d) => {
                  const dateStr = toDateStr(d);
                  const dayShifts = shiftMap.get(dateStr) ?? [];
                  const isCurrentMonth = d.getMonth() === month;
                  const isToday = dateStr === toDateStr(new Date());
                  return (
                    <div key={dateStr} className={`border-b border-r border-gray-50 min-h-[90px] p-1.5 ${!isCurrentMonth ? 'bg-gray-50/50' : ''}`}>
                      <p className={`text-xs font-medium mb-1 ${isToday ? 'bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center' : isCurrentMonth ? 'text-navy' : 'text-gray-300'}`}>
                        {d.getDate()}
                      </p>
                      <div className="space-y-0.5">
                        {dayShifts.map((shift) => (
                          <button key={shift.id} onClick={() => setSelectedShift(shift)}
                            className="w-full text-left bg-peach rounded px-1.5 py-0.5 hover:bg-peach-100 transition-colors cursor-pointer border border-peach-100">
                            <p className="text-xs font-medium text-navy truncate leading-tight">{shift.workplace}</p>
                            <p className="text-xs text-primary leading-tight">{formatAUD(calculateShiftEarnings(shift))}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Shift button */}
          <div className="mb-8">
            <Button fullWidth onClick={() => navigate('/add-shift')}>
              <span className="flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Shift
              </span>
            </Button>
          </div>

          {/* Shift Detail Modal */}
          {selectedShift && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedShift(null)}>
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-navy">Shift Details</h2>
                  <button onClick={() => setSelectedShift(null)} className="text-gray-400 hover:text-navy transition-colors cursor-pointer p-1">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <ShiftCard
                  shift={selectedShift}
                  onUpdate={(id, form) => { onUpdateShift(id, form); setSelectedShift(null); }}
                  onDelete={(id) => { onDeleteShift(id); setSelectedShift(null); }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}