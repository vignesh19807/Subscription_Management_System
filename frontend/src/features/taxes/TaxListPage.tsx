import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxApi } from '@/api/taxApi';
import { TaxRule } from '@/types/tax';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { TaxModal } from './TaxModal';
import { useToast } from '@/components/ui/Toast';
import { Plus, Edit2, CheckCircle2, XCircle } from 'lucide-react';

export const TaxListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taxToEdit, setTaxToEdit] = useState<TaxRule | null>(null);

  const { data: taxes = [], isLoading } = useQuery({
    queryKey: ['taxes'],
    queryFn: () => taxApi.getTaxes(),
  });

  const saveTaxMutation = useMutation({
    mutationFn: async (data: Omit<TaxRule, 'id' | 'createdAt'>) => {
      if (taxToEdit) {
        return taxApi.updateTax(taxToEdit.id, data);
      }
      return taxApi.createTax(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      showToast({
        type: 'success',
        title: taxToEdit ? 'Tax Rule Updated' : 'Tax Rule Created',
        message: 'Tax calculation configuration saved.',
      });
      setTaxToEdit(null);
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Operation Failed',
        message: err instanceof Error ? err.message : 'Could not save tax rule',
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      taxApi.toggleTaxStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      showToast({
        type: 'info',
        title: 'Status Updated',
        message: 'Tax rule status updated.',
      });
    },
  });

  const columns: Column<TaxRule>[] = [
    {
      header: 'Tax Rule Name',
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.name}</span>
          {row.description && <span className="text-[11px] text-brand-muted line-clamp-1">{row.description}</span>}
        </div>
      ),
    },
    {
      header: 'Rate',
      accessorKey: 'rate',
      align: 'right',
      cell: (row) => (
        <span className="font-mono font-bold text-slate-900 text-sm">
          {row.rate}%
        </span>
      ),
    },
    {
      header: 'Type',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs border border-slate-200">
          {row.taxType}
        </span>
      ),
    },
    {
      header: 'Status',
      align: 'center',
      cell: (row) => (
        <StatusBadge
          status={row.isActive ? 'ACTIVE' : 'CLOSED'}
          variant={row.isActive ? 'ACTIVE' : 'CLOSED'}
        />
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setTaxToEdit(row);
              setIsModalOpen(true);
            }}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-brand-primary transition-colors"
            title="Edit tax rule"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => toggleStatusMutation.mutate({ id: row.id, isActive: !row.isActive })}
            className={`p-1.5 rounded transition-colors ${
              row.isActive
                ? 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'
            }`}
            title={row.isActive ? 'Deactivate tax' : 'Activate tax'}
          >
            {row.isActive ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          </button>
        </div>
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
              Taxes
            </span>
            <span className="text-xs text-brand-muted font-medium">Brightloop Software</span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Tax Rules &amp; Statutory Configuration
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Maintain centralized GST, VAT, and regional tax brackets with exact decimal math.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setTaxToEdit(null);
            setIsModalOpen(true);
          }}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>New Tax Rule</span>
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={taxes}
        keyExtractor={(t) => t.id}
        isLoading={isLoading}
        emptyMessage="No tax rules configured yet."
      />

      {/* Tax Modal */}
      <TaxModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTaxToEdit(null);
        }}
        taxToEdit={taxToEdit}
        onSave={async (data) => {
          await saveTaxMutation.mutateAsync(data);
        }}
      />
    </div>
  );
};

export default TaxListPage;
