import React from 'react';
import { useResponseLatency } from '@/hooks/useResponseLatency';
import { Activity } from 'lucide-react';

export const LatencyBadge: React.FC = () => {
  const latency = useResponseLatency();

  if (latency === null) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <Activity className="h-3.5 w-3.5 text-slate-400" />
        <span>SLA: &lt; 2.0s</span>
      </div>
    );
  }

  // <300ms is target p95, <2000ms is benchmark SLA
  const isOptimal = latency < 300;
  const isAcceptable = latency < 2000;

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
        isOptimal
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : isAcceptable
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
      }`}
      title="Latency extracted from X-Response-Time / Roundtrip"
    >
      <Activity className="h-3.5 w-3.5" />
      <span>{latency} ms</span>
    </div>
  );
};
