import { apiClient } from './client';
import { BillingPlan } from '@/types/plan';

export const planApi = {
  async getPlans(): Promise<BillingPlan[]> {
    const res = await apiClient<BillingPlan[]>('/plans', { method: 'GET' });
    return res.data;
  },

  async getPlanById(id: string): Promise<BillingPlan> {
    const res = await apiClient<BillingPlan>(`/plans/${id}`, { method: 'GET' });
    return res.data;
  },

  async createPlan(plan: Omit<BillingPlan, 'id'>): Promise<BillingPlan> {
    const res = await apiClient<BillingPlan>('/plans', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
    return res.data;
  },

  async updatePlan(id: string, plan: Partial<BillingPlan>): Promise<BillingPlan> {
    const res = await apiClient<BillingPlan>(`/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(plan),
    });
    return res.data;
  },

  async togglePlanStatus(id: string, isActive: boolean): Promise<BillingPlan> {
    const res = await apiClient<BillingPlan>(`/plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
    return res.data;
  },
};

