import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { invoiceApi, BillingRunResult } from '@/api/invoiceApi';
import { useToast } from '@/components/ui/Toast';
import { formatINR } from '@/utils/currency';
import { PlayCircle, AlertCircle, Zap } from 'lucide-react';

export interface BillingWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BillingWorkspaceModal: React.FC<BillingWorkspaceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [targetDate, setTargetDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [dryRunResult, setDryRunResult] = useState<BillingRunResult | null>(null);

  const dryRunMutation = useMutation({
    mutationFn: (date: string) => invoiceApi.dryRunBilling(date),
    onSuccess: (result) => {
      setDryRunResult(result);
      showToast({
        type: 'info',
        title: 'Dry-Run Simulation Complete',
        message: `Projected ${result.invoicesGenerated} invoice(s). Zero records altered.`,
      });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Simulation Failed',
        message: err instanceof Error ? err.message : 'Error simulating billing run',
      });
    },
  });

  const executeMutation = useMutation({
    mutationFn: (date: string) => invoiceApi.executeBilling(date),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['outbox'] });

      showToast({
        type: 'success',
        title: 'Billing Execution Complete',
        message: `Generated ${result.invoicesGenerated} live invoice(s) (Skipped ${result.skippedCount} duplicate/ineligible).`,
      });
      onClose();
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Execution Failed',
        message: err instanceof Error ? err.message : 'Error generating invoices',
      });
    },
  });

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    dryRunMutation.mutate(targetDate);
  };

  const handleRealExecute = () => {
    if (window.confirm(`Confirm real billing execution for target date ${targetDate}? Invoices will be generated and dispatched.`)) {
      executeMutation.mutate(targetDate);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Automated Billing Engine &amp; Dry-Run Workspace"
      description="Simulate recurring invoice generation or commit real idempotent billing runs."
      maxWidth="xl"
    >
      <div className="space-y-5">
        {/* Date Selector Form */}
        <form onSubmit={handleSimulate} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <Input
                label="Target Billing Date"
                type="date"
                value={targetDate}
                onChange={(e) => {
                  setTargetDate(e.target.value);
                  setDryRunResult(null);
                }}
                helperText="Subscriptions with next billing date on or before this date are eligible"
                required
              />
            </div>
            <Button
              variant="outline"
              type="submit"
              size="md"
              isLoading={dryRunMutation.isPending}
              className="gap-1.5 h-9"
            >
              <PlayCircle className="h-4 w-4 text-brand-primary" />
              <span>Simulate Dry-Run (Preview)</span>
            </Button>
          </div>
        </form>

        {/* Dry-Run Simulation Results View */}
        {dryRunResult && (
          <div className="space-y-4 animate-in fade-in">
            {/* Warning banner ensuring user understands dry-run isolation */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-900">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Simulation Mode Active (Zero Writes):</span>
                <span>
                  The following results are purely calculated in-memory. No invoices have been persisted to the database.
                </span>
              </div>
            </div>

            {/* Projected Summary Statistics */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-brand-border">
                <span className="text-brand-muted block font-medium">Eligible Subscriptions:</span>
                <span className="text-lg font-bold text-slate-900">{dryRunResult.totalEligible}</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-brand-border">
                <span className="text-brand-muted block font-medium">Invoices to Create:</span>
                <span className="text-lg font-bold text-indigo-700">{dryRunResult.invoicesGenerated}</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-brand-border">
                <span className="text-brand-muted block font-medium">Projected Revenue:</span>
                <span className="text-lg font-bold text-emerald-700">
                  {formatINR(dryRunResult.simulatedSummary?.totalRevenueProjected || '0.00')}
                </span>
              </div>
            </div>

            {/* List of Simulated Invoices */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Projected Billing Manifest:
              </h4>

              {dryRunResult.invoices.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-center">
                  No subscriptions currently due for renewal on or before {targetDate}.
                </div>
              ) : (
                <div className="divide-y divide-brand-border border border-brand-border rounded-lg max-h-48 overflow-y-auto bg-white">
                  {dryRunResult.invoices.map((inv) => (
                    <div key={inv.id} className="p-3 text-xs flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-900 block">{inv.invoiceNumber} (Draft Preview)</span>
                        <span className="text-[11px] text-slate-600">Client: {inv.customerName}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 block">{formatINR(inv.totalAmount)}</span>
                        <span className="text-[10px] text-brand-muted">Due: {inv.dueDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Real Execution Section */}
            {dryRunResult.invoices.length > 0 && (
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-950 block">Ready to Commit Billing Run?</span>
                  <span className="text-[11px] text-indigo-700">
                    Idempotency composite constraint guarantees duplicate invoices will never be generated.
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleRealExecute}
                  isLoading={executeMutation.isPending}
                  className="gap-1.5 shadow-md bg-indigo-600 hover:bg-indigo-700"
                >
                  <Zap className="h-4 w-4" />
                  <span>Execute Real Billing</span>
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-brand-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
