import React, { useState } from 'react';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DataTable, Column } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { formatINR, addCurrency } from '@/utils/currency';
import { Layers, ShieldAlert } from 'lucide-react';

interface BenchmarkRecord {
  id: string;
  name: string;
  basePrice: string;
  variantDelta: string;
  totalPrice: string;
  status: 'ACTIVE' | 'CONFIRMED' | 'PAID';
}

const benchmarkData: BenchmarkRecord[] = [
  {
    id: 'BM-01',
    name: 'LoopBill Core (Odoo Brand Variant)',
    basePrice: formatINR('1000.00'),
    variantDelta: `+${formatINR('560.00')}`,
    totalPrice: formatINR(addCurrency('1000.00', '560.00')),
    status: 'ACTIVE',
  },
];

const columns: Column<BenchmarkRecord>[] = [
  { header: 'ID', accessorKey: 'id', className: 'font-mono text-xs text-brand-muted' },
  { header: 'Item / Configuration', accessorKey: 'name', className: 'font-semibold' },
  { header: 'Base Price', accessorKey: 'basePrice', align: 'right' },
  { header: 'Variant Delta', accessorKey: 'variantDelta', align: 'right', className: 'text-indigo-600 font-medium' },
  { header: 'Calculated Unit Price', accessorKey: 'totalPrice', align: 'right', className: 'font-bold' },
  {
    header: 'Status',
    cell: (row) => <StatusBadge status={row.status} variant={row.status} />,
    align: 'center',
  },
];

export const FoundationOverview: React.FC = () => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [testInput, setTestInput] = useState('');
  const { showToast } = useToast();

  const handleTriggerToast = () => {
    showToast({
      type: 'success',
      title: 'Foundation Verified',
      message: 'Design tokens, exact decimal math, and shared UI primitives verified.',
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-brand-primary text-white">
            Stage 1 Verified
          </span>
          <span className="text-xs text-brand-muted font-medium">
            LoopBill Design System &amp; Frontend Foundation
          </span>
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Frontend Architecture &amp; UI Primitives
        </h2>
        <p className="mt-1 text-sm text-brand-muted">
          Design tokens applied: Sidebar (<code className="font-mono text-xs">#0F172A</code>), Canvas (<code className="font-mono text-xs">#F8FAFC</code>), Primary (<code className="font-mono text-xs">#4F46E5</code>), Border (<code className="font-mono text-xs">#E2E8F0</code>).
        </p>
      </div>

      {/* KPI Cards Showcase */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Authoritative Variant Price"
          value={formatINR(addCurrency('1000.00', '560.00'))}
          subtitle="₹1,000 base + ₹560 Odoo delta"
          delta="Fixed Decimal"
          deltaType="positive"
          icon={<Layers className="h-4 w-4" />}
        />
        <MetricCard
          title="Design Token Sidebar"
          value="#0F172A"
          subtitle="Dark enterprise slate"
          deltaType="neutral"
        />
        <MetricCard
          title="Primary Brand Token"
          value="#4F46E5"
          subtitle="Indigo-600 accent"
          delta="Active"
          deltaType="positive"
        />
        <MetricCard
          title="Performance Target"
          value="< 2.0s SLA"
          subtitle="Tracked via X-Response-Time"
          delta="Monitored"
          deltaType="positive"
        />
      </div>

      {/* Interactive UI Component Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Buttons & Dialogs */}
        <div className="rounded-xl border border-brand-border bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Accessible UI Controls
          </h3>
          <p className="text-xs text-brand-muted">
            All buttons support keyboard navigation, ARIA attributes, and disabled states without external dependencies.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button variant="primary" onClick={handleTriggerToast}>
              Trigger Toast
            </Button>
            <Button variant="outline" onClick={() => setIsDemoModalOpen(true)}>
              Open Test Modal
            </Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="ghost">Ghost</Button>
          </div>

          <div className="pt-2">
            <Input
              label="Interactive Input Test"
              placeholder="Type to test input component..."
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              helperText="Strictly styled with border #E2E8F0 and focus ring #4F46E5"
            />
          </div>
        </div>

        {/* Status Badges Matrix */}
        <div className="rounded-xl border border-brand-border bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Semantic Status Badges
          </h3>
          <p className="text-xs text-brand-muted">
            Pre-configured semantic tokens for Subscriptions, Invoices, Payments, and Roles.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <StatusBadge status="ACTIVE" variant="ACTIVE" />
            <StatusBadge status="PAUSED" variant="PAUSED" />
            <StatusBadge status="PAID" variant="PAID" />
            <StatusBadge status="OVERDUE" variant="OVERDUE" />
            <StatusBadge status="CONFIRMED" variant="CONFIRMED" />
            <StatusBadge status="QUOTATION" variant="QUOTATION" />
            <StatusBadge status="DRAFT" variant="DRAFT" />
            <StatusBadge status="ADMIN" variant="ADMIN" />
            <StatusBadge status="STAFF" variant="STAFF" />
            <StatusBadge status="CUSTOMER" variant="CUSTOMER" />
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2 mt-4">
            <ShieldAlert className="h-4 w-4 text-brand-primary flex-shrink-0" />
            <span>Exact decimal precision enforced via <code className="font-mono font-bold">decimal.js</code> across all calculations.</span>
          </div>
        </div>
      </div>

      {/* Benchmark Data Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Benchmark Price Delta Verification
            </h3>
            <p className="text-xs text-brand-muted">
              Authoritative formula: <code className="font-mono font-bold">Final Price = Base Sales Price + Variant Price Delta</code>
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={benchmarkData}
          keyExtractor={(row) => row.id}
        />
      </div>

      {/* Test Modal Component */}
      <Modal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        title="UI Primitive Verification Dialog"
        description="Modal accessibility and backdrop blur test."
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            This modal is built with native keyboard listener (ESC key to close), accessibility roles, and focus trapping.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDemoModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsDemoModalOpen(false);
                handleTriggerToast();
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FoundationOverview;
