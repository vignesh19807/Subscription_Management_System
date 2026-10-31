import { apiClient } from './client';
import { Subscription, SubscriptionStatus } from '@/types/subscription';

export const subscriptionApi = {
  async getSubscriptions(): Promise<Subscription[]> {
    const res = await apiClient<Subscription[]>('/subscriptions', { method: 'GET' });
    return res.data;
  },

  async getSubscriptionById(id: string): Promise<Subscription> {
    const res = await apiClient<Subscription>(`/subscriptions/${id}`, { method: 'GET' });
    return res.data;
  },

  async updateSubscriptionStatus(id: string, status: SubscriptionStatus): Promise<Subscription> {
    const res = await apiClient<Subscription>(`/subscriptions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  async renewSubscription(id: string): Promise<Subscription> {
    const res = await apiClient<Subscription>(`/subscriptions/${id}/renew`, {
      method: 'POST',
    });
    return res.data;
  },
};
