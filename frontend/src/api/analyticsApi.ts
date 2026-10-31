import { apiClient } from './client';
import { FinancialKPIs } from '@/types/analytics';

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  status?: string;
}

export const analyticsApi = {
  async getKPIs(): Promise<FinancialKPIs> {
    const res = await apiClient<FinancialKPIs>('/analytics/kpis', { method: 'GET' });
    return res.data;
  },

  async getRevenueReport(filter?: ReportFilter): Promise<{
    totalRevenue: string;
    periodMrr: string;
    collections: string;
    receivables: string;
    breakdown: { date: string; amount: string; count: number }[];
  }> {
    const res = await apiClient<{
      totalRevenue: string;
      periodMrr: string;
      collections: string;
      receivables: string;
      breakdown: { date: string; amount: string; count: number }[];
    }>('/analytics/reports/revenue', {
      method: 'POST',
      body: JSON.stringify(filter || {}),
    });
    return res.data;
  },
};

