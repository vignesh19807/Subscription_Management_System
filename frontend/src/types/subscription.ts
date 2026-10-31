import { BillingInterval } from './plan';

export type SubscriptionStatus =
  | 'DRAFT'
  | 'QUOTATION'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'CLOSED';

export interface SubscriptionLine {
  id: string;
  subscriptionId: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: string; // Exact decimal string
  discountAmount: string; // Exact decimal string
}

export interface Subscription {
  id: string;
  subscriptionNumber: string; // e.g., SUB-2026-0001
  customerId: string;
  customerName: string;
  customerEmail: string;
  planId: string;
  planName: string;
  billingInterval: BillingInterval;
  status: SubscriptionStatus;
  startDate: string;
  nextBillingDate: string;
  endDate?: string | null;
  totalAmount: string;
  quotationId?: string | null;
  lines: SubscriptionLine[];
}
