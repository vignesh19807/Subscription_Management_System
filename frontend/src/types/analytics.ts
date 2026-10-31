export interface RevenueDataPoint {
  month: string;
  revenue: number;
  mrr: number;
}

export interface SubscriptionStatusCount {
  status: string;
  count: number;
}

export interface FinancialKPIs {
  activeSubscriptionsCount: number;
  totalInvoicedRevenue: string; // Decimal string
  totalCollectedPayments: string; // Decimal string
  outstandingReceivables: string; // Decimal string
  overdueCount: number;
  overdueAmount: string; // Decimal string
  mrr: string; // Monthly Recurring Revenue
  totalCustomers: number;
  upcomingRenewalsCount: number;
  revenueHistory?: RevenueDataPoint[];
  subscriptionBreakdown?: SubscriptionStatusCount[];
}
