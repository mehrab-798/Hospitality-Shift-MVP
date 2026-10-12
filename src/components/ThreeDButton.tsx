import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ThreeDButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

export default function ThreeDButton({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  disabled = false,
  ...props
}: ThreeDButtonProps) {
  const baseClasses =
    'px-6 py-3 rounded-xl font-semibold text-base transition-all duration-150 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none';

  const variantClasses = {
    primary:
      'bg-primary text-white shadow-[0_4px_0_0_#c2410c,0_6px_12px_rgba(0,0,0,0.15)] hover:bg-primary-dark active:translate-y-[3px] active:shadow-[0_1px_0_0_#c2410c,0_2px_4px_rgba(0,0,0,0.1)] focus:ring-primary/40',
    secondary:
      'bg-white text-gray-800 border-2 border-gray-200 shadow-[0_4px_0_0_#d1d5db,0_6px_12px_rgba(0,0,0,0.08)] hover:border-primary hover:text-primary active:translate-y-[3px] active:shadow-[0_1px_0_0_#d1d5db,0_2px_4px_rgba(0,0,0,0.05)] focus:ring-gray-300',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
