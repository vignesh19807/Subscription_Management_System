import { apiClient } from './client';
import { Invoice } from '@/types/invoice';

export interface BillingRunResult {
  isDryRun: boolean;
  targetDate: string;
  totalEligible: number;
  invoicesGenerated: number;
  skippedCount: number;
  invoices: Invoice[];
  simulatedSummary?: {
    totalRevenueProjected: string;
    subscriptionsAffected: string[];
  };
}

export const invoiceApi = {
  async getInvoices(): Promise<Invoice[]> {
    const res = await apiClient<Invoice[]>('/invoices', { method: 'GET' });
    return res.data;
  },

  async getInvoiceById(id: string): Promise<Invoice> {
    const res = await apiClient<Invoice>(`/invoices/${id}`, { method: 'GET' });
    return res.data;
  },

  async confirmInvoice(id: string): Promise<Invoice> {
    const res = await apiClient<Invoice>(`/invoices/${id}/confirm`, { method: 'POST' });
    return res.data;
  },

  async dryRunBilling(targetDate: string): Promise<BillingRunResult> {
    const res = await apiClient<BillingRunResult>('/billing/dry-run', {
      method: 'POST',
      body: JSON.stringify({ targetDate }),
    });
    return res.data;
  },

  async executeBilling(targetDate: string): Promise<BillingRunResult> {
    const res = await apiClient<BillingRunResult>('/billing/execute', {
      method: 'POST',
      body: JSON.stringify({ targetDate }),
    });
    return res.data;
  },
};
