import type { ReactNode } from 'react';

interface InfoCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  accent?: boolean;
  icon?: ReactNode;
  className?: string;
}

export default function InfoCard({
  label,
  value,
  subtitle,
  accent = false,
  icon,
  className = '',
}: InfoCardProps) {
  return (
    <div
      className={`rounded-xl border p-5 text-center ${
        accent ? 'bg-peach border-peach-100' : 'bg-white border-gray-100 shadow-sm'
      } ${className}`}
    >
      {icon && <div className="flex justify-center mb-2">{icon}</div>}
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">
        {label}
      </p>
      <p className={`text-2xl font-bold break-words ${accent ? 'text-primary' : 'text-navy'}`}>
        {value}
      </p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
