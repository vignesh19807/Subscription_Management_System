import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DiscountRule, DiscountType, DiscountScope } from '@/types/discount';
import { toDecimal, formatINR } from '@/utils/currency';
import { Tag, ShieldAlert } from 'lucide-react';

export interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  discountToEdit?: DiscountRule | null;
  onSave: (discount: Omit<DiscountRule, 'id' | 'createdAt' | 'currentUsageCount'>) => Promise<void>;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({
  isOpen,
  onClose,
  discountToEdit,
  onSave,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [value, setValue] = useState('10.00');
  const [minOrderAmount, setMinOrderAmount] = useState('0.00');
  const [minQuantity, setMinQuantity] = useState(1);
  const [validFrom, setValidFrom] = useState(new Date().toISOString().substring(0, 10));
  const [validUntil, setValidUntil] = useState('');
  const [maxUsageCount, setMaxUsageCount] = useState(100);
  const [scope, setScope] = useState<DiscountScope>('SUBSCRIPTION');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (discountToEdit) {
      setCode(discountToEdit.code);
      setName(discountToEdit.name);
      setDiscountType(discountToEdit.discountType);
      setValue(discountToEdit.value);
      setMinOrderAmount(discountToEdit.minOrderAmount);
      setMinQuantity(discountToEdit.minQuantity);
      setValidFrom(discountToEdit.validFrom.substring(0, 10));
      setValidUntil(discountToEdit.validUntil ? discountToEdit.validUntil.substring(0, 10) : '');
      setMaxUsageCount(discountToEdit.maxUsageCount);
      setScope(discountToEdit.scope);
      setIsActive(discountToEdit.isActive);
    } else {
      setCode('');
      setName('');
      setDiscountType('PERCENTAGE');
      setValue('10.00');
      setMinOrderAmount('0.00');
      setMinQuantity(1);
      setValidFrom(new Date().toISOString().substring(0, 10));
      setValidUntil('');
      setMaxUsageCount(100);
      setScope('SUBSCRIPTION');
      setIsActive(true);
    }
    setFormError(null);
  }, [discountToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedCode || !trimmedName) {
      setFormError('Coupon code and campaign name are required.');
      return;
    }

    const valDec = toDecimal(value);
    if (valDec.lte(0)) {
      setFormError('Discount value must be greater than zero.');
      return;
    }

    if (discountType === 'PERCENTAGE' && valDec.gt(100)) {
      setFormError('Percentage discount cannot exceed 100%.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        code: trimmedCode,
        name: trimmedName,
        discountType,
        value: valDec.toFixed(2),
        minOrderAmount: toDecimal(minOrderAmount).toFixed(2),
        minQuantity: Number(minQuantity) || 1,
        validFrom: new Date(validFrom).toISOString(),
        validUntil: validUntil ? new Date(validUntil).toISOString() : null,
        maxUsageCount: Number(maxUsageCount) || 100,
        scope,
        isActive,
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save discount rule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={discountToEdit ? 'Edit Promotional Discount' : 'New Discount Rule'}
      description="Define conditional vouchers with caps, thresholds, and exact decimal arithmetic."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Promo Coupon Code"
            placeholder="e.g. WELCOME10"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
          />
          <Input
            label="Campaign Label"
            placeholder="e.g. New Customer Welcome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Discount Calculation</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as DiscountType)}
              className="flex h-9 w-full rounded-md border border-brand-border bg-white px-3 py-1.5 text-xs shadow-sm"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount (₹)</option>
            </select>
          </div>

          <Input
            label={discountType === 'PERCENTAGE' ? 'Value (%)' : 'Fixed Amount (₹)'}
            type="number"
            step="0.01"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            helperText={discountType === 'PERCENTAGE' ? `${value}% off gross` : formatINR(value || 0)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Application Scope</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as DiscountScope)}
              className="flex h-9 w-full rounded-md border border-brand-border bg-white px-3 py-1.5 text-xs shadow-sm"
            >
              <option value="SUBSCRIPTION">Whole Subscription Scope</option>
              <option value="PRODUCT">Specific Product Scope</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Minimum Order Amount (₹)"
            type="number"
            step="0.01"
            min="0"
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
            helperText="Order threshold required to unlock"
          />
          <Input
            label="Maximum Usage Limit (Redemptions)"
            type="number"
            min="1"
            value={maxUsageCount}
            onChange={(e) => setMaxUsageCount(Number(e.target.value))}
            helperText="Total redemption capacity cap"
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
            helperText="Leave empty for no expiry"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isDiscountActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded text-brand-primary focus:ring-brand-primary"
          />
          <label htmlFor="isDiscountActive" className="text-xs font-medium text-slate-700">
            Activate Coupon for Quotation Line Item Discounts
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
          <Button variant="outline" type="button" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" size="sm" isLoading={isSubmitting} className="gap-1.5">
            <Tag className="h-4 w-4" />
            <span>{discountToEdit ? 'Save Changes' : 'Create Discount'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};

