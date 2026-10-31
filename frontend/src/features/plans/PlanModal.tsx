import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BillingPlan, BillingInterval } from '@/types/plan';
import { CalendarClock, ShieldAlert } from 'lucide-react';

export interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  planToEdit?: BillingPlan | null;
  onSave: (plan: Omit<BillingPlan, 'id'>) => Promise<void>;
}

export const PlanModal: React.FC<PlanModalProps> = ({
  isOpen,
  onClose,
  planToEdit,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('MONTHLY');
  const [intervalCount, setIntervalCount] = useState(1);
  const [minQuantity, setMinQuantity] = useState(1);
  const [validFrom, setValidFrom] = useState(new Date().toISOString().substring(0, 10));
  const [validUntil, setValidUntil] = useState('');
  const [autoClose, setAutoClose] = useState(false);
  const [allowEarlyClosure, setAllowEarlyClosure] = useState(true);
  const [allowPause, setAllowPause] = useState(true);
  const [allowRenewal, setAllowRenewal] = useState(true);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (planToEdit) {
      setName(planToEdit.name);
      setBillingInterval(planToEdit.billingInterval);
      setIntervalCount(planToEdit.intervalCount);
      setMinQuantity(planToEdit.minQuantity);
      setValidFrom(planToEdit.validFrom.substring(0, 10));
      setValidUntil(planToEdit.validUntil ? planToEdit.validUntil.substring(0, 10) : '');
      setAutoClose(planToEdit.autoClose);
      setAllowEarlyClosure(planToEdit.allowEarlyClosure);
      setAllowPause(planToEdit.allowPause);
      setAllowRenewal(planToEdit.allowRenewal);
      setDescription(planToEdit.description || '');
      setIsActive(planToEdit.isActive);
    } else {
      setName('');
      setBillingInterval('MONTHLY');
      setIntervalCount(1);
      setMinQuantity(1);
      setValidFrom(new Date().toISOString().substring(0, 10));
      setValidUntil('');
      setAutoClose(false);
      setAllowEarlyClosure(true);
      setAllowPause(true);
      setAllowRenewal(true);
      setDescription('');
      setIsActive(true);
    }
    setFormError(null);
  }, [planToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Plan title is required.');
      return;
    }

    if (minQuantity < 1) {
      setFormError('Minimum quantity must be at least 1.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: trimmedName,
        billingInterval,
        intervalCount: Number(intervalCount) || 1,
        minQuantity: Number(minQuantity) || 1,
        validFrom: new Date(validFrom).toISOString(),
        validUntil: validUntil ? new Date(validUntil).toISOString() : null,
        autoClose,
        allowEarlyClosure,
        allowPause,
        allowRenewal,
        description: description.trim(),
        isActive,
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save billing plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={planToEdit ? 'Edit Billing Plan' : 'Define Billing Plan'}
      description="Configure recurring cycle cadence and customer self-service governance flags."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <Input
          label="Plan Name"
          placeholder="e.g. Standard Monthly Cloud"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Billing Cadence</label>
            <select
              value={billingInterval}
              onChange={(e) => setBillingInterval(e.target.value as BillingInterval)}
              className="flex h-9 w-full rounded-md border border-brand-border bg-white px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>

          <Input
            label="Interval Multiplier"
            type="number"
            min="1"
            value={intervalCount}
            onChange={(e) => setIntervalCount(Number(e.target.value))}
            helperText="e.g. 1 = every month"
            required
          />

          <Input
            label="Minimum Commitment Qty"
            type="number"
            min="1"
            value={minQuantity}
            onChange={(e) => setMinQuantity(Number(e.target.value))}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Valid From"
            type="date"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            required
          />
          <Input
            label="Valid Until (Optional)"
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            helperText="Leave empty for indefinite plan validity"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Plan Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contract terms, SLA level, commitment period details..."
            className="flex w-full rounded-md border border-brand-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
          />
        </div>

        {/* Governance Flags Matrix */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900 block">
            Plan Policy &amp; Governance Flags
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowPause}
                onChange={(e) => setAllowPause(e.target.checked)}
                className="h-4 w-4 rounded text-brand-primary focus:ring-brand-primary"
              />
              <span className="font-medium text-slate-700">Allow Pausing Subscriptions</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowEarlyClosure}
                onChange={(e) => setAllowEarlyClosure(e.target.checked)}
                className="h-4 w-4 rounded text-brand-primary focus:ring-brand-primary"
              />
              <span className="font-medium text-slate-700">Allow Early Termination</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowRenewal}
                onChange={(e) => setAllowRenewal(e.target.checked)}
                className="h-4 w-4 rounded text-brand-primary focus:ring-brand-primary"
              />
              <span className="font-medium text-slate-700">Allow Manual / Self Renewal</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoClose}
                onChange={(e) => setAutoClose(e.target.checked)}
                className="h-4 w-4 rounded text-brand-primary focus:ring-brand-primary"
              />
              <span className="font-medium text-slate-700">Auto-Close on Term Completion</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPlanActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded text-brand-primary focus:ring-brand-primary"
          />
          <label htmlFor="isPlanActive" className="text-xs font-medium text-slate-700">
            Publish as Active Plan (Available for Quotations &amp; Subscriptions)
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
          <Button variant="outline" type="button" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" size="sm" isLoading={isSubmitting} className="gap-1.5">
            <CalendarClock className="h-4 w-4" />
            <span>{planToEdit ? 'Save Changes' : 'Create Plan'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
