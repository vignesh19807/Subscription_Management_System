import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi, RecordPaymentInput } from '@/api/paymentApi';
import { Payment, PaymentMethod } from '@/types/payment';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RecordPaymentModal } from './RecordPaymentModal';
import { useToast } from '@/components/ui/Toast';
import { formatINR } from '@/utils/currency';
import { Plus, Search, Calendar, FileText } from 'lucide-react';

export const PaymentListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentApi.getPayments(),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data: RecordPaymentInput) => paymentApi.recordPayment(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });

      showToast({
        type: 'success',
        title: 'Payment Recorded',
        message: `Settled ${formatINR(data.payment.amount)} for invoice ${data.payment.invoiceNumber}. Invoice is now ${data.invoice.status}.`,
      });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Payment Rejected',
        message: err instanceof Error ? err.message : 'Could not record payment',
      });
    },
  });

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.referenceNote && p.referenceNote.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const columns: Column<Payment>[] = [
    {
      header: 'Settlement Date',
      cell: (row) => (
        <span className="font-mono text-xs text-slate-700 flex items-center gap-1">
          <Calendar className="h-3 w-3 text-slate-400" />
          {new Date(row.paymentDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Invoice Reference',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-brand-primary" />
          <span className="font-mono font-bold text-slate-900">{row.invoiceNumber}</span>
        </div>
      ),
    },
    {
      header: 'Customer',
      cell: (row) => <span className="font-semibold text-slate-900">{row.customerName}</span>,
    },
    {
      header: 'Payment Channel',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs border border-slate-200">
          {row.paymentMethod}
        </span>
      ),
    },
    {
      header: 'Reference Note',
      cell: (row) => (
        <span className="text-xs text-brand-muted truncate max-w-xs block font-mono">
          {row.referenceNote || 'Direct Settlement'}
        </span>
      ),
    },
    {
      header: 'Amount Settled',
      accessorKey: 'amount',
      align: 'right',
      cell: (row) => (
        <span className="font-mono font-bold text-emerald-700 text-sm">
          {formatINR(row.amount)}
        </span>
      ),
    },
    {
      header: 'Status',
      align: 'center',
      cell: (row) => (
        <StatusBadge status={row.status} variant={row.status} />
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-brand-primary text-white">
              Ledger
            </span>
            <span className="text-xs text-brand-muted font-medium">Brightloop Software</span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Payment Receipts &amp; Balance Reconciliation
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Internal payment ledger tracking UPI, Bank wires, cards, and cash settlements with balance capping rules.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Record Payment</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-brand-border shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Search invoice #, customer, reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'UPI', 'BANK_TRANSFER', 'CARD', 'CASH', 'CHEQUE'] as const).map((method) => (
            <button
              key={method}
              onClick={() => setMethodFilter(method)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                methodFilter === method
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {method === 'ALL' ? 'All Channels' : method}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredPayments}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        emptyMessage="No payment records found."
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRecord={async (data) => {
          await recordPaymentMutation.mutateAsync(data);
        }}
      />
    </div>
  );
};

export default PaymentListPage;
