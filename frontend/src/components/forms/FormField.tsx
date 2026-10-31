import React from 'react';
import { cn } from '@/utils/cn';

export interface FormFieldProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helperText,
  required,
  children,
  className,
}) => {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-xs font-semibold text-slate-700 tracking-wide">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-brand-muted">{helperText}</p>
      ) : null}
    </div>
  );
};

