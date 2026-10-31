export type InvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELLED';

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: string;
  discountAmount?: string;
  taxRate: string;
  lineTotal: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g., INV-2026-0001
  subscriptionId: string;
  customerId: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  billingCycleId: string; // e.g., 2026-10
  subtotal: string;
  discountTotal?: string;
  taxTotal: string;
  totalAmount: string;
  amountPaid: string;
  status: InvoiceStatus;
  lines: InvoiceLine[];
}

