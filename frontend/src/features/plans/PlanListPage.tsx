import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planApi } from '@/api/planApi';
import { BillingPlan } from '@/types/plan';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PlanModal } from './PlanModal';
import { useToast } from '@/components/ui/Toast';
import { Plus, Search, Edit2, CheckCircle2, XCircle } from 'lucide-react';

export const PlanListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [intervalFilter, setIntervalFilter] = useState<'ALL' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<BillingPlan | null>(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => planApi.getPlans(),
  });

  const savePlanMutation = useMutation({
    mutationFn: async (data: Omit<BillingPlan, 'id'>) => {
      if (planToEdit) {
        return planApi.updatePlan(planToEdit.id, data);
      }
      return planApi.createPlan(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      showToast({
        type: 'success',
        title: planToEdit ? 'Plan Updated' : 'Plan Created',
        message: 'Recurring billing plan saved successfully.',
      });
      setPlanToEdit(null);
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Operation Failed',
        message: err instanceof Error ? err.message : 'Could not save plan',
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      planApi.togglePlanStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      showToast({
        type: 'info',
        title: 'Status Updated',
        message: 'Plan availability status updated.',
      });
    },
  });

  const filteredPlans = plans.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesInterval = intervalFilter === 'ALL' || p.billingInterval === intervalFilter;
    return matchesSearch && matchesInterval;
  });

  const columns: Column<BillingPlan>[] = [
    {
      header: 'Plan Title',
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.name}</span>
          {row.description && <span className="text-[11px] text-brand-muted line-clamp-1">{row.description}</span>}
        </div>
      ),
    },
    {
      header: 'Billing Interval',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs border border-slate-200">
          {row.intervalCount > 1 ? `Every ${row.intervalCount} ${row.billingInterval.toLowerCase()}s` : row.billingInterval}
        </span>
      ),
    },
    {
      header: 'Min Qty',
      accessorKey: 'minQuantity',
      align: 'center',
      cell: (row) => <span className="font-mono text-xs text-slate-600">{row.minQuantity} unit(s)</span>,
    },
    {
      header: 'Governance Flags',
      cell: (row) => (
        <div className="flex flex-wrap gap-1 text-[10px]">
          <span
            className={`px-1.5 py-0.5 rounded border ${
              row.allowPause
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
            }`}
          >
            Pause
          </span>
          <span
            className={`px-1.5 py-0.5 rounded border ${
              row.allowEarlyClosure
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
            }`}
          >
            Early Close
          </span>
          <span
            className={`px-1.5 py-0.5 rounded border ${
              row.allowRenewal
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
            }`}
          >
            Renewal
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      align: 'center',
      cell: (row) => (
        <StatusBadge
          status={row.isActive ? 'ACTIVE' : 'CLOSED'}
          variant={row.isActive ? 'ACTIVE' : 'CLOSED'}
        />
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setPlanToEdit(row);
              setIsModalOpen(true);
            }}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-brand-primary transition-colors"
            title="Edit plan"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => toggleStatusMutation.mutate({ id: row.id, isActive: !row.isActive })}
            className={`p-1.5 rounded transition-colors ${
              row.isActive
                ? 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'
            }`}
            title={row.isActive ? 'Deactivate plan' : 'Activate plan'}
          >
            {row.isActive ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-brand-primary text-white">
              Schedules
            </span>
            <span className="text-xs text-brand-muted font-medium">Brightloop Software</span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Recurring Billing Plans &amp; Rule Governance
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Configure automated subscription renewal cycles, pause permissions, and commitment horizons.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setPlanToEdit(null);
            setIsModalOpen(true);
          }}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>New Billing Plan</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-brand-border shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Search plans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const).map((interval) => (
            <button
              key={interval}
              onClick={() => setIntervalFilter(interval)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                intervalFilter === interval
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {interval === 'ALL' ? 'All Intervals' : interval}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredPlans}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        emptyMessage="No billing plans match your filter criteria."
      />

      {/* Plan Modal */}
      <PlanModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPlanToEdit(null);
        }}
        planToEdit={planToEdit}
        onSave={async (plan) => {
          await savePlanMutation.mutateAsync(plan);
        }}
      />
    </div>
  );
};

export default PlanListPage;
