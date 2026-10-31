import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discountApi } from '@/api/discountApi';
import { DiscountRule } from '@/types/discount';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DiscountModal } from './DiscountModal';
import { useToast } from '@/components/ui/Toast';
import { formatINR } from '@/utils/currency';
import { Plus, Search, Edit2, CheckCircle2, XCircle } from 'lucide-react';

export const DiscountListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [discountToEdit, setDiscountToEdit] = useState<DiscountRule | null>(null);

  const { data: discounts = [], isLoading } = useQuery({
    queryKey: ['discounts'],
    queryFn: () => discountApi.getDiscounts(),
  });

  const saveDiscountMutation = useMutation({
    mutationFn: async (data: Omit<DiscountRule, 'id' | 'createdAt' | 'currentUsageCount'>) => {
      if (discountToEdit) {
        return discountApi.updateDiscount(discountToEdit.id, data);
      }
      return discountApi.createDiscount(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      showToast({
        type: 'success',
        title: discountToEdit ? 'Discount Updated' : 'Discount Created',
        message: 'Promotional discount rule configured.',
      });
      setDiscountToEdit(null);
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Operation Failed',
        message: err instanceof Error ? err.message : 'Could not save discount',
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      discountApi.toggleDiscountStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      showToast({
        type: 'info',
        title: 'Status Updated',
        message: 'Discount availability updated.',
      });
    },
  });

  const filteredDiscounts = discounts.filter(
    (d) =>
      d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<DiscountRule>[] = [
    {
      header: 'Promo Code & Campaign',
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 block">{row.code}</span>
          <span className="text-xs text-brand-muted">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Benefit Value',
      align: 'right',
      cell: (row) => (
        <span className="font-mono font-bold text-emerald-700">
          {row.discountType === 'PERCENTAGE' ? `${row.value}% Off` : formatINR(row.value)}
        </span>
      ),
    },
    {
      header: 'Scope',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200">
          {row.scope}
        </span>
      ),
    },
    {
      header: 'Redemptions / Cap',
      align: 'center',
      cell: (row) => {
        const isExhausted = row.currentUsageCount >= row.maxUsageCount;
        return (
          <div className="text-center font-mono text-xs">
            <span className={isExhausted ? 'text-rose-600 font-bold' : 'text-slate-800'}>
              {row.currentUsageCount} / {row.maxUsageCount}
            </span>
            {isExhausted && <span className="block text-[10px] text-rose-500 font-sans">Exhausted</span>}
          </div>
        );
      },
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
              setDiscountToEdit(row);
              setIsModalOpen(true);
            }}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-brand-primary transition-colors"
            title="Edit discount"
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
            title={row.isActive ? 'Deactivate' : 'Activate'}
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
              Promotions
            </span>
            <span className="text-xs text-brand-muted font-medium">Brightloop Software</span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Discount Rules &amp; Voucher Governance
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Configurable conditional promotions with minimum spend thresholds and non-stacking protection.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setDiscountToEdit(null);
            setIsModalOpen(true);
          }}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>New Discount Rule</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-brand-border shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Search by promo code or campaign..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredDiscounts}
        keyExtractor={(d) => d.id}
        isLoading={isLoading}
        emptyMessage="No discount rules found."
      />

      {/* Discount Modal */}
      <DiscountModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setDiscountToEdit(null);
        }}
        discountToEdit={discountToEdit}
        onSave={async (data) => {
          await saveDiscountMutation.mutateAsync(data);
        }}
      />
    </div>
  );
};

export default DiscountListPage;
