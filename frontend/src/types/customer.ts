export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  address?: string;
  createdAt: string;
  activeSubscriptionsCount: number;
  totalInvoiced: string;
  totalPaid: string;
  outstandingBalance: string;
}

