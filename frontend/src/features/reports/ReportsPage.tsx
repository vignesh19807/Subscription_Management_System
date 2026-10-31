import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analyticsApi';
import { invoiceApi } from '@/api/invoiceApi';
import { paymentApi } from '@/api/paymentApi';
import { subscriptionApi } from '@/api/subscriptionApi';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/Button';
import { formatINR, subtractCurrency } from '@/utils/currency';
import {
  BarChart3,
  Download,
  CreditCard,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<'REVENUE' | 'SUBSCRIPTIONS' | 'PAYMENTS' | 'RECEIVABLES'>('REVENUE');

  const { data: kpis } = useQuery({
    queryKey: ['analytics', 'kpis'],
    queryFn: () => analyticsApi.getKPIs(),
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

  // Client-side CSV export helper without external dependencies
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportType === 'REVENUE' || reportType === 'RECEIVABLES') {
      csvContent += 'Invoice Number,Customer,Issue Date,Due Date,Total Amount,Amount Paid,Outstanding,Status\n';
      invoices.forEach((inv) => {
        const bal = subtractCurrency(inv.totalAmount, inv.amountPaid || 0);
        csvContent += `"${inv.invoiceNumber}","${inv.customerName}","${inv.issueDate}","${inv.dueDate}","${inv.totalAmount}","${inv.amountPaid || '0.00'}","${bal.toFixed(2)}","${inv.status}"\n`;
      });
    } else if (reportType === 'SUBSCRIPTIONS') {
      csvContent += 'Subscription Number,Customer,Plan,Billing Interval,Start Date,Next Billing,Amount,Status\n';
      subscriptions.forEach((sub) => {
        csvContent += `"${sub.subscriptionNumber}","${sub.customerName}","${sub.planName}","${sub.billingInterval}","${sub.startDate}","${sub.nextBillingDate}","${sub.totalAmount}","${sub.status}"\n`;
      });
    } else if (reportType === 'PAYMENTS') {
      csvContent += 'Payment Date,Invoice,Customer,Channel,Reference,Amount,Status\n';
      payments.forEach((pay) => {
        csvContent += `"${pay.paymentDate}","${pay.invoiceNumber}","${pay.customerName}","${pay.paymentMethod}","${pay.referenceNote || ''}","${pay.amount}","${pay.status}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LoopBill_${reportType}_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-brand-primary text-white">
              Financial Intelligence
            </span>
            <span className="text-xs text-brand-muted font-medium">Brightloop Software</span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Reports &amp; Financial Analytics Workspace
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Audit-grade reporting across recurring MRR, revenue collections, contract health, and aging receivables.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="gap-1.5 shadow-sm"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV Report</span>
        </Button>
      </div>

      {/* Report Type Selector Pills */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-brand-border shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted px-2">Report Domain:</span>
        {(['REVENUE', 'SUBSCRIPTIONS', 'PAYMENTS', 'RECEIVABLES'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setReportType(type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              reportType === type
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {type === 'REVENUE' && 'Revenue & MRR'}
            {type === 'SUBSCRIPTIONS' && 'Subscription Contracts'}
            {type === 'PAYMENTS' && 'Payment Collections'}
            {type === 'RECEIVABLES' && 'Outstanding & Overdue Debt'}
          </button>
        ))}
      </div>

      {/* Summary KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="MRR Baseline"
          value={formatINR(kpis?.mrr || '0.00')}
          subtitle="Normalized monthly recurring"
          deltaType="positive"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <MetricCard
          title="Gross Invoiced Revenue"
          value={formatINR(kpis?.totalInvoicedRevenue || '0.00')}
          subtitle="Cumulative billing"
          deltaType="neutral"
          icon={<FileText className="h-4 w-4" />}
        />
        <MetricCard
          title="Total Cash Collected"
          value={formatINR(kpis?.totalCollectedPayments || '0.00')}
          subtitle="Ledger receipts verified"
          deltaType="positive"
          icon={<CreditCard className="h-4 w-4" />}
        />
        <MetricCard
          title="Aging Receivables"
          value={formatINR(kpis?.outstandingReceivables || '0.00')}
          subtitle={`${kpis?.overdueCount || 0} overdue account(s)`}
          deltaType={kpis?.overdueCount ? 'negative' : 'positive'}
          icon={<AlertCircle className="h-4 w-4" />}
        />
      </div>

      {/* Report Table View */}
      <div className="rounded-xl border border-brand-border bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-brand-border flex items-center justify-between bg-slate-50/75">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {reportType === 'REVENUE' && 'Detailed Revenue & Invoicing Breakdown'}
              {reportType === 'SUBSCRIPTIONS' && 'Subscription Lifecycle Audit Trail'}
              {reportType === 'PAYMENTS' && 'Settlement Receipts by Payment Channel'}
              {reportType === 'RECEIVABLES' && 'Aging Debt & Outstanding Balance Ledger'}
            </h3>
            <p className="text-[11px] text-brand-muted">
              Displaying all verified transactional records
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'REVENUE' || reportType === 'RECEIVABLES' ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-slate-50 text-slate-500 font-semibold uppercase">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Issue Date</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right">Invoiced Total</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Balance Due</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {invoices.map((inv) => {
                  const bal = subtractCurrency(inv.totalAmount, inv.amountPaid || 0);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-3 px-3 font-medium text-slate-800">{inv.customerName}</td>
                      <td className="py-3 px-3 text-slate-600">{inv.issueDate}</td>
                      <td className="py-3 px-3 text-slate-600">{inv.dueDate}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">{formatINR(inv.totalAmount)}</td>
                      <td className="py-3 px-3 text-right text-emerald-700">{formatINR(inv.amountPaid || 0)}</td>
                      <td className="py-3 px-3 text-right font-bold text-rose-600">{formatINR(bal)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold border bg-slate-100 text-slate-700">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : reportType === 'SUBSCRIPTIONS' ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-slate-50 text-slate-500 font-semibold uppercase">
                  <th className="py-2.5 px-3">Subscription #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Cadence</th>
                  <th className="py-2.5 px-3">Next Billing</th>
                  <th className="py-2.5 px-3 text-right">Recurring Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{sub.subscriptionNumber}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{sub.customerName}</td>
                    <td className="py-3 px-3 text-slate-600">{sub.planName}</td>
                    <td className="py-3 px-3 font-mono">{sub.billingInterval}</td>
                    <td className="py-3 px-3 text-indigo-700 font-semibold">{new Date(sub.nextBillingDate).toLocaleDateString()}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">{formatINR(sub.totalAmount)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold border bg-slate-100 text-slate-700">
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-slate-50 text-slate-500 font-semibold uppercase">
                  <th className="py-2.5 px-3">Settlement Date</th>
                  <th className="py-2.5 px-3">Invoice Ref</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Reference Note</th>
                  <th className="py-2.5 px-3 text-right">Amount Settled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 text-slate-600">{new Date(p.paymentDate).toLocaleDateString()}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{p.invoiceNumber}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{p.customerName}</td>
                    <td className="py-3 px-3 font-mono">{p.paymentMethod}</td>
                    <td className="py-3 px-3 text-brand-muted">{p.referenceNote || 'N/A'}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700">{formatINR(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
