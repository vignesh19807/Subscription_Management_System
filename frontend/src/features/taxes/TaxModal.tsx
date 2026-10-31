import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TaxRule, TaxType } from '@/types/tax';
import { toDecimal } from '@/utils/currency';
import { Percent, ShieldAlert } from 'lucide-react';

export interface TaxModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxToEdit?: TaxRule | null;
  onSave: (tax: Omit<TaxRule, 'id' | 'createdAt'>) => Promise<void>;
}

export const TaxModal: React.FC<TaxModalProps> = ({
  isOpen,
  onClose,
  taxToEdit,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [rate, setRate] = useState('18.00');
  const [taxType, setTaxType] = useState<TaxType>('PERCENTAGE');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (taxToEdit) {
      setName(taxToEdit.name);
      setRate(taxToEdit.rate);
      setTaxType(taxToEdit.taxType);
      setDescription(taxToEdit.description || '');
      setIsActive(taxToEdit.isActive);
    } else {
      setName('');
      setRate('18.00');
      setTaxType('PERCENTAGE');
      setDescription('');
      setIsActive(true);
    }
    setFormError(null);
  }, [taxToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Tax rule name is required.');
      return;
    }

    const rateDec = toDecimal(rate);
    if (rateDec.lt(0) || rateDec.gt(100)) {
      setFormError('Tax percentage must be between 0.00% and 100.00%.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: trimmedName,
        rate: rateDec.toFixed(2),
        taxType,
        description: description.trim(),
        isActive,
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save tax rule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taxToEdit ? 'Edit Tax Rate Rule' : 'New Tax Rule'}
      description="Define sales tax, GST, or VAT rates applied to invoices and quotations."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <Input
          label="Tax Name / Label"
          placeholder="e.g. GST @ 18%"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Tax Rate (%)"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            helperText={`${rate}% applied on taxable line total`}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Tax Type</label>
            <select
              value={taxType}
              onChange={(e) => setTaxType(e.target.value as TaxType)}
              className="flex h-9 w-full rounded-md border border-brand-border bg-white px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Jurisdiction / Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Interstate IGST, State VAT, or Export Exemption..."
            className="flex w-full rounded-md border border-brand-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isTaxActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded text-brand-primary focus:ring-brand-primary"
          />
          <label htmlFor="isTaxActive" className="text-xs font-medium text-slate-700">
            Rule Active (Available in Invoice line calculation)
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
          <Button variant="outline" type="button" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" size="sm" isLoading={isSubmitting} className="gap-1.5">
            <Percent className="h-4 w-4" />
            <span>{taxToEdit ? 'Save Changes' : 'Create Tax Rule'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};

