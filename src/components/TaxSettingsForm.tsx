import type { TaxSettings } from '../types';

interface TaxSettingsFormProps {
  settings: TaxSettings;
  onChange: (settings: TaxSettings) => void;
}

export default function TaxSettingsForm({ settings, onChange }: TaxSettingsFormProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 text-left">
      <h2 className="text-lg font-semibold text-navy mb-4">Tax Settings</h2>

      {/* Tax Residency */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Tax Residency</label>
        <div className="space-y-2">
          {[
            { value: 'resident', label: 'Australian resident for tax purposes' },
            { value: 'foreign', label: 'Foreign resident for tax purposes' },
            { value: 'working-holiday', label: 'Working holiday maker' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="residency"
                value={opt.value}
                checked={settings.residency === opt.value}
                onChange={() => onChange({ ...settings, residency: opt.value as TaxSettings['residency'] })}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tax-Free Threshold (only for residents) */}
      {settings.residency === 'resident' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tax-Free Threshold</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tft"
                checked={settings.claimTaxFreeThreshold}
                onChange={() => onChange({ ...settings, claimTaxFreeThreshold: true })}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm text-gray-700">Yes — claiming the tax-free threshold</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tft"
                checked={!settings.claimTaxFreeThreshold}
                onChange={() => onChange({ ...settings, claimTaxFreeThreshold: false })}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm text-gray-700">No — not claiming the tax-free threshold</span>
            </label>
          </div>
        </div>
      )}

      {/* HELP / Student Loan */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">HELP / Student Loan</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="help"
              checked={settings.hasHelpLoan}
              onChange={() => onChange({ ...settings, hasHelpLoan: true })}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm text-gray-700">Yes — has an applicable HELP or study/training loan</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="help"
              checked={!settings.hasHelpLoan}
              onChange={() => onChange({ ...settings, hasHelpLoan: false })}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm text-gray-700">No — does not have an applicable loan</span>
          </label>
        </div>
      </div>
    </div>
  );
}
