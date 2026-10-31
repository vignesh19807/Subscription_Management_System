import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { customerApi } from '@/api/customerApi';
import { planApi } from '@/api/planApi';
import { catalogApi } from '@/api/catalogApi';
import { taxApi } from '@/api/taxApi';
import { Quotation, QuotationLine } from '@/types/quotation';
import { calculateLineTotals, calculateOrderSummary } from '@/utils/financial';
import { formatINR } from '@/utils/currency';
import { FileText, Plus, Trash2, ShieldAlert } from 'lucide-react';

export interface QuotationCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quotationData: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'convertedSubscriptionId'>) => Promise<void>;
}

interface DraftLine {
  productId: string;
  variantId: string;
  quantity: number;
  discountAmount: string;
  taxRate: string;
}

export const QuotationCreateModal: React.FC<QuotationCreateModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => customerApi.getCustomers() });
  const { data: plans = [] } = useQuery({ queryKey: ['plans'], queryFn: () => planApi.getPlans() });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => catalogApi.getProducts() });
  const { data: taxes = [] } = useQuery({ queryKey: ['taxes'], queryFn: () => taxApi.getTaxes() });

  const [customerId, setCustomerId] = useState('');
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Immediate');
  const [notes, setNotes] = useState('');

  const [lines, setLines] = useState<DraftLine[]>([
    { productId: '', variantId: '', quantity: 1, discountAmount: '0.00', taxRate: '0.00' },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Set defaults when data loads
  React.useEffect(() => {
    if (customers.length > 0 && !customerId) setCustomerId(customers[0]?.id || '');
    if (plans.length > 0 && !planId) setPlanId(plans[0]?.id || '');
    if (products.length > 0 && lines[0]?.productId === '') {
      const firstProd = products[0];
      if (firstProd) {
        setLines([
          {
            productId: firstProd.id,
            variantId: firstProd.variants?.[0]?.id || '',
            quantity: 1,
            discountAmount: '0.00',
            taxRate: taxes[0]?.rate || '0.00',
          },
        ]);
      }
    }
  }, [customers, plans, products, taxes, customerId, planId, lines]);

  const handleAddLine = () => {
    const firstProd = products[0];
    setLines([
      ...lines,
      {
        productId: firstProd?.id || '',
        variantId: firstProd?.variants?.[0]?.id || '',
        quantity: 1,
        discountAmount: '0.00',
        taxRate: '0.00',
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof DraftLine, val: unknown) => {
    const updated = [...lines];
    const current = updated[index];
    if (current) {
      if (field === 'productId') {
        const prod = products.find((p) => p.id === val);
        updated[index] = {
          ...current,
          productId: String(val),
          variantId: prod?.variants?.[0]?.id || '',
        };
      } else {
        updated[index] = { ...current, [field]: val };
      }
      setLines(updated);
    }
  };

  // Calculate order summary with exact decimal math
  const calculatedLines = lines.map((l) => {
    const prod = products.find((p) => p.id === l.productId);
    const variant = prod?.variants?.find((v) => v.id === l.variantId);
    return calculateLineTotals({
      salesPrice: prod?.salesPrice || '0.00',
      variantDelta: variant?.priceDelta || '0.00',
      quantity: l.quantity,
      discountAmount: l.discountAmount,
      taxRate: l.taxRate,
    });
  });

  const orderSummary = calculateOrderSummary(calculatedLines);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const selectedCust = customers.find((c) => c.id === customerId);
    const selectedPlan = plans.find((p) => p.id === planId);

    if (!selectedCust) {
      setFormError('Please select a customer.');
      return;
    }
    if (!selectedPlan) {
      setFormError('Please select a billing plan.');
      return;
    }

    const compiledLines: QuotationLine[] = lines.map((l, idx) => {
      const prod = products.find((p) => p.id === l.productId);
      const variant = prod?.variants?.find((v) => v.id === l.variantId);
      const calc = calculatedLines[idx]!;

      return {
        id: `qline_${Date.now()}_${idx}`,
        quotationId: '',
        productId: prod?.id || '',
        productName: prod?.name || 'Product',
        variantId: variant?.id,
        variantName: variant?.variantName,
        quantity: l.quantity,
        unitPrice: calc.unitPrice.toFixed(2),
        discountAmount: calc.discountAmount.toFixed(2),
        taxRate: l.taxRate,
        lineTotal: calc.lineTotal.toFixed(2),
      };
    });

    setIsSubmitting(true);
    try {
      await onSave({
        customerId: selectedCust.id,
        customerName: selectedCust.name,
        customerEmail: selectedCust.email,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        status: 'DRAFT',
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        paymentTerms,
        notes: notes.trim(),
        lines: compiledLines,
        subtotal: orderSummary.subtotal.toFixed(2),
        discountTotal: orderSummary.discountTotal.toFixed(2),
        taxTotal: orderSummary.taxTotal.toFixed(2),
        grandTotal: orderSummary.grandTotal.toFixed(2),
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create quotation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Subscription Quotation"
      description="Compile draft quote with variant pricing, discount rules, and statutory taxes."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Target Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-brand-border bg-white px-3 py-1.5 text-xs shadow-sm focus:ring-1 focus:ring-brand-primary"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.companyName || c.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Recurring Billing Plan</label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-brand-border bg-white px-3 py-1.5 text-xs shadow-sm focus:ring-1 focus:ring-brand-primary"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.billingInterval})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <Input
            label="End Date (Optional)"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Payment Terms</label>
            <select
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="flex h-9 w-full rounded-md border border-brand-border bg-white px-3 py-1.5 text-xs shadow-sm"
            >
              <option value="Immediate">Immediate on Issue</option>
              <option value="Net 15">Net 15 Days</option>
              <option value="Net 30">Net 30 Days</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Proposal Terms &amp; Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contract validity terms, SLA expectations, payment milestones..."
            className="flex w-full rounded-md border border-brand-border bg-white px-3 py-2 text-xs shadow-sm focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        {/* Product Lines Section */}
        <div className="space-y-3 pt-2 border-t border-brand-border">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Quotation Line Items
            </h4>
            <Button variant="secondary" size="sm" type="button" onClick={handleAddLine} className="text-xs gap-1">
              <Plus className="h-3 w-3" /> Add Item
            </Button>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {lines.map((l, idx) => {
              const currentProd = products.find((p) => p.id === l.productId);
              const hasVariants = Boolean(currentProd?.variants && currentProd.variants.length > 0);
              const calc = calculatedLines[idx]!;

              return (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    {/* Product Selector */}
                    <div className="col-span-12 sm:col-span-4">
                      <select
                        value={l.productId}
                        onChange={(e) => handleLineChange(idx, 'productId', e.target.value)}
                        className="w-full h-8 rounded border border-brand-border bg-white px-2 text-xs font-medium"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatINR(p.salesPrice)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Variant Selector */}
                    <div className="col-span-12 sm:col-span-3">
                      <select
                        value={l.variantId}
                        onChange={(e) => handleLineChange(idx, 'variantId', e.target.value)}
                        disabled={!hasVariants}
                        className="w-full h-8 rounded border border-brand-border bg-white px-2 text-xs disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">No Variant Surcharge</option>
                        {currentProd?.variants?.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.variantName} (+{formatINR(v.priceDelta)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={l.quantity}
                        onChange={(e) => handleLineChange(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                        className="w-full h-8 rounded border border-brand-border bg-white px-2 text-xs text-center"
                        title="Quantity"
                      />
                    </div>

                    {/* Line Total Display */}
                    <div className="col-span-6 sm:col-span-2 text-right font-mono font-bold text-slate-900">
                      {formatINR(calc.lineTotal)}
                    </div>

                    {/* Delete button */}
                    <div className="col-span-2 sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        disabled={lines.length <= 1}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Pricing Breakdown Subtext */}
                  <div className="text-[11px] text-brand-muted flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                    <span>
                      Unit Price: <strong className="text-slate-700">{formatINR(calc.unitPrice)}</strong> ({formatINR(currentProd?.salesPrice || 0)} base + {formatINR(calc.unitPrice.minus(currentProd?.salesPrice || 0))} delta)
                    </span>
                    <span>
                      Gross: {formatINR(calc.grossAmount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Totals Summary Box */}
        <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal (Gross Line Items):</span>
            <span className="font-mono">{orderSummary.formattedSubtotal}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Discount Deductions:</span>
            <span className="font-mono text-emerald-700">-{orderSummary.formattedDiscountTotal}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Statutory Taxes:</span>
            <span className="font-mono">+{orderSummary.formattedTaxTotal}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-300 pt-1.5 mt-1.5">
            <span>Grand Contract Total:</span>
            <span className="font-mono text-brand-primary">{orderSummary.formattedGrandTotal}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
          <Button variant="outline" type="button" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" size="sm" isLoading={isSubmitting} className="gap-1.5">
            <FileText className="h-4 w-4" />
            <span>Generate Quotation</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
