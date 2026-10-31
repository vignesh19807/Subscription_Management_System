import { apiClient } from './client';
import { Payment, PaymentMethod } from '@/types/payment';
import { Invoice } from '@/types/invoice';

export interface RecordPaymentInput {
  invoiceId: string;
  amount: string; // Exact decimal string
  paymentMethod: PaymentMethod;
  referenceNote?: string;
  paymentDate?: string;
}

export const paymentApi = {
  async getPayments(): Promise<Payment[]> {
    const res = await apiClient<Payment[]>('/payments', { method: 'GET' });
    return res.data;
  },

  async recordPayment(data: RecordPaymentInput): Promise<{ payment: Payment; invoice: Invoice }> {
    const res = await apiClient<{ payment: Payment; invoice: Invoice }>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },
};
