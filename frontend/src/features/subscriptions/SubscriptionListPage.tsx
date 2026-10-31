import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '@/api/subscriptionApi';
import { planApi } from '@/api/planApi';
import { Subscription, SubscriptionStatus } from '@/types/subscription';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatINR } from '@/utils/currency';
import {
  Calendar,
  Pause,
  Play,
  RefreshCw,
  XCircle,
} from 'lucide-react';

export const SubscriptionListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'CLOSED'>('ALL');
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionApi.getSubscriptions(),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => planApi.getPlans(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SubscriptionStatus }) =>
      subscriptionApi.updateSubscriptionStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      showToast({
        type: 'info',
        title: 'Status Updated',
        message: `${updated.subscriptionNumber} transitioned to ${updated.status}.`,
      });
      setSelectedSub(updated);
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Policy Gating',
        message: err instanceof Error ? err.message : 'Action blocked by plan policy',
      });
    },
  });

  const renewMutation = useMutation({
    mutationFn: (id: string) => subscriptionApi.renewSubscription(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      showToast({
        type: 'success',
        title: 'Subscription Renewed',
        message: `${updated.subscriptionNumber} advanced to next billing cycle.`,
      });
      setSelectedSub(updated);
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Renewal Blocked',
        message: err instanceof Error ? err.message : 'Plan does not permit renewal',
      });
    },
  });

  const filteredSubs = subscriptions.filter((s) => {
    if (statusFilter === 'ALL') return true;
    return s.status === statusFilter;
  });

  const columns: Column<Subscription>[] = [
    {
      header: 'Subscription #',
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 block">{row.subscriptionNumber}</span>
          <span className="text-[11px] text-brand-muted flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Since {new Date(row.startDate).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Customer',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.customerName}</span>
          <span className="text-[11px] text-brand-muted">{row.customerEmail}</span>
        </div>
      ),
    },
    {
      header: 'Assigned Plan',
      cell: (row) => (
        <div>
          <span className="font-medium text-slate-900 block">{row.planName}</span>
          <span className="text-[11px] font-mono text-slate-500">{row.billingInterval}</span>
        </div>
      ),
    },
    {
      header: 'Next Invoicing Date',
      cell: (row) => (
        <span className="font-mono text-xs text-indigo-700 font-semibold">
          {new Date(row.nextBillingDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Recurring Amount',
      accessorKey: 'totalAmount',
      align: 'right',
      cell: (row) => <span className="font-bold text-slate-900">{formatINR(row.totalAmount)}</span>,
    },
    {
      header: 'Lifecycle Status',
      align: 'center',
      cell: (row) => <StatusBadge status={row.status} variant={row.status} />,
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSub(row);
          }}
          className="text-xs"
        >
          Manage Lifecycle
        </Button>
      ),
    },
  ];

  // Selected subscription plan policy lookup
  const selectedPlan = selectedSub ? plans.find((p) => p.id === selectedSub.planId) : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-brand-primary text-white">
              Recurring Contracts
            </span>
            <span className="text-xs text-brand-muted font-medium">Brightloop Software</span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Subscription Lifecycle &amp; State Machine
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Manage contract activations, pause transitions, renewals, and early termination rules.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-brand-border">
          {(['ALL', 'ACTIVE', 'PAUSED', 'CLOSED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status === 'ALL' ? 'All Contracts' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredSubs}
        keyExtractor={(s) => s.id}
        isLoading={isLoading}
        emptyMessage="No subscriptions found matching filter."
      />

      {/* Subscription Lifecycle Modal */}
      {selectedSub && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
          role="dialog"
        >
          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-brand-border p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-brand-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{selectedSub.subscriptionNumber}</h3>
                  <StatusBadge status={selectedSub.status} variant={selectedSub.status} />
                </div>
                <p className="text-xs text-brand-muted">
                  Customer: {selectedSub.customerName} ({selectedSub.customerEmail})
                </p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {/* Contract Snapshot Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-brand-muted block font-medium">Plan Cadence:</span>
                <span className="font-bold text-slate-900">{selectedSub.planName} ({selectedSub.billingInterval})</span>
              </div>
              <div>
                <span className="text-brand-muted block font-medium">Next Billing Date:</span>
                <span className="font-bold text-indigo-700">{new Date(selectedSub.nextBillingDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-brand-muted block font-medium">Start Date:</span>
                <span className="font-medium text-slate-800">{new Date(selectedSub.startDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-brand-muted block font-medium">Recurring Amount:</span>
                <span className="font-bold text-emerald-700">{formatINR(selectedSub.totalAmount)}</span>
              </div>
            </div>

            {/* Plan Governance Policy Inspection */}
            <div className="p-3 bg-slate-100 rounded-lg text-xs space-y-1.5 border border-slate-200">
              <span className="font-bold uppercase tracking-wider text-slate-700 block text-[10px]">
                Governing Plan Policy ({selectedPlan?.name || selectedSub.planName}):
              </span>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <span className={selectedPlan?.allowPause ? 'text-emerald-700 font-medium' : 'text-slate-400 line-through'}>
                  {selectedPlan?.allowPause ? '✔ Allow Pause' : '✖ Pause Blocked'}
                </span>
                <span className={selectedPlan?.allowEarlyClosure ? 'text-emerald-700 font-medium' : 'text-slate-400 line-through'}>
                  {selectedPlan?.allowEarlyClosure ? '✔ Early Termination' : '✖ Lock-in Term'}
                </span>
                <span className={selectedPlan?.allowRenewal ? 'text-emerald-700 font-medium' : 'text-slate-400 line-through'}>
                  {selectedPlan?.allowRenewal ? '✔ Renewal Permitted' : '✖ Renewal Blocked'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2 border-t border-brand-border">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                Permitted Lifecycle Operations
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {selectedSub.status === 'ACTIVE' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={selectedPlan ? !selectedPlan.allowPause : false}
                    title={selectedPlan && !selectedPlan.allowPause ? 'Plan policy blocks pausing' : 'Pause subscription'}
                    onClick={() => statusMutation.mutate({ id: selectedSub.id, status: 'PAUSED' })}
                  >
                    <Pause className="h-3.5 w-3.5 text-amber-600" />
                    <span>Pause Contract</span>
                  </Button>
                )}

                {selectedSub.status === 'PAUSED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => statusMutation.mutate({ id: selectedSub.id, status: 'ACTIVE' })}
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Resume Subscription</span>
                  </Button>
                )}

                {selectedSub.status !== 'CLOSED' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-1.5"
                    disabled={selectedPlan ? !selectedPlan.allowRenewal : false}
                    title={selectedPlan && !selectedPlan.allowRenewal ? 'Plan policy blocks manual renewal' : 'Renew contract'}
                    onClick={() => renewMutation.mutate(selectedSub.id)}
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-brand-primary" />
                    <span>Advance / Renew Period</span>
                  </Button>
                )}

                {selectedSub.status !== 'CLOSED' && (
                  <Button
                    variant="danger"
                    size="sm"
                    className="gap-1.5"
                    disabled={selectedPlan ? !selectedPlan.allowEarlyClosure : false}
                    title={selectedPlan && !selectedPlan.allowEarlyClosure ? 'Plan policy disallows early termination' : 'Terminate contract'}
                    onClick={() => {
                      if (window.confirm('Terminate this subscription immediately?')) {
                        statusMutation.mutate({ id: selectedSub.id, status: 'CLOSED' });
                      }
                    }}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Close Contract</span>
                  </Button>
                )}

                <Button variant="outline" size="sm" onClick={() => setSelectedSub(null)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionListPage;
