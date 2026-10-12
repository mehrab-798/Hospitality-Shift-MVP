import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import ThreeDButton from '../components/ThreeDButton';
import Input from '../components/Input';
import Select from '../components/Select';
import FormSection from '../components/FormSection';
import type { ShiftFormData } from '../types';
import { calculateShiftHours, formatAUD } from '../utils/calculations';
import { validateShiftForm, VALID_BREAK_VALUES } from '../utils/validation';

const BREAK_OPTIONS = [
  { value: '0', label: 'No break (0 minutes)' },
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '60 minutes' },
];

interface AddShiftPageProps {
  shiftForm: ShiftFormData;
  onFormChange: (form: ShiftFormData) => void;
  onAddShift: (form: ShiftFormData) => void;
}

export default function AddShiftPage({ shiftForm, onFormChange, onAddShift }: AddShiftPageProps) {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Partial<Record<keyof ShiftFormData, string>>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(field: keyof ShiftFormData, value: string) {
    onFormChange({ ...shiftForm, [field]: value });
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(): boolean {
    const newErrors = validateShiftForm(shiftForm);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    if (validate()) {
      setIsSubmitting(true);
      onAddShift(shiftForm);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setTimeout(() => setIsSubmitting(false), 1000);
    }
  }

  // Live calculation preview
  const hasPreview =
    shiftForm.startTime &&
    shiftForm.endTime &&
    shiftForm.startTime !== shiftForm.endTime &&
    shiftForm.hourlyRate &&
    !isNaN(Number(shiftForm.hourlyRate)) &&
    Number(shiftForm.hourlyRate) > 0 &&
    VALID_BREAK_VALUES.includes(shiftForm.breakMinutes);

  const previewPaidHours = hasPreview
    ? calculateShiftHours(shiftForm.startTime, shiftForm.endTime, Number(shiftForm.breakMinutes))
    : 0;
  const previewEarnings = hasPreview ? previewPaidHours * Number(shiftForm.hourlyRate) : 0;

  return (
    <div className="min-h-screen bg-peach">
      <Header />
      <div className="px-6 py-10">
        <div className="max-w-md mx-auto">
          {showSuccess && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-green-700">Shift added successfully! You can add another shift below.</p>
            </div>
          )}

          <FormSection title="Add a Shift" subtitle="Enter your shift details below to keep track of your work and expected earnings.">
            <form onSubmit={handleSubmit}>
              <Input
                label="Workplace"
                type="text"
                placeholder="e.g. The Coffee Club"
                value={shiftForm.workplace}
                onChange={(e) => handleChange('workplace', e.target.value)}
                error={errors.workplace}
              />
              <Input
                label="Date"
                type="date"
                value={shiftForm.date}
                onChange={(e) => handleChange('date', e.target.value)}
                error={errors.date}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Time"
                  type="time"
                  value={shiftForm.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                  error={errors.startTime}
                />
                <Input
                  label="End Time"
                  type="time"
                  value={shiftForm.endTime}
                  onChange={(e) => handleChange('endTime', e.target.value)}
                  error={errors.endTime}
                />
              </div>
              <Select
                label="Unpaid Break Duration"
                value={shiftForm.breakMinutes}
                onChange={(e) => handleChange('breakMinutes', e.target.value)}
                options={BREAK_OPTIONS}
                error={errors.breakMinutes}
              />
              <Input
                label="Hourly Rate (AUD)"
                type="number"
                placeholder="e.g. 28.50"
                step="0.01"
                min="0"
                value={shiftForm.hourlyRate}
                onChange={(e) => handleChange('hourlyRate', e.target.value)}
                error={errors.hourlyRate}
              />

              {/* Live calculation preview */}
              {hasPreview && previewPaidHours > 0 && (
                <div className="mb-4 rounded-xl border border-peach-100 bg-peach/50 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Paid Hours</p>
                      <p className="text-lg font-bold text-navy">{previewPaidHours} hrs</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Estimated Earnings</p>
                      <p className="text-lg font-bold text-primary">{formatAUD(previewEarnings)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <ThreeDButton type="submit" fullWidth disabled={isSubmitting}>
                  Add Shift
                </ThreeDButton>
              </div>
            </form>
          </FormSection>

          <div className="mt-4">
            <Button variant="secondary" fullWidth onClick={() => navigate('/weekly-shifts')}>
              View My Shifts
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}