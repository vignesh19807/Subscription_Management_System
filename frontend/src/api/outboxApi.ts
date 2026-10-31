import { apiClient } from './client';
import { EmailOutboxItem } from '@/types/outbox';

export const outboxApi = {
  async getOutboxEmails(): Promise<EmailOutboxItem[]> {
    const res = await apiClient<EmailOutboxItem[]>('/outbox', {
      method: 'GET',
    });
    return res.data;
  },

  async getEmailById(id: string): Promise<EmailOutboxItem> {
    const res = await apiClient<EmailOutboxItem>(`/outbox/${id}`, {
      method: 'GET',
    });
    return res.data;
  },
};

