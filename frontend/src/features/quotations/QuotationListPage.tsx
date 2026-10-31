import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotationApi } from '@/api/quotationApi';
import { Quotation, QuotationStatus } from '@/types/quotation';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { QuotationCreateModal } from './QuotationCreateModal';
import { useToast } from '@/components/ui/Toast';
import { formatINR } from '@/utils/currency';
import {
  Plus,
  CheckCircle,
  ArrowRight,
  Layers,
  Calendar,
} from 'lucide-react';

export const QuotationListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: () => quotationApi.getQuotations(),
  });

  const createQuotationMutation = useMutation({
    mutationFn: (data: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'convertedSubscriptionId'>) =>
      quotationApi.createQuotation(data),
    onSuccess: (newQuo) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      showToast({
        type: 'success',
        title: 'Quotation Generated',
        message: `${newQuo.quotationNumber} initialized in DRAFT state.`,
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuotationStatus }) =>
      quotationApi.updateQuotationStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      showToast({
        type: 'info',
        title: 'Status Updated',
        message: `Quotation is now in ${updated.status} state.`,
      });
      setSelectedQuotation(updated);
    },
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => quotationApi.convertToSubscription(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      showToast({
        type: 'success',
        title: 'Subscription Activated',
        message: `Quotation converted into ${data.subscription.subscriptionNumber}!`,
      });
      setSelectedQuotation(data.quotation);
    },
  });

  const columns: Column<Quotation>[] = [
    {
      header: 'Quote Reference',
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 block">{row.quotationNumber}</span>
          <span className="text-[11px] text-brand-muted flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {new Date(row.startDate).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Customer',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.customerName}</span>
          <span className="text-[11px] text-brand-muted">{row.customerEmail}</span>
        </div>
      ),
    },
    {
      header: 'Plan',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs border border-slate-200">
          {row.planName}
        </span>
      ),
    },
    {
      header: 'Items',
      align: 'center',
      cell: (row) => (
        <span className="font-mono text-xs text-slate-600">
          {row.lines.length} line(s)
        </span>
      ),
    },
    {
      header: 'Grand Total',
      accessorKey: 'grandTotal',
      align: 'right',
      cell: (row) => <span className="font-bold text-slate-900">{formatINR(row.grandTotal)}</span>,
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
            setSelectedQuotation(row);
          }}
          className="text-xs"
        >
          Inspect Quote
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
              Commercial
            </span>
            <span className="text-xs text-brand-muted font-medium">Brightloop Software</span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Quotation Templates &amp; Subscription Conversion
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Quotation state machine transitions: DRAFT &rarr; QUOTATION &rarr; CONFIRMED &rarr; ACTIVE subscription.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>New Quotation</span>
        </Button>
      </div>

      {/* State Machine Explainer Pill */}
      <div className="p-3 bg-white border border-brand-border rounded-xl shadow-sm flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <span className="font-semibold text-slate-800">State Lifecycle:</span>
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="px-2 py-0.5 rounded bg-slate-100">1. DRAFT</span>
          <ArrowRight className="h-3 w-3 text-slate-400" />
          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700">2. QUOTATION</span>
          <ArrowRight className="h-3 w-3 text-slate-400" />
          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">3. CONFIRMED</span>
          <ArrowRight className="h-3 w-3 text-slate-400" />
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">4. ACTIVE (SUB)</span>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={quotations}
        keyExtractor={(q) => q.id}
        isLoading={isLoading}
        emptyMessage="No quotations generated yet."
      />

      {/* Create Modal */}
      <QuotationCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={async (data) => {
          await createQuotationMutation.mutateAsync(data);
        }}
      />

      {/* Inspect & Lifecycle Transition Modal */}
      {selectedQuotation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
          role="dialog"
        >
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-brand-border p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-brand-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{selectedQuotation.quotationNumber}</h3>
                  <StatusBadge status={selectedQuotation.status} variant={selectedQuotation.status} />
                </div>
                <p className="text-xs text-brand-muted">
                  Client: {selectedQuotation.customerName} ({selectedQuotation.customerEmail})
                </p>
              </div>
              <button
                onClick={() => setSelectedQuotation(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {/* Line Items Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Line Items Snapshot
              </h4>
              <div className="divide-y divide-brand-border border border-brand-border rounded-lg overflow-hidden bg-slate-50/50">
                {selectedQuotation.lines.map((l) => (
                  <div key={l.id} className="p-3 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 block">{l.productName}</span>
                      {l.variantName && (
                        <span className="text-[11px] text-brand-primary block font-medium">
                          Variant: {l.variantName}
                        </span>
                      )}
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

            {/* Financial Totals */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-100 rounded-lg text-xs">
              <div>
                <span className="text-brand-muted block">Subtotal:</span>
                <span className="font-bold text-slate-800">{formatINR(selectedQuotation.subtotal)}</span>
              </div>
              <div className="text-right">
                <span className="text-brand-muted block">Grand Total:</span>
                <span className="font-bold text-brand-primary text-base">{formatINR(selectedQuotation.grandTotal)}</span>
              </div>
            </div>

            {/* State Machine Transition Actions */}
            <div className="pt-3 border-t border-brand-border space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                Lifecycle State Actions
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {selectedQuotation.status === 'DRAFT' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => statusMutation.mutate({ id: selectedQuotation.id, status: 'QUOTATION' })}
                  >
                    Send to Customer (Advance to QUOTATION)
                  </Button>
                )}

                {selectedQuotation.status === 'QUOTATION' && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => statusMutation.mutate({ id: selectedQuotation.id, status: 'CONFIRMED' })}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Customer Confirmed (Advance to CONFIRMED)</span>
                  </Button>
                )}

                {selectedQuotation.status === 'CONFIRMED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => convertMutation.mutate(selectedQuotation.id)}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Activate into Live Subscription</span>
                  </Button>
                )}

                {selectedQuotation.convertedSubscriptionId && (
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200">
                    Linked to Live Subscription
                  </span>
                )}

                <Button variant="outline" size="sm" onClick={() => setSelectedQuotation(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationListPage;
