import type { InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export default function Checkbox({ label, id, ...props }: CheckboxProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="mb-4 flex items-start gap-3 text-left">
      <input
        type="checkbox"
        id={inputId}
        className="mt-1 h-5 w-5 rounded border-gray-300 text-primary accent-primary cursor-pointer"
        {...props}
      />
      <label htmlFor={inputId} className="text-sm text-gray-700 cursor-pointer">
        {label}
      </label>
    </div>
  );
}