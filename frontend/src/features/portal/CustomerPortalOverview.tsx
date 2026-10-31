import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { subscriptionApi } from '@/api/subscriptionApi';
import { invoiceApi } from '@/api/invoiceApi';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatINR, subtractCurrency } from '@/utils/currency';
import {
  Layers,
  FileText,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Calendar,
} from 'lucide-react';

export const CustomerPortalOverview: React.FC = () => {
  const { user } = useAuth();

  const { data: subscriptions = [], isLoading: isSubLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionApi.getSubscriptions(),
  });

  const { data: invoices = [], isLoading: isInvLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoiceApi.getInvoices(),
  });

  // Calculate customer tenant totals
  const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE');
  const unpaidInvoices = invoices.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED');

  let totalOutstanding = '0.00';
  unpaidInvoices.forEach((inv) => {
    const bal = subtractCurrency(inv.totalAmount, inv.amountPaid || 0);
    totalOutstanding = formatINR(bal);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-purple-600 text-white">
              Customer Portal
            </span>
            <span className="text-xs text-brand-muted font-medium">Tenant-Isolated Workspace</span>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Welcome, {user?.fullName || 'Customer'}
          </h2>
          <p className="mt-1 text-xs text-brand-muted">
            Inspect active cloud contracts, manage recurring add-ons, and download historical invoice snapshots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={user?.role || 'CUSTOMER'} variant="CUSTOMER" />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Active Subscriptions"
          value={`${activeSubs.length} Active`}
          subtitle="Enterprise Cloud Subscriptions"
          deltaType="positive"
          icon={<Layers className="h-4 w-4" />}
          isLoading={isSubLoading}
        />
        <MetricCard
          title="Outstanding Balance Due"
          value={totalOutstanding}
          subtitle={unpaidInvoices.length > 0 ? `${unpaidInvoices.length} invoice(s) pending` : 'All invoices settled'}
          delta={unpaidInvoices.length > 0 ? 'Due' : 'Settled'}
          deltaType={unpaidInvoices.length > 0 ? 'negative' : 'positive'}
          icon={<CreditCard className="h-4 w-4" />}
          isLoading={isInvLoading}
        />
        <MetricCard
          title="Next Renewal Cycle"
          value={activeSubs[0]?.nextBillingDate ? new Date(activeSubs[0].nextBillingDate).toLocaleDateString() : 'N/A'}
          subtitle={activeSubs[0]?.planName || 'Standard Cloud'}
          deltaType="neutral"
          icon={<Calendar className="h-4 w-4" />}
          isLoading={isSubLoading}
        />
      </div>

      {/* Quick Action Navigation Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/portal/subscriptions"
          className="p-5 rounded-xl border border-brand-border bg-white hover:border-brand-primary/60 hover:shadow-md transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="h-9 w-9 rounded-lg bg-indigo-50 text-brand-primary flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand-primary transition-colors" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">My Subscriptions &amp; Add-ons</h3>
          <p className="text-xs text-brand-muted">
            Manage your service tiers, pause/renew contracts, and toggle recurring add-on modules.
          </p>
        </Link>

        <Link
          to="/portal/invoices"
          className="p-5 rounded-xl border border-brand-border bg-white hover:border-brand-primary/60 hover:shadow-md transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="h-9 w-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">My Invoices &amp; Receipts</h3>
          <p className="text-xs text-brand-muted">
            Inspect billing statements, print invoices, and view verified payment settlement records.
          </p>
        </Link>
      </div>

      {/* Active Subscriptions Quick List */}
      <div className="rounded-xl border border-brand-border bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Active Subscriptions
          </h3>
          <Link to="/portal/subscriptions" className="text-xs font-semibold text-brand-primary hover:underline">
            View details
          </Link>
        </div>

        {activeSubs.length === 0 ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-center">
            You do not have any active subscriptions yet.
          </div>
        ) : (
          <div className="divide-y divide-brand-border border border-brand-border rounded-lg overflow-hidden">
            {activeSubs.map((sub) => (
              <div key={sub.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/60">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{sub.subscriptionNumber}</span>
                    <StatusBadge status={sub.status} variant={sub.status} />
                  </div>
                  <p className="text-brand-muted">Plan: {sub.planName} ({sub.billingInterval})</p>
                  <p className="text-[11px] text-indigo-700">Next renewal: {new Date(sub.nextBillingDate).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 text-sm block">{formatINR(sub.totalAmount)}</span>
                  <span className="text-[11px] text-slate-400 font-mono">Billed {sub.billingInterval.toLowerCase()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Security Profile Card */}
      <div className="rounded-xl border border-brand-border bg-white p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Tenant Data Isolation Verified</h3>
            <p className="text-xs text-brand-muted">
              All views are restricted to your authenticated user context: <strong className="text-slate-800">{user?.email}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPortalOverview;
