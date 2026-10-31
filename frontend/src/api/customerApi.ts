import { apiClient } from './client';
import { Customer } from '@/types/customer';

export const customerApi = {
  async getCustomers(): Promise<Customer[]> {
    const res = await apiClient<Customer[]>('/customers', { method: 'GET' });
    return res.data;
  },

  async getCustomerById(id: string): Promise<Customer> {
    const res = await apiClient<Customer>(`/customers/${id}`, { method: 'GET' });
    return res.data;
  },

  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'activeSubscriptionsCount' | 'totalInvoiced' | 'totalPaid' | 'outstandingBalance'>): Promise<Customer> {
    const res = await apiClient<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
    return res.data;
  },
};
