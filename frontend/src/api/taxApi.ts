import { apiClient } from './client';
import { TaxRule } from '@/types/tax';

export const taxApi = {
  async getTaxes(): Promise<TaxRule[]> {
    const res = await apiClient<TaxRule[]>('/taxes', { method: 'GET' });
    return res.data;
  },

  async createTax(tax: Omit<TaxRule, 'id' | 'createdAt'>): Promise<TaxRule> {
    const res = await apiClient<TaxRule>('/taxes', {
      method: 'POST',
      body: JSON.stringify(tax),
    });
    return res.data;
  },

  async updateTax(id: string, tax: Partial<TaxRule>): Promise<TaxRule> {
    const res = await apiClient<TaxRule>(`/taxes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tax),
    });
    return res.data;
  },

  async toggleTaxStatus(id: string, isActive: boolean): Promise<TaxRule> {
    const res = await apiClient<TaxRule>(`/taxes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
    return res.data;
  },
};
