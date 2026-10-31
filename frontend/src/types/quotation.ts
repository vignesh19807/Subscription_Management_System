export type QuotationStatus =
  | 'DRAFT'
  | 'QUOTATION'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'CLOSED';

export interface QuotationLine {
  id: string;
  quotationId: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: string; // Base + variant delta
  discountAmount: string;
  taxRate: string;
  lineTotal: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string; // e.g. QUO-2026-0001
  customerId: string;
  customerName: string;
  customerEmail: string;
  planId: string;
  planName: string;
  status: QuotationStatus;
  startDate: string;
  endDate: string | null;
  paymentTerms: string;
  notes?: string;
  lines: QuotationLine[];
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  grandTotal: string;
  createdAt: string;
  convertedSubscriptionId?: string | null;
}
