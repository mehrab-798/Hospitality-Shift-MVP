import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatWeekRange, getWeekStart, toDateStr } from '../utils/week';

interface WeekSelectorProps {
  weekStart: Date;
  onWeekChange: (weekStart: Date) => void;
}

export default function WeekSelector({ weekStart, onWeekChange }: WeekSelectorProps) {
  const today = new Date();
  const currentWeekStart = getWeekStart(today);
  const isCurrentWeek = toDateStr(weekStart) === toDateStr(currentWeekStart);

  function goPrev() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    onWeekChange(d);
  }

  function goNext() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    onWeekChange(d);
  }

  function goToday() {
    onWeekChange(currentWeekStart);
  }

  return (
    <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 mb-6">
      <button
        onClick={goPrev}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-primary hover:text-primary transition-colors cursor-pointer"
        aria-label="Previous week"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="flex flex-col items-center">
        <p className="text-sm font-semibold text-navy">{formatWeekRange(weekStart)}</p>
        {!isCurrentWeek && (
          <button
            onClick={goToday}
            className="text-xs text-primary font-medium hover:underline mt-0.5 cursor-pointer"
          >
            Go to current week
          </button>
        )}
      </div>

      <button
        onClick={goNext}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-primary hover:text-primary transition-colors cursor-pointer"
        aria-label="Next week"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
