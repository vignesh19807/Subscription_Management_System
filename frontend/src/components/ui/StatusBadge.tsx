import React from 'react';
import { cn } from '@/utils/cn';

export type StatusVariant =
  | 'ACTIVE'
  | 'PAUSED'
  | 'CLOSED'
  | 'CONFIRMED'
  | 'DRAFT'
  | 'QUOTATION'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'REVERSED'
  | 'ADMIN'
  | 'STAFF'
  | 'CUSTOMER';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
  
  PAUSED: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10',
  QUOTATION: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10',
  
  CONFIRMED: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/10',
  ADMIN: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/10',
  
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10',
  STAFF: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-500/10',
  CUSTOMER: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/10',

  OVERDUE: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',
  CLOSED: 'bg-slate-100 text-slate-500 border-slate-200 ring-slate-500/10',
  CANCELLED: 'bg-rose-50 text-rose-600 border-rose-200 ring-rose-500/10',
  REVERSED: 'bg-rose-50 text-rose-600 border-rose-200 ring-rose-500/10',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  className,
}) => {
  const normalizedKey = (variant || status).toUpperCase();
  const style =
    statusStyles[normalizedKey] ??
    'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ring-1',
        style,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {status}
    </span>
  );
};

