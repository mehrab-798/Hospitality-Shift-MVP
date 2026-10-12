import { useState } from 'react';
import type { Shift, ShiftFormData } from '../types';
import { formatDate, formatTime, formatAUD, calculateShiftHours, calculateShiftEarnings } from '../utils/calculations';
import { validateShiftForm, VALID_BREAK_VALUES } from '../utils/validation';
import Input from './Input';
import Select from './Select';

const BREAK_OPTIONS = VALID_BREAK_VALUES.map((v) => ({
  value: v,
  label: v === '0' ? 'No break (0 minutes)' : `${v} minutes`,
}));

interface ShiftCardProps {
  shift: Shift;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, form: ShiftFormData) => void;
}

export default function ShiftCard({ shift, onDelete, onUpdate }: ShiftCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ShiftFormData>({
    workplace: shift.workplace,
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    hourlyRate: String(shift.hourlyRate),
    breakMinutes: String(shift.breakMinutes ?? 0),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ShiftFormData, string>>>({});

  const hours = calculateShiftHours(shift.startTime, shift.endTime, shift.breakMinutes ?? 0);
  const earnings = calculateShiftEarnings(shift);

  function handleChange(field: keyof ShiftFormData, value: string) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSave() {
    const validationErrors = validateShiftForm(editForm);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0 && onUpdate) {
      onUpdate(shift.id, editForm);
      setIsEditing(false);
    }
  }

  function handleCancel() {
    setEditForm({
      workplace: shift.workplace,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      hourlyRate: String(shift.hourlyRate),
      breakMinutes: String(shift.breakMinutes ?? 0),
    });
    setErrors({});
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-primary border-l-4 border-l-primary p-5">
        <h3 className="text-lg font-semibold text-navy mb-4 text-left">Edit Shift</h3>
        <Input label="Workplace" type="text" value={editForm.workplace}
          onChange={(e) => handleChange('workplace', e.target.value)} error={errors.workplace} />
        <Input label="Date" type="date" value={editForm.date}
          onChange={(e) => handleChange('date', e.target.value)} error={errors.date} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Time" type="time" value={editForm.startTime}
            onChange={(e) => handleChange('startTime', e.target.value)} error={errors.startTime} />
          <Input label="End Time" type="time" value={editForm.endTime}
            onChange={(e) => handleChange('endTime', e.target.value)} error={errors.endTime} />
        </div>
        <Select label="Unpaid Break Duration" value={editForm.breakMinutes}
          onChange={(e) => handleChange('breakMinutes', e.target.value)}
          options={BREAK_OPTIONS} error={errors.breakMinutes} />
        <Input label="Hourly Rate (AUD)" type="number" step="0.01" min="0" value={editForm.hourlyRate}
          onChange={(e) => handleChange('hourlyRate', e.target.value)} error={errors.hourlyRate} />
        <div className="flex gap-3 mt-4">
          <button onClick={handleSave}
            className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm bg-primary text-white hover:bg-primary-dark transition-colors cursor-pointer">
            Save Changes
          </button>
          <button onClick={handleCancel}
            className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-primary p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors hover:bg-peach">
      <div className="flex-1 text-left">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{shift.workplace}</h3>
        <p className="text-sm text-gray-500">
          {formatDate(shift.date)}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
          <span className="text-gray-400 ml-2">({hours} hrs{shift.breakMinutes ? `, ${shift.breakMinutes}m break` : ''})</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Earnings</p>
          <p className="text-lg font-bold text-primary">{formatAUD(earnings)}</p>
          <p className="text-xs text-gray-400">{formatAUD(shift.hourlyRate)}/hr</p>
        </div>
        {onUpdate && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-400 hover:text-primary transition-colors p-2 cursor-pointer"
            title="Edit shift"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(shift.id)}
            className="text-red-400 hover:text-red-600 transition-colors p-2 cursor-pointer"
            title="Delete shift"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}