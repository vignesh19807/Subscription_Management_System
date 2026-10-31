import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceApi } from '@/api/invoiceApi';
import { Invoice } from '@/types/invoice';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BillingWorkspaceModal } from '@/features/billing/BillingWorkspaceModal';
import { useToast } from '@/components/ui/Toast';
import { toDecimal, subtractCurrency, formatINR } from '@/utils/currency';
import {
  Search,
  PlayCircle,
  Printer,
  CheckCircle,
  Calendar,
} from 'lucide-react';

export const InvoiceListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'CONFIRMED' | 'PAID' | 'OVERDUE'>('ALL');
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoiceApi.getInvoices(),
  });

  const confirmInvoiceMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.confirmInvoice(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      showToast({
        type: 'success',
        title: 'Invoice Confirmed',
        message: `${updated.invoiceNumber} is now official and open for settlement.`,
      });
      setSelectedInvoice(updated);
    },
  });

  const now = new Date();

  const filteredInvoices = invoices.filter((inv) => {
    const isOverdue =
      inv.status !== 'PAID' &&
      inv.status !== 'CANCELLED' &&
      new Date(inv.dueDate) < now &&
      toDecimal(inv.totalAmount).gt(toDecimal(inv.amountPaid || 0));

    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'OVERDUE') return isOverdue;
    return inv.status === statusFilter;
  });

  const columns: Column<Invoice>[] = [
    {
      header: 'Invoice #',
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 block">{row.invoiceNumber}</span>
          <span className="text-[11px] text-brand-muted flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Due {row.dueDate}
          </span>
        </div>
      ),
    },
    {
      header: 'Customer',
      cell: (row) => <span className="font-semibold text-slate-900">{row.customerName}</span>,
    },
    {
      header: 'Cycle ID',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs border border-slate-200">
          {row.billingCycleId}
        </span>
      ),
    },
    {
      header: 'Total Amount',
      accessorKey: 'totalAmount',
      align: 'right',
      cell: (row) => <span className="font-bold text-slate-900">{formatINR(row.totalAmount)}</span>,
    },
    {
      header: 'Amount Paid',
      accessorKey: 'amountPaid',
      align: 'right',
      cell: (row) => <span className="font-semibold text-emerald-700">{formatINR(row.amountPaid || '0.00')}</span>,
    },
    {
      header: 'Outstanding Balance',
      align: 'right',
      cell: (row) => {
        const bal = subtractCurrency(row.totalAmount, row.amountPaid || 0);
        const isOverdue =
          row.status !== 'PAID' &&
          new Date(row.dueDate) < now &&
          bal.gt(0);

        return (
          <span className={`font-mono font-bold ${isOverdue ? 'text-rose-600' : bal.isZero() ? 'text-slate-400' : 'text-slate-900'}`}>
            {formatINR(bal)}
          </span>
        );
      },
    },
    {
      header: 'Status',
      align: 'center',
      cell: (row) => {
        const isOverdue =
          row.status !== 'PAID' &&
          row.status !== 'CANCELLED' &&
          new Date(row.dueDate) < now &&
          toDecimal(row.totalAmount).gt(toDecimal(row.amountPaid || 0));

        return <StatusBadge status={isOverdue ? 'OVERDUE' : row.status} variant={isOverdue ? 'OVERDUE' : row.status} />;
      },
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedInvoice(row);
          }}
          className="text-xs"
        >
          Snapshot View
        </Button>
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
              Billing Ledger
            </span>
            <span className="text-xs text-brand-muted font-medium">Brightloop Software</span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Invoice Management &amp; Historical Snapshots
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Immutable invoice snapshots preserved with exact tax, discount deductions, and partial payment balances.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsBillingModalOpen(true)}
          className="gap-1.5 shadow-sm"
        >
          <PlayCircle className="h-4 w-4" />
          <span>Billing Day Engine</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-brand-border shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Search invoice # or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'CONFIRMED', 'PAID', 'OVERDUE', 'DRAFT'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' ? 'All Invoices' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredInvoices}
        keyExtractor={(i) => i.id}
        isLoading={isLoading}
        emptyMessage="No invoices found matching criteria."
      />

      {/* Billing Engine Workspace Modal */}
      <BillingWorkspaceModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
      />

      {/* Invoice Snapshot Print / Inspection Modal */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
          role="dialog"
        >
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-brand-border p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header info */}
            <div className="flex items-start justify-between border-b border-brand-border pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-primary tracking-widest block">
                  Official Billing Record
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-xl font-bold text-slate-900">{selectedInvoice.invoiceNumber}</h3>
                  <StatusBadge status={selectedInvoice.status} variant={selectedInvoice.status} />
                </div>
                <p className="text-xs text-brand-muted mt-0.5">
                  Billed to: <strong className="text-slate-800">{selectedInvoice.customerName}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1.5 text-xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print View</span>
                </Button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Dates & Cycle Grid */}
            <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-brand-muted block font-medium">Issue Date:</span>
                <span className="font-bold text-slate-900">{selectedInvoice.issueDate}</span>
              </div>
              <div>
                <span className="text-brand-muted block font-medium">Payment Due:</span>
                <span className="font-bold text-slate-900">{selectedInvoice.dueDate}</span>
              </div>
              <div>
                <span className="text-brand-muted block font-medium">Billing Cycle ID:</span>
                <span className="font-mono font-bold text-indigo-700">{selectedInvoice.billingCycleId}</span>
              </div>
            </div>

            {/* Frozen Line Items Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                Frozen Snapshot Line Items
              </span>
              <div className="divide-y divide-brand-border border border-brand-border rounded-lg overflow-hidden bg-white">
                {selectedInvoice.lines.map((l) => (
                  <div key={l.id} className="p-3 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 block">{l.description}</span>
                      <span className="text-[11px] text-brand-muted">
                        Qty: {l.quantity} &times; {formatINR(l.unitPrice)}
                      </span>
                    </div>
                    <div className="text-right font-mono font-bold text-slate-900">
                      {formatINR(l.lineTotal)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Settlement Reconciliation Box */}
            <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Net):</span>
                <span className="font-mono">{formatINR(selectedInvoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Applied Taxes:</span>
                <span className="font-mono">+{formatINR(selectedInvoice.taxTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold border-t border-slate-300 pt-1.5">
                <span>Total Invoiced Amount:</span>
                <span className="font-mono text-sm">{formatINR(selectedInvoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Cumulative Payments Paid:</span>
                <span className="font-mono">-{formatINR(selectedInvoice.amountPaid || '0.00')}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-rose-700 border-t border-slate-300 pt-1.5">
                <span>Remaining Balance Due:</span>
                <span className="font-mono">
                  {formatINR(subtractCurrency(selectedInvoice.totalAmount, selectedInvoice.amountPaid || 0))}
                </span>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex justify-between items-center pt-2 border-t border-brand-border">
              {selectedInvoice.status === 'DRAFT' ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => confirmInvoiceMutation.mutate(selectedInvoice.id)}
                  className="gap-1.5"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Confirm and Post Invoice</span>
                </Button>
              ) : (
                <span className="text-xs text-slate-500 italic">
                  Snapshot is locked and immutable.
                </span>
              )}

              <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceListPage;
