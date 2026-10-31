import { apiClient } from './client';
import { DiscountRule } from '@/types/discount';

export const discountApi = {
  async getDiscounts(): Promise<DiscountRule[]> {
    const res = await apiClient<DiscountRule[]>('/discounts', { method: 'GET' });
    return res.data;
  },

  async createDiscount(discount: Omit<DiscountRule, 'id' | 'createdAt' | 'currentUsageCount'>): Promise<DiscountRule> {
    const res = await apiClient<DiscountRule>('/discounts', {
      method: 'POST',
      body: JSON.stringify(discount),
    });
    return res.data;
  },

  async updateDiscount(id: string, discount: Partial<DiscountRule>): Promise<DiscountRule> {
    const res = await apiClient<DiscountRule>(`/discounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(discount),
    });
    return res.data;
  },

  async toggleDiscountStatus(id: string, isActive: boolean): Promise<DiscountRule> {
    const res = await apiClient<DiscountRule>(`/discounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
    return res.data;
  },
};
