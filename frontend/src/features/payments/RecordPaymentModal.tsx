import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { invoiceApi } from '@/api/invoiceApi';
import { RecordPaymentInput } from '@/api/paymentApi';
import { PaymentMethod } from '@/types/payment';
import { toDecimal, subtractCurrency, formatINR } from '@/utils/currency';
import { CreditCard, ShieldAlert } from 'lucide-react';

export interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecord: (data: RecordPaymentInput) => Promise<void>;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onRecord,
}) => {
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoiceApi.getInvoices(),
  });

  const unpaidInvoices = invoices.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED');

  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [referenceNote, setReferenceNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().substring(0, 10)
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Set default invoice
  React.useEffect(() => {
    if (unpaidInvoices.length > 0 && !invoiceId) {
      const first = unpaidInvoices[0];
      if (first) {
        setInvoiceId(first.id);
        const bal = subtractCurrency(first.totalAmount, first.amountPaid || 0);
        setAmount(bal.toFixed(2));
      }
    }
  }, [unpaidInvoices, invoiceId]);

  const selectedInvoice = invoices.find((i) => i.id === invoiceId);
  const remainingBalance = selectedInvoice
    ? subtractCurrency(selectedInvoice.totalAmount, selectedInvoice.amountPaid || 0)
    : toDecimal(0);

  const handleInvoiceChange = (id: string) => {
    setInvoiceId(id);
    const inv = invoices.find((i) => i.id === id);
    if (inv) {
      const bal = subtractCurrency(inv.totalAmount, inv.amountPaid || 0);
      setAmount(bal.toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedInvoice) {
      setFormError('Please select a valid invoice.');
      return;
    }

    const payDec = toDecimal(amount);

    if (payDec.lte(0)) {
      setFormError('Payment amount must be greater than zero.');
      return;
    }

    // BUSINESS RULE: A payment cannot exceed the outstanding invoice balance
    if (payDec.gt(remainingBalance)) {
      setFormError(
        `Payment amount (${formatINR(payDec)}) exceeds outstanding balance of ${formatINR(remainingBalance)}.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onRecord({
        invoiceId: selectedInvoice.id,
        amount: payDec.toFixed(2),
        paymentMethod,
        referenceNote: referenceNote.trim() || 'Direct settlement',
        paymentDate: new Date(paymentDate).toISOString(),
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment Settlement"
      description="Attach an auditable multi-channel payment receipt against an outstanding invoice."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Target Unsettled Invoice</label>
          <select
            value={invoiceId}
            onChange={(e) => handleInvoiceChange(e.target.value)}
            className="flex h-9 w-full rounded-md border border-brand-border bg-white px-3 py-1.5 text-xs shadow-sm"
          >
            {unpaidInvoices.map((inv) => {
              const bal = subtractCurrency(inv.totalAmount, inv.amountPaid || 0);
              return (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {inv.customerName} (Bal: {formatINR(bal)})
                </option>
              );
            })}
          </select>
        </div>

        {selectedInvoice && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Invoice Total:</span>
              <span className="font-mono">{formatINR(selectedInvoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Already Remitted:</span>
              <span className="font-mono">{formatINR(selectedInvoice.amountPaid || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1">
              <span>Current Outstanding Balance:</span>
              <span className="font-mono text-rose-600">{formatINR(remainingBalance)}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Payment Amount (₹)"
            type="number"
            step="0.01"
            min="0.01"
            max={remainingBalance.toString()}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            helperText={`Max allowed: ${formatINR(remainingBalance)}`}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Payment Channel</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="flex h-9 w-full rounded-md border border-brand-border bg-white px-3 py-1.5 text-xs shadow-sm"
            >
              <option value="UPI">UPI / Instant Transfer</option>
              <option value="BANK_TRANSFER">Bank Wire / NEFT / IMPS</option>
              <option value="CARD">Debit / Credit Card</option>
              <option value="CASH">Cash Deposit</option>
              <option value="CHEQUE">Bank Cheque</option>
            </select>
          </div>
        </div>

        <Input
          label="Settlement Date"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          required
        />

        <Input
          label="Reference Note / Transaction ID"
          placeholder="e.g. UPI/REF/2984918237 or Cheque #102938"
          value={referenceNote}
          onChange={(e) => setReferenceNote(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
          <Button variant="outline" type="button" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" size="sm" isLoading={isSubmitting} className="gap-1.5">
            <CreditCard className="h-4 w-4" />
            <span>Commit Payment</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
