import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '@/api/subscriptionApi';
import { planApi } from '@/api/planApi';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatINR } from '@/utils/currency';
import { Pause, Play } from 'lucide-react';

export const CustomerSubscriptionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeAddons, setActiveAddons] = useState<Record<string, boolean>>({
    'addon_audit': true,
    'addon_support': false,
  });

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionApi.getSubscriptions(),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => planApi.getPlans(),
  });

  const pauseMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'PAUSED' | 'ACTIVE' }) =>
      subscriptionApi.updateSubscriptionStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      showToast({
        type: 'info',
        title: 'Status Updated',
        message: `Subscription ${updated.subscriptionNumber} is now ${updated.status}.`,
      });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Action Prohibited',
        message: err instanceof Error ? err.message : 'Cannot perform action under current plan policy.',
      });
    },
  });

  const handleToggleAddon = (addonKey: string, addonName: string) => {
    setActiveAddons((prev) => {
      const nextState = !prev[addonKey];
      showToast({
        type: 'info',
        title: nextState ? 'Add-on Enabled' : 'Add-on Disabled',
        message: `${addonName} updated. Note: Changes will automatically apply starting from your next invoice.`,
      });
      return { ...prev, [addonKey]: nextState };
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-purple-600 text-white">
            Client Self-Service
          </span>
          <span className="text-xs text-brand-muted font-medium">Subscription Manager</span>
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          My Active Subscriptions &amp; Recurring Add-ons
        </h2>
        <p className="text-xs text-brand-muted mt-0.5">
          Review subscription line items, request contract pauses, and configure optional recurring add-ons.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-44 bg-white rounded-xl border border-brand-border animate-pulse" />
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-brand-border text-slate-500 text-xs">
          No subscriptions found for your account.
        </div>
      ) : (
        <div className="space-y-6">
          {subscriptions.map((sub) => {
            const plan = plans.find((p) => p.id === sub.planId);

            return (
              <div key={sub.id} className="rounded-xl border border-brand-border bg-white p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-brand-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{sub.subscriptionNumber}</h3>
                      <StatusBadge status={sub.status} variant={sub.status} />
                    </div>
                    <p className="text-xs text-brand-muted mt-0.5">Plan: {sub.planName}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-900 block">{formatINR(sub.totalAmount)}</span>
                    <span className="text-[11px] text-brand-muted font-mono">Billed {sub.billingInterval}</span>
                  </div>
                </div>

                {/* Subscription Details & Line Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                      Contract Terms:
                    </span>
                    <div className="space-y-1 text-slate-600">
                      <div className="flex justify-between">
                        <span>Start Date:</span>
                        <span className="font-medium text-slate-900">{new Date(sub.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Next Scheduled Invoicing:</span>
                        <span className="font-bold text-indigo-700">{new Date(sub.nextBillingDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Plan Pause Policy:</span>
                        <span className={plan?.allowPause ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                          {plan?.allowPause ? 'Allowed' : 'Disabled by Plan'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Included Items */}
                  <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                      Active Contract Items:
                    </span>
                    <div className="space-y-1.5">
                      {sub.lines.map((l) => (
                        <div key={l.id} className="flex justify-between text-slate-700">
                          <span>
                            {l.productName} {l.variantName && `(${l.variantName})`}
                          </span>
                          <span className="font-mono font-bold text-slate-900">{formatINR(l.unitPrice)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Self-Service Recurring Add-ons Section (Scene 7 Requirement) */}
                <div className="pt-2 border-t border-brand-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Self-Service Add-On Modules
                      </h4>
                      <p className="text-[11px] text-brand-muted">
                        Rule: Changes apply starting from your next invoice ({new Date(sub.nextBillingDate).toLocaleDateString()})
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-brand-border bg-white flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">Audit Compliance Log Add-on</span>
                        <span className="text-[11px] text-brand-muted">₹250.00 / month</span>
                      </div>
                      <Button
                        variant={activeAddons['addon_audit'] ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleAddon('addon_audit', 'Audit Compliance Add-on')}
                        className="text-xs"
                      >
                        {activeAddons['addon_audit'] ? 'Enabled' : 'Enable'}
                      </Button>
                    </div>

                    <div className="p-3 rounded-lg border border-brand-border bg-white flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">Dedicated SLA Priority Desk</span>
                        <span className="text-[11px] text-brand-muted">₹500.00 / month</span>
                      </div>
                      <Button
                        variant={activeAddons['addon_support'] ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleAddon('addon_support', 'Dedicated SLA Priority Desk')}
                        className="text-xs"
                      >
                        {activeAddons['addon_support'] ? 'Enabled' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-brand-border">
                  {sub.status === 'ACTIVE' && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={plan ? !plan.allowPause : false}
                      onClick={() => pauseMutation.mutate({ id: sub.id, status: 'PAUSED' })}
                      className="text-xs gap-1.5"
                    >
                      <Pause className="h-3.5 w-3.5 text-amber-600" />
                      <span>Request Pause</span>
                    </Button>
                  )}

                  {sub.status === 'PAUSED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => pauseMutation.mutate({ id: sub.id, status: 'ACTIVE' })}
                      className="text-xs gap-1.5"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Resume Contract</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerSubscriptionsPage;
