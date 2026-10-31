import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Product, ProductType } from '@/types/catalog';
import { toDecimal, formatINR } from '@/utils/currency';
import { Package, ShieldAlert } from 'lucide-react';

export interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSave: (productData: Omit<Product, 'id'>) => Promise<void>;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [productType, setProductType] = useState<ProductType>('SOFTWARE');
  const [salesPrice, setSalesPrice] = useState('1000.00');
  const [costPrice, setCostPrice] = useState('400.00');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setProductType(productToEdit.productType);
      setSalesPrice(productToEdit.salesPrice);
      setCostPrice(productToEdit.costPrice);
      setNotes(productToEdit.notes || '');
      setIsActive(productToEdit.isActive);
    } else {
      setName('');
      setProductType('SOFTWARE');
      setSalesPrice('1000.00');
      setCostPrice('400.00');
      setNotes('');
      setIsActive(true);
    }
    setFormError(null);
  }, [productToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Product title is required.');
      return;
    }

    const sPrice = toDecimal(salesPrice);
    const cPrice = toDecimal(costPrice);

    if (sPrice.lte(0)) {
      setFormError('Sales price must be greater than zero.');
      return;
    }

    if (cPrice.lt(0)) {
      setFormError('Cost price cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: trimmedName,
        productType,
        salesPrice: sPrice.toFixed(2),
        costPrice: cPrice.toFixed(2),
        notes: notes.trim(),
        isActive,
        variants: productToEdit?.variants || [],
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'Edit Catalog Product' : 'Add New Product'}
      description="Define subscription software, hardware, or services with sales and cost pricing."
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
          label="Product Name"
          placeholder="e.g. LoopBill Enterprise Cloud"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Product Classification</label>
          <select
            value={productType}
            onChange={(e) => setProductType(e.target.value as ProductType)}
            className="flex h-9 w-full rounded-md border border-brand-border bg-white px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
          >
            <option value="SOFTWARE">Software (License / SaaS)</option>
            <option value="SERVICE">Service (Consulting / SLA Support)</option>
            <option value="HARDWARE">Hardware (Tangible Asset)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Base Sales Price (₹)"
            type="number"
            step="0.01"
            min="0"
            value={salesPrice}
            onChange={(e) => setSalesPrice(e.target.value)}
            helperText={`Formatted: ${formatINR(salesPrice || 0)}`}
            required
          />
          <Input
            label="Internal Cost Price (₹)"
            type="number"
            step="0.01"
            min="0"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            helperText={`Formatted: ${formatINR(costPrice || 0)}`}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Internal Operational Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Licensing terms, provision steps, warranty details..."
            className="flex w-full rounded-md border border-brand-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isActiveProduct"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
          />
          <label htmlFor="isActiveProduct" className="text-xs font-medium text-slate-700">
            Publish as Active in Product Catalog
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
          <Button variant="outline" type="button" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" size="sm" isLoading={isSubmitting} className="gap-1.5">
            <Package className="h-4 w-4" />
            <span>{productToEdit ? 'Save Changes' : 'Create Product'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
