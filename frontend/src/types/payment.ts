export type PaymentMethod =
  | 'BANK_TRANSFER'
  | 'CARD'
  | 'UPI'
  | 'CASH'
  | 'CHEQUE';

export type PaymentStatus = 'COMPLETED' | 'REVERSED';

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  paymentDate: string;
  amount: string; // Exact decimal string
  paymentMethod: PaymentMethod;
  referenceNote?: string;
  status: PaymentStatus;
}
