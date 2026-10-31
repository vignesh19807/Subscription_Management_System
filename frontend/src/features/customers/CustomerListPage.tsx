import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '@/api/customerApi';
import { Customer } from '@/types/customer';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CustomerModal } from './CustomerModal';
import { useToast } from '@/components/ui/Toast';
import { formatINR } from '@/utils/currency';
import { Plus, Search, Building2, Mail } from 'lucide-react';

export const CustomerListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerApi.getCustomers(),
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data: Omit<Customer, 'id' | 'createdAt' | 'activeSubscriptionsCount' | 'totalInvoiced' | 'totalPaid' | 'outstandingBalance'>) =>
      customerApi.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      showToast({
        type: 'success',
        title: 'Customer Onboarded',
        message: 'New customer account created successfully.',
      });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Onboarding Failed',
        message: err instanceof Error ? err.message : 'Could not create customer',
      });
    },
  });

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const columns: Column<Customer>[] = [
    {
      header: 'Customer Details',
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.name}</span>
          <span className="text-xs text-brand-muted flex items-center gap-1">
            <Mail className="h-3 w-3" /> {row.email}
          </span>
          {row.companyName && (
            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <Building2 className="h-3 w-3" /> {row.companyName}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Active Subs',
      align: 'center',
      cell: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {row.activeSubscriptionsCount} active
        </span>
      ),
    },
    {
      header: 'Total Invoiced',
      align: 'right',
      cell: (row) => <span className="font-bold text-slate-900">{formatINR(row.totalInvoiced)}</span>,
    },
    {
      header: 'Total Paid',
      align: 'right',
      cell: (row) => <span className="font-semibold text-emerald-700">{formatINR(row.totalPaid)}</span>,
    },
    {
      header: 'Outstanding Balance',
      align: 'right',
      cell: (row) => {
        const hasBalance = Number(row.outstandingBalance) > 0;
        return (
          <span className={`font-bold ${hasBalance ? 'text-rose-600' : 'text-slate-500'}`}>
            {formatINR(row.outstandingBalance)}
          </span>
        );
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
            setSelectedCustomer(row);
          }}
          className="text-xs"
        >
          View Profile
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
              Directory
            </span>
            <span className="text-xs text-brand-muted font-medium">Brightloop Software</span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Customer Directory &amp; Client Accounts
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Client records with subscription totals, receivable ledger, and multi-tenant isolation.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>Onboard Customer</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-brand-border shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Search by client name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Customer Data Table */}
      <DataTable
        columns={columns}
        data={filteredCustomers}
        keyExtractor={(c) => c.id}
        isLoading={isLoading}
        emptyMessage="No customers found matching search."
      />

      {/* Onboard Customer Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (data) => {
          await createCustomerMutation.mutateAsync(data);
        }}
      />

      {/* Customer Detail Drawer/Modal */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
          role="dialog"
        >
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-brand-border p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-brand-border pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedCustomer.name}</h3>
                <p className="text-xs text-brand-muted">{selectedCustomer.companyName || 'Individual Customer'}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-brand-muted block font-medium">Email</span>
                <span className="font-bold text-slate-800">{selectedCustomer.email}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-brand-muted block font-medium">Phone</span>
                <span className="font-bold text-slate-800">{selectedCustomer.phone || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-brand-muted block font-medium">Active Subscriptions</span>
                <span className="font-bold text-emerald-700">{selectedCustomer.activeSubscriptionsCount} Subscriptions</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-brand-muted block font-medium">Outstanding Balance</span>
                <span className="font-bold text-rose-600">{formatINR(selectedCustomer.outstandingBalance)}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="text-brand-muted block font-medium">Billing Address</span>
              <span className="text-slate-800">{selectedCustomer.address || 'No billing address provided'}</span>
            </div>

            <div className="flex justify-end pt-2 border-t border-brand-border">
              <Button variant="secondary" size="sm" onClick={() => setSelectedCustomer(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerListPage;
