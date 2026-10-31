export type DiscountType = 'PERCENTAGE' | 'FIXED';
export type DiscountScope = 'PRODUCT' | 'SUBSCRIPTION';

export interface DiscountRule {
  id: string;
  code: string;
  name: string;
  discountType: DiscountType;
  value: string; // e.g. "10.00" for 10% or fixed ₹10.00
  minOrderAmount: string; // "0.00"
  minQuantity: number;
  validFrom: string;
  validUntil: string | null;
  maxUsageCount: number;
  currentUsageCount: number;
  scope: DiscountScope;
  isActive: boolean;
  createdAt: string;
}
