import React from 'react';
import { cn } from '@/utils/cn';

export interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  delta,
  deltaType = 'neutral',
  icon,
  isLoading = false,
}) => {
  const deltaColors = {
    positive: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    negative: 'text-rose-700 bg-rose-50 border-rose-200',
    neutral: 'text-slate-600 bg-slate-50 border-slate-200',
  };

  return (
    <div className="relative rounded-xl border border-brand-border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
          {title}
        </span>
        {icon && (
          <div className="rounded-lg bg-indigo-50 p-2 text-brand-primary">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        {isLoading ? (
          <div className="h-8 w-24 bg-slate-200 animate-pulse rounded" />
        ) : (
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </span>
        )}
        {delta && !isLoading && (
          <span
            className={cn(
              'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border',
              deltaColors[deltaType]
            )}
          >
            {delta}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-brand-muted">{subtitle}</p>
      )}
    </div>
  );
};
