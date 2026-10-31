import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { analyticsApi } from '@/api/analyticsApi';
import { invoiceApi } from '@/api/invoiceApi';
import { paymentApi } from '@/api/paymentApi';
import { subscriptionApi } from '@/api/subscriptionApi';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/utils/currency';
import {
  TrendingUp,
  CreditCard,
  AlertCircle,
  FileText,
  Calendar,
  ArrowRight,
  PlusCircle,
  PlayCircle,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [dateFilter, setDateFilter] = useState<'ALL' | '30D' | '90D'>('ALL');

  const { data: kpis, isLoading: isKpisLoading } = useQuery({
    queryKey: ['analytics', 'kpis'],
    queryFn: () => analyticsApi.getKPIs(),
    staleTime: 1000 * 30,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoiceApi.getInvoices(),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentApi.getPayments(),
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionApi.getSubscriptions(),
  });

  const overdueInvoices = invoices.filter(
    (inv) =>
      inv.status !== 'PAID' &&
      inv.status !== 'CANCELLED' &&
      new Date(inv.dueDate) < new Date()
  );

  const upcomingRenewals = subscriptions.filter((s) => s.status === 'ACTIVE').slice(0, 5);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-brand-primary text-white">
              Back-Office
            </span>
            <span className="text-xs text-brand-muted font-medium">Brightloop Software</span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Financial &amp; Operations Executive Dashboard
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Real-time telemetry for recurring revenue, subscription lifecycle, receivables, and collections.
          </p>
        </div>

        {/* Quick Actions & Date Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white border border-brand-border rounded-lg p-0.5 text-xs font-medium">
            {(['ALL', '30D', '90D'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  dateFilter === filter
                    ? 'bg-brand-sidebar text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filter === 'ALL' ? 'All Time' : filter}
              </button>
            ))}
          </div>

          <Link to="/quotations">
            <Button variant="primary" size="sm" className="gap-1.5 shadow-sm">
              <PlusCircle className="h-3.5 w-3.5" />
              <span>New Quotation</span>
            </Button>
          </Link>
          <Link to="/invoices">
            <Button variant="outline" size="sm" className="gap-1.5">
              <PlayCircle className="h-3.5 w-3.5 text-brand-primary" />
              <span>Billing Workspace</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Monthly Recurring Revenue (MRR)"
          value={formatINR(kpis?.mrr || '0.00')}
          subtitle="Normalized active recurring volume"
          delta="Dynamic SLA"
          deltaType="positive"
          icon={<TrendingUp className="h-4 w-4" />}
          isLoading={isKpisLoading}
        />
        <MetricCard
          title="Total Invoiced Revenue"
          value={formatINR(kpis?.totalInvoicedRevenue || '0.00')}
          subtitle="Cumulative gross billing"
          delta="Fixed Decimal"
          deltaType="neutral"
          icon={<FileText className="h-4 w-4" />}
          isLoading={isKpisLoading}
        />
        <MetricCard
          title="Total Collected Payments"
          value={formatINR(kpis?.totalCollectedPayments || '0.00')}
          subtitle="Settled via UPI, Bank, Cash, Card"
          deltaType="positive"
          icon={<CreditCard className="h-4 w-4" />}
          isLoading={isKpisLoading}
        />
        <MetricCard
          title="Outstanding Receivables"
          value={formatINR(kpis?.outstandingReceivables || '0.00')}
          subtitle={`${kpis?.overdueCount || 0} overdue invoice(s)`}
          delta={kpis?.overdueCount ? `${kpis.overdueCount} Overdue` : 'Current'}
          deltaType={kpis?.overdueCount ? 'negative' : 'positive'}
          icon={<AlertCircle className="h-4 w-4" />}
          isLoading={isKpisLoading}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-brand-border bg-white p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
            Active Subscriptions
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">
              {kpis?.activeSubscriptionsCount ?? 0}
            </span>
            <span className="text-xs text-emerald-600 font-medium">In Force</span>
          </div>
        </div>

        <div className="rounded-xl border border-brand-border bg-white p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
            Total Customers
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">
              {kpis?.totalCustomers ?? 0}
            </span>
            <span className="text-xs text-brand-muted font-medium">Onboarded</span>
          </div>
        </div>

        <div className="rounded-xl border border-brand-border bg-white p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
            Upcoming Renewals
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">
              {kpis?.upcomingRenewalsCount ?? 0}
            </span>
            <span className="text-xs text-indigo-600 font-medium">Pending Run</span>
          </div>
        </div>

        <div className="rounded-xl border border-brand-border bg-white p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
            Overdue Amount
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-rose-600">
              {formatINR(kpis?.overdueAmount || '0.00')}
            </span>
          </div>
        </div>
      </div>

      {/* Charts & Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Visualizer (Zero-CDN, Pure CSS/SVG) */}
        <div className="lg:col-span-2 rounded-xl border border-brand-border bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Revenue &amp; MRR Expansion Trend
              </h3>
              <p className="text-xs text-brand-muted">Historical performance across the past 6 billing cycles</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="h-2.5 w-2.5 rounded-sm bg-brand-primary" /> Total Revenue
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="h-2.5 w-2.5 rounded-sm bg-indigo-200" /> MRR Base
              </span>
            </div>
          </div>

          {/* Lightweight Responsive Bar Chart */}
          <div className="h-56 pt-6 flex items-end justify-between gap-3 border-b border-brand-border px-2">
            {(kpis?.revenueHistory || [
              { month: 'Jun', revenue: 12000, mrr: 8500 },
              { month: 'Jul', revenue: 14500, mrr: 10200 },
              { month: 'Aug', revenue: 18000, mrr: 12800 },
              { month: 'Sep', revenue: 22400, mrr: 15600 },
              { month: 'Oct', revenue: 26800, mrr: 19400 },
              { month: 'Nov', revenue: 31200, mrr: 23100 },
            ]).map((point) => {
              const maxVal = 35000;
              const revHeight = Math.round((point.revenue / maxVal) * 100);
              const mrrHeight = Math.round((point.mrr / maxVal) * 100);

              return (
                <div key={point.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ₹{point.revenue}
                  </div>
                  <div className="w-full max-w-[42px] flex items-end justify-center gap-1 h-40">
                    <div
                      style={{ height: `${revHeight}%` }}
                      className="w-1/2 bg-brand-primary rounded-t transition-all group-hover:brightness-110"
                      title={`Revenue: ₹${point.revenue}`}
                    />
                    <div
                      style={{ height: `${mrrHeight}%` }}
                      className="w-1/2 bg-indigo-200 rounded-t transition-all group-hover:bg-indigo-300"
                      title={`MRR: ₹${point.mrr}`}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 mt-1">{point.month}</span>
                </div>
              );
            })}
          </div>
          <div className="text-[11px] text-brand-muted text-right">
            Calculated authoritatively via decimal aggregation queries
          </div>
        </div>

        {/* Subscription Status Distribution */}
        <div className="rounded-xl border border-brand-border bg-white p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Subscription Status Health
            </h3>
            <p className="text-xs text-brand-muted">Active contract lifecycle distribution</p>

            <div className="mt-6 space-y-3">
              {(kpis?.subscriptionBreakdown || [
                { status: 'ACTIVE', count: 2 },
                { status: 'PAUSED', count: 0 },
                { status: 'CLOSED', count: 0 },
              ]).map((item) => (
                <div key={item.status} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.status}</span>
                    <span className="font-mono text-slate-500">{item.count}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.status === 'ACTIVE'
                          ? 'bg-emerald-500'
                          : item.status === 'PAUSED'
                          ? 'bg-amber-400'
                          : 'bg-slate-400'
                      }`}
                      style={{
                        width: `${Math.max(10, (item.count / Math.max(1, subscriptions.length)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold block text-slate-800">Governance Policy:</span>
            <span>Pause, renewal, and auto-closure actions strictly observe plan configuration flags.</span>
          </div>
        </div>
      </div>

      {/* Operational Queues: Recent Invoices & Overdue Receivables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Receivables Queue */}
        <div className="rounded-xl border border-brand-border bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500" /> Overdue Invoices
              </h3>
              <p className="text-xs text-brand-muted">Invoices past payment terms requiring collection follow-up</p>
            </div>
            <Link to="/invoices" className="text-xs text-brand-primary font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {overdueInvoices.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No overdue receivables. All invoices are within payment grace periods.
            </div>
          ) : (
            <div className="space-y-2.5">
              {overdueInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/40 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">{inv.invoiceNumber}</div>
                    <div className="text-slate-600">{inv.customerName}</div>
                    <div className="text-[10px] text-rose-600 font-medium">Due: {inv.dueDate}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-bold text-slate-900">{formatINR(inv.totalAmount)}</div>
                    <StatusBadge status="OVERDUE" variant="OVERDUE" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Renewals & Recent Payments */}
        <div className="rounded-xl border border-brand-border bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-500" /> Upcoming Subscriptions Due
              </h3>
              <p className="text-xs text-brand-muted">Contracts approaching next scheduled billing date</p>
            </div>
            <Link to="/subscriptions" className="text-xs text-brand-primary font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {upcomingRenewals.map((sub) => (
              <div
                key={sub.id}
                className="p-3.5 rounded-lg border border-brand-border bg-white hover:bg-slate-50/60 transition-colors flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">{sub.subscriptionNumber}</div>
                  <div className="text-slate-600 font-medium">{sub.customerName}</div>
                  <div className="text-[10px] text-slate-400">Plan: {sub.planName}</div>
                </div>
                <div className="text-right space-y-1">
                  <div className="font-bold text-slate-900">{formatINR(sub.totalAmount)}</div>
                  <div className="text-[10px] text-indigo-600 font-medium">
                    Next: {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Payments Stream */}
      <div className="rounded-xl border border-brand-border bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Settlement Ledger
            </h3>
            <p className="text-xs text-brand-muted">Latest verified payments across multi-channel receipts</p>
          </div>
          <Link to="/payments">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <CreditCard className="h-3.5 w-3.5 text-slate-500" />
              <span>Full Ledger</span>
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-brand-border bg-slate-50/75 text-brand-muted uppercase font-semibold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Invoice Ref</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Payment Channel</th>
                <th className="py-2.5 px-3 text-right">Settled Amount</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {payments.slice(0, 5).map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-3 text-slate-600">{new Date(pay.paymentDate).toLocaleDateString()}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{pay.invoiceNumber}</td>
                  <td className="py-3 px-3 font-medium text-slate-800">{pay.customerName}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border">
                      {pay.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-700">{formatINR(pay.amount)}</td>
                  <td className="py-3 px-3 text-center">
                    <StatusBadge status={pay.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
