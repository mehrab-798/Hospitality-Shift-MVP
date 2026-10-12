import type { ReactNode } from 'react';
import Card from './Card';

interface FormSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function FormSection({ title, subtitle, children }: FormSectionProps) {
  return (
    <section>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <Card>{children}</Card>
    </section>
  );
}