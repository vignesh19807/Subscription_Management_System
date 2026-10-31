import { apiClient } from './client';
import { Quotation, QuotationStatus } from '@/types/quotation';
import { Subscription } from '@/types/subscription';

export const quotationApi = {
  async getQuotations(): Promise<Quotation[]> {
    const res = await apiClient<Quotation[]>('/quotations', { method: 'GET' });
    return res.data;
  },

  async getQuotationById(id: string): Promise<Quotation> {
    const res = await apiClient<Quotation>(`/quotations/${id}`, { method: 'GET' });
    return res.data;
  },

  async createQuotation(data: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'convertedSubscriptionId'>): Promise<Quotation> {
    const res = await apiClient<Quotation>('/quotations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateQuotationStatus(id: string, status: QuotationStatus): Promise<Quotation> {
    const res = await apiClient<Quotation>(`/quotations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  async convertToSubscription(id: string): Promise<{ quotation: Quotation; subscription: Subscription }> {
    const res = await apiClient<{ quotation: Quotation; subscription: Subscription }>(`/quotations/${id}/convert`, {
      method: 'POST',
    });
    return res.data;
  },
};
