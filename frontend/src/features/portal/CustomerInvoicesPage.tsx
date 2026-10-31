import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { invoiceApi } from '@/api/invoiceApi';
import { Invoice } from '@/types/invoice';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { formatINR, subtractCurrency } from '@/utils/currency';
import { Printer, Calendar } from 'lucide-react';

export const CustomerInvoicesPage: React.FC = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoiceApi.getInvoices(),
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
      header: 'Billing Cycle',
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
        return (
          <span className={`font-mono font-bold ${bal.gt(0) ? 'text-rose-600' : 'text-slate-400'}`}>
            {formatINR(bal)}
          </span>
        );
      },
    },
    {
      header: 'Status',
      align: 'center',
      cell: (row) => (
        <StatusBadge status={row.status} variant={row.status} />
      ),
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
          View Statement
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-purple-600 text-white">
            Client Self-Service
          </span>
          <span className="text-xs text-brand-muted font-medium">Invoices &amp; Receipts</span>
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          My Billing Statements &amp; Invoices
        </h2>
        <p className="text-xs text-brand-muted mt-0.5">
          Review itemized invoices, download printable statements, and track payment receipts.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        keyExtractor={(i) => i.id}
        isLoading={isLoading}
        emptyMessage="No billing statements generated for your account."
      />

      {/* Invoice Snapshot Inspection Dialog */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
          role="dialog"
        >
          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-brand-border p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-brand-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{selectedInvoice.invoiceNumber}</h3>
                  <StatusBadge status={selectedInvoice.status} variant={selectedInvoice.status} />
                </div>
                <p className="text-xs text-brand-muted">Issued: {selectedInvoice.issueDate} &bull; Due: {selectedInvoice.dueDate}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 text-xs">
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print</span>
                </Button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Line items */}
            <div className="divide-y divide-brand-border border border-brand-border rounded-lg overflow-hidden bg-slate-50/50">
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

            {/* Summary */}
            <div className="p-3.5 bg-slate-100 rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Total Amount:</span>
                <span className="font-bold text-slate-900 text-sm">{formatINR(selectedInvoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Amount Paid:</span>
                <span className="font-mono font-semibold">{formatINR(selectedInvoice.amountPaid || 0)}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-bold border-t border-slate-300 pt-1.5">
                <span>Remaining Balance Due:</span>
                <span className="font-mono text-sm">
                  {formatINR(subtractCurrency(selectedInvoice.totalAmount, selectedInvoice.amountPaid || 0))}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-brand-border">
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

export default CustomerInvoicesPage;
