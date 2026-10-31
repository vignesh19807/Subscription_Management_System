import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Product, ProductVariant } from '@/types/catalog';
import { toDecimal, formatINR, addCurrency } from '@/utils/currency';
import { Layers, Plus, ShieldAlert } from 'lucide-react';

export interface VariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAddVariant: (productId: string, variant: Omit<ProductVariant, 'id' | 'productId'>) => Promise<void>;
}

export const VariantModal: React.FC<VariantModalProps> = ({
  isOpen,
  onClose,
  product,
  onAddVariant,
}) => {
  const [variantName, setVariantName] = useState('');
  const [priceDelta, setPriceDelta] = useState('560.00'); // Default ₹560 for Odoo surcharge benchmark
  const [sku, setSku] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!product) return null;

  const baseSalesPrice = toDecimal(product.salesPrice);
  const deltaDecimal = toDecimal(priceDelta || 0);
  const calculatedUnitPrice = baseSalesPrice.plus(deltaDecimal);

  const handleBenchmarkPreset = () => {
    setVariantName('Odoo Enterprise Surcharge');
    setPriceDelta('560.00');
    setSku(`VAR-ODOO-${Date.now().toString().slice(-4)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = variantName.trim();
    if (!trimmedName) {
      setFormError('Variant title is required.');
      return;
    }

    if (calculatedUnitPrice.lt(0)) {
      setFormError('Calculated unit price cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddVariant(product.id, {
        variantName: trimmedName,
        priceDelta: deltaDecimal.toFixed(2),
        sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      });
      setVariantName('');
      setPriceDelta('560.00');
      setSku('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to attach variant.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Product Variants: ${product.name}`}
      description={`Base Sales Price: ${formatINR(product.salesPrice)}. Add multi-attribute surcharges and price deltas.`}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Existing Variants List */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Configured Variants ({product.variants?.length || 0})
          </h4>

          {(!product.variants || product.variants.length === 0) ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-brand-muted text-center">
              No variant surcharges attached. Standard base sales price applies.
            </div>
          ) : (
            <div className="divide-y divide-brand-border border border-brand-border rounded-lg overflow-hidden bg-white">
              {product.variants.map((v) => {
                const finalPrice = addCurrency(product.salesPrice, v.priceDelta);
                return (
                  <div key={v.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/60">
                    <div>
                      <span className="font-bold text-slate-900 block">{v.variantName}</span>
                      <span className="font-mono text-[11px] text-brand-muted">SKU: {v.sku}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-brand-primary font-semibold block">
                        Delta: +{formatINR(v.priceDelta)}
                      </span>
                      <span className="font-bold text-slate-900">
                        Final Unit Price: {formatINR(finalPrice)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Variant Form */}
        <form onSubmit={handleSubmit} className="border-t border-brand-border pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5 text-brand-primary" /> Add New Variant Delta
            </h4>
            <button
              type="button"
              onClick={handleBenchmarkPreset}
              className="text-[11px] font-semibold text-brand-primary hover:underline"
            >
              Apply Benchmark Preset (Odoo +₹560)
            </button>
          </div>

          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Variant Title / Option"
              placeholder="e.g. Odoo Enterprise Surcharge"
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              required
            />
            <Input
              label="SKU Identifier"
              placeholder="e.g. LOOP-VAR-ODOO-560"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <Input
              label="Price Delta (₹) [Positive or Negative]"
              type="number"
              step="0.01"
              value={priceDelta}
              onChange={(e) => setPriceDelta(e.target.value)}
              helperText={`Price Surcharge: +${formatINR(priceDelta || 0)}`}
              required
            />

            {/* Authoritative Formula Real-Time Preview */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs space-y-1">
              <span className="font-semibold text-indigo-900 block">
                Authoritative Calculated Unit Price:
              </span>
              <div className="font-mono text-base font-bold text-indigo-700">
                {formatINR(calculatedUnitPrice)}
              </div>
              <p className="text-[10px] text-indigo-600">
                Formula: {formatINR(product.salesPrice)} (Base) + {formatINR(priceDelta || 0)} (Delta)
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
            <Button variant="outline" type="button" size="sm" onClick={onClose} disabled={isSubmitting}>
              Close
            </Button>
            <Button variant="primary" type="submit" size="sm" isLoading={isSubmitting} className="gap-1.5">
              <Layers className="h-4 w-4" />
              <span>Save Variant</span>
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

