export type BillingInterval = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface BillingPlan {
  id: string;
  name: string;
  billingInterval: BillingInterval;
  intervalCount: number;
  minQuantity: number;
  validFrom: string;
  validUntil: string | null;
  autoClose: boolean;
  allowEarlyClosure: boolean;
  allowPause: boolean;
  allowRenewal: boolean;
  description?: string;
  isActive: boolean;
}

