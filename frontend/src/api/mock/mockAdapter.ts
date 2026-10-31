import { User } from '@/types/auth';
import { Product } from '@/types/catalog';
import { BillingPlan } from '@/types/plan';
import { Subscription, SubscriptionStatus } from '@/types/subscription';
import { Invoice } from '@/types/invoice';
import { Payment } from '@/types/payment';
import { FinancialKPIs } from '@/types/analytics';
import { EmailOutboxItem } from '@/types/outbox';
import { TaxRule } from '@/types/tax';
import { DiscountRule } from '@/types/discount';
import { Customer } from '@/types/customer';
import { Quotation, QuotationStatus } from '@/types/quotation';
import Decimal from 'decimal.js';

// State-preserving development mock store
const mockUsers: User[] = [
  {
    id: 'usr_admin_01',
    email: 'admin@brightloop.io',
    fullName: 'Brightloop Administrator',
    role: 'ADMIN',
    createdAt: '2026-10-31T09:00:00Z',
  },
  {
    id: 'usr_staff_01',
    email: 'staff@brightloop.io',
    fullName: 'Billing Specialist',
    role: 'STAFF',
    createdAt: '2026-10-31T09:15:00Z',
  },
  {
    id: 'usr_cust_01',
    email: 'customer@brightloop.io',
    fullName: 'Acme Technologies',
    role: 'CUSTOMER',
    createdAt: '2026-10-31T09:30:00Z',
  },
];

let currentSessionUser: User | null = mockUsers[0] ?? null;

const mockEmailOutbox: EmailOutboxItem[] = [
  {
    id: 'eml_init_01',
    recipientEmail: 'customer@brightloop.io',
    subject: 'Welcome to LoopBill – Account Provisioned',
    bodyContent: 'Your customer account has been created. Use your credentials to sign in to the Customer Portal.',
    emailType: 'CUSTOMER_WELCOME',
    status: 'SENT',
    sentAt: '2026-10-31T09:30:05Z',
    createdAt: '2026-10-31T09:30:00Z',
  },
];

const mockCustomers: Customer[] = [
  {
    id: 'cust_001',
    name: 'Acme Technologies',
    email: 'customer@brightloop.io',
    phone: '+91 98765 43210',
    companyName: 'Acme Corp Pvt Ltd',
    address: 'Bengaluru, Karnataka, India',
    createdAt: '2026-10-15T00:00:00Z',
    activeSubscriptionsCount: 1,
    totalInvoiced: '1560.00',
    totalPaid: '1560.00',
    outstandingBalance: '0.00',
  },
  {
    id: 'cust_002',
    name: 'BrightSoft Solutions',
    email: 'contact@brightsoft.dev',
    phone: '+91 98111 22233',
    companyName: 'BrightSoft Dev Labs',
    address: 'Hyderabad, Telangana, India',
    createdAt: '2026-10-20T00:00:00Z',
    activeSubscriptionsCount: 1,
    totalInvoiced: '2800.00',
    totalPaid: '1400.00',
    outstandingBalance: '1400.00',
  },
];

const mockProducts: Product[] = [
  {
    id: 'prod_erp_01',
    name: 'LoopBill Core Software',
    productType: 'SOFTWARE',
    salesPrice: '1000.00',
    costPrice: '400.00',
    notes: 'Primary SaaS billing platform base license',
    isActive: true,
    variants: [
      {
        id: 'var_odoo_01',
        productId: 'prod_erp_01',
        variantName: 'Odoo Enterprise Surcharge',
        priceDelta: '560.00', // Mandatory ₹560 delta
        sku: 'LOOP-VAR-ODOO-560',
      },
      {
        id: 'var_audit_02',
        productId: 'prod_erp_01',
        variantName: 'Audit Compliance Module',
        priceDelta: '250.00',
        sku: 'LOOP-VAR-AUDIT-250',
      },
    ],
  },
  {
    id: 'prod_support_02',
    name: '24/7 Dedicated Support',
    productType: 'SERVICE',
    salesPrice: '500.00',
    costPrice: '200.00',
    notes: 'Round-the-clock priority SLA support',
    isActive: true,
    variants: [],
  },
  {
    id: 'prod_hw_03',
    name: 'FIDO2 Hardware Security Key',
    productType: 'HARDWARE',
    salesPrice: '1200.00',
    costPrice: '700.00',
    notes: 'Physical MFA key for staff access',
    isActive: true,
    variants: [],
  },
];

const mockPlans: BillingPlan[] = [
  {
    id: 'plan_monthly_01',
    name: 'Standard Monthly Cloud',
    billingInterval: 'MONTHLY',
    intervalCount: 1,
    minQuantity: 1,
    validFrom: '2026-01-01T00:00:00Z',
    validUntil: null,
    autoClose: false,
    allowEarlyClosure: true,
    allowPause: true,
    allowRenewal: true,
    description: 'Billed monthly with pause and renewal flexibility',
    isActive: true,
  },
  {
    id: 'plan_annual_02',
    name: 'Enterprise Annual Commitment',
    billingInterval: 'YEARLY',
    intervalCount: 1,
    minQuantity: 5,
    validFrom: '2026-01-01T00:00:00Z',
    validUntil: '2028-12-31T00:00:00Z',
    autoClose: false,
    allowEarlyClosure: false,
    allowPause: false, // Strict governance: pause disabled
    allowRenewal: true,
    description: 'Fixed 1-year contract. Early pause disallowed.',
    isActive: true,
  },
  {
    id: 'plan_weekly_03',
    name: 'Weekly Sprint Pilot',
    billingInterval: 'WEEKLY',
    intervalCount: 1,
    minQuantity: 1,
    validFrom: '2026-01-01T00:00:00Z',
    validUntil: null,
    autoClose: true,
    allowEarlyClosure: true,
    allowPause: true,
    allowRenewal: false,
    description: 'Auto-closing weekly test package',
    isActive: true,
  },
];

const mockTaxes: TaxRule[] = [
  {
    id: 'tax_gst_18',
    name: 'GST @ 18%',
    rate: '18.00',
    taxType: 'PERCENTAGE',
    description: 'Goods & Services Tax for India',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'tax_vat_5',
    name: 'VAT @ 5%',
    rate: '5.00',
    taxType: 'PERCENTAGE',
    description: 'Standard value added tax',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'tax_zero_0',
    name: 'Export / Zero Tax (0%)',
    rate: '0.00',
    taxType: 'PERCENTAGE',
    description: 'Tax exemption for cross-border transactions',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const mockDiscounts: DiscountRule[] = [
  {
    id: 'disc_welcome_10',
    code: 'WELCOME10',
    name: 'New Client 10% Off',
    discountType: 'PERCENTAGE',
    value: '10.00',
    minOrderAmount: '1000.00',
    minQuantity: 1,
    validFrom: '2026-01-01T00:00:00Z',
    validUntil: '2027-12-31T00:00:00Z',
    maxUsageCount: 100,
    currentUsageCount: 14,
    scope: 'SUBSCRIPTION',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'disc_flat_500',
    code: 'FLAT500',
    name: 'Flat ₹500 Loyalty Bonus',
    discountType: 'FIXED',
    value: '500.00',
    minOrderAmount: '2000.00',
    minQuantity: 1,
    validFrom: '2026-01-01T00:00:00Z',
    validUntil: null,
    maxUsageCount: 50,
    currentUsageCount: 5,
    scope: 'PRODUCT',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const mockQuotations: Quotation[] = [
  {
    id: 'quo_001',
    quotationNumber: 'QUO-2026-0001',
    customerId: 'cust_001',
    customerName: 'Acme Technologies',
    customerEmail: 'customer@brightloop.io',
    planId: 'plan_monthly_01',
    planName: 'Standard Monthly Cloud',
    status: 'ACTIVE',
    startDate: '2026-10-01T00:00:00Z',
    endDate: null,
    paymentTerms: 'Immediate',
    notes: 'Initial quotation with Odoo variant surcharge (+₹560)',
    lines: [
      {
        id: 'q_line_01',
        quotationId: 'quo_001',
        productId: 'prod_erp_01',
        productName: 'LoopBill Core Software',
        variantId: 'var_odoo_01',
        variantName: 'Odoo Enterprise Surcharge',
        quantity: 1,
        unitPrice: '1560.00', // 1000 base + 560 delta
        discountAmount: '0.00',
        taxRate: '0.00',
        lineTotal: '1560.00',
      },
    ],
    subtotal: '1560.00',
    discountTotal: '0.00',
    taxTotal: '0.00',
    grandTotal: '1560.00',
    createdAt: '2026-09-28T10:00:00Z',
    convertedSubscriptionId: 'sub_001',
  },
  {
    id: 'quo_002',
    quotationNumber: 'QUO-2026-0002',
    customerId: 'cust_002',
    customerName: 'BrightSoft Solutions',
    customerEmail: 'contact@brightsoft.dev',
    planId: 'plan_monthly_01',
    planName: 'Standard Monthly Cloud',
    status: 'QUOTATION',
    startDate: '2026-11-01T00:00:00Z',
    endDate: null,
    paymentTerms: 'Net 15',
    notes: 'Draft proposal pending management confirmation',
    lines: [
      {
        id: 'q_line_02',
        quotationId: 'quo_002',
        productId: 'prod_erp_01',
        productName: 'LoopBill Core Software',
        variantId: 'var_odoo_01',
        variantName: 'Odoo Enterprise Surcharge',
        quantity: 1,
        unitPrice: '1560.00',
        discountAmount: '160.00',
        taxRate: '18.00',
        lineTotal: '1652.00',
      },
    ],
    subtotal: '1560.00',
    discountTotal: '160.00',
    taxTotal: '252.00',
    grandTotal: '1652.00',
    createdAt: '2026-10-25T11:30:00Z',
    convertedSubscriptionId: null,
  },
];

const mockSubscriptions: Subscription[] = [
  {
    id: 'sub_001',
    subscriptionNumber: 'SUB-2026-0001',
    customerId: 'cust_001',
    customerName: 'Acme Technologies',
    customerEmail: 'customer@brightloop.io',
    planId: 'plan_monthly_01',
    planName: 'Standard Monthly Cloud',
    billingInterval: 'MONTHLY',
    status: 'ACTIVE',
    startDate: '2026-10-01T00:00:00Z',
    nextBillingDate: '2026-11-01T00:00:00Z',
    endDate: null,
    totalAmount: '1560.00',
    quotationId: 'quo_001',
    lines: [
      {
        id: 'sub_line_01',
        subscriptionId: 'sub_001',
        productId: 'prod_erp_01',
        productName: 'LoopBill Core Software',
        variantId: 'var_odoo_01',
        variantName: 'Odoo Enterprise Surcharge',
        quantity: 1,
        unitPrice: '1560.00',
        discountAmount: '0.00',
      },
    ],
  },
  {
    id: 'sub_002',
    subscriptionNumber: 'SUB-2026-0002',
    customerId: 'cust_002',
    customerName: 'BrightSoft Solutions',
    customerEmail: 'contact@brightsoft.dev',
    planId: 'plan_monthly_01',
    planName: 'Standard Monthly Cloud',
    billingInterval: 'MONTHLY',
    status: 'ACTIVE',
    startDate: '2026-10-15T00:00:00Z',
    nextBillingDate: '2026-11-01T00:00:00Z', // Due for billing
    endDate: null,
    totalAmount: '2800.00',
    quotationId: null,
    lines: [
      {
        id: 'sub_line_02',
        subscriptionId: 'sub_002',
        productId: 'prod_erp_01',
        productName: 'LoopBill Core Software',
        variantId: 'var_odoo_01',
        variantName: 'Odoo Enterprise Surcharge',
        quantity: 1,
        unitPrice: '1560.00',
        discountAmount: '0.00',
      },
      {
        id: 'sub_line_03',
        subscriptionId: 'sub_002',
        productId: 'prod_hw_03',
        productName: 'FIDO2 Hardware Security Key',
        quantity: 1,
        unitPrice: '1240.00',
        discountAmount: '0.00',
      },
    ],
  },
];

const mockInvoices: Invoice[] = [
  {
    id: 'inv_001',
    invoiceNumber: 'INV-2026-0001',
    subscriptionId: 'sub_001',
    customerId: 'cust_001',
    customerName: 'Acme Technologies',
    issueDate: '2026-10-01T00:00:00Z',
    dueDate: '2026-10-15T00:00:00Z',
    billingCycleId: '2026-10',
    subtotal: '1560.00',
    discountTotal: '0.00',
    taxTotal: '0.00',
    totalAmount: '1560.00',
    amountPaid: '1560.00',
    status: 'PAID',
    lines: [
      {
        id: 'inv_line_01',
        invoiceId: 'inv_001',
        productId: 'prod_erp_01',
        description: 'LoopBill Core Software (Odoo Enterprise Surcharge)',
        quantity: 1,
        unitPrice: '1560.00',
        discountAmount: '0.00',
        taxRate: '0.00',
        lineTotal: '1560.00',
      },
    ],
  },
  {
    id: 'inv_002',
    invoiceNumber: 'INV-2026-0002',
    subscriptionId: 'sub_002',
    customerId: 'cust_002',
    customerName: 'BrightSoft Solutions',
    issueDate: '2026-10-15T00:00:00Z',
    dueDate: '2026-10-25T00:00:00Z', // Overdue
    billingCycleId: '2026-10',
    subtotal: '2800.00',
    discountTotal: '0.00',
    taxTotal: '0.00',
    totalAmount: '2800.00',
    amountPaid: '1400.00',
    status: 'CONFIRMED',
    lines: [
      {
        id: 'inv_line_02',
        invoiceId: 'inv_002',
        productId: 'prod_erp_01',
        description: 'LoopBill Core Software (Odoo Enterprise Surcharge)',
        quantity: 1,
        unitPrice: '1560.00',
        taxRate: '0.00',
        lineTotal: '1560.00',
      },
      {
        id: 'inv_line_03',
        invoiceId: 'inv_002',
        productId: 'prod_hw_03',
        description: 'FIDO2 Hardware Security Key',
        quantity: 1,
        unitPrice: '1240.00',
        taxRate: '0.00',
        lineTotal: '1240.00',
      },
    ],
  },
];

const mockPayments: Payment[] = [
  {
    id: 'pay_001',
    invoiceId: 'inv_001',
    invoiceNumber: 'INV-2026-0001',
    customerId: 'cust_001',
    customerName: 'Acme Technologies',
    paymentDate: '2026-10-05T10:30:00Z',
    amount: '1560.00',
    paymentMethod: 'UPI',
    referenceNote: 'UPI/REF/9847192837',
    status: 'COMPLETED',
  },
  {
    id: 'pay_002',
    invoiceId: 'inv_002',
    invoiceNumber: 'INV-2026-0002',
    customerId: 'cust_002',
    customerName: 'BrightSoft Solutions',
    paymentDate: '2026-10-18T14:20:00Z',
    amount: '1400.00',
    paymentMethod: 'BANK_TRANSFER',
    referenceNote: 'IMPS/NEFT/67891234',
    status: 'COMPLETED',
  },
];

// Helper to compute live KPIs accurately from store
function computeLiveKPIs(): FinancialKPIs {
  let totalInvoiced = new Decimal(0);
  let totalCollected = new Decimal(0);
  let outstanding = new Decimal(0);
  let overdueAmount = new Decimal(0);
  let overdueCount = 0;
  const now = new Date().toISOString();

  for (const inv of mockInvoices) {
    if (inv.status !== 'CANCELLED') {
      const invTotal = new Decimal(inv.totalAmount || 0);
      const paid = new Decimal(inv.amountPaid || 0);
      const balance = invTotal.minus(paid);

      totalInvoiced = totalInvoiced.plus(invTotal);
      totalCollected = totalCollected.plus(paid);
      outstanding = outstanding.plus(balance);

      if (balance.gt(0) && inv.dueDate < now) {
        overdueCount += 1;
        overdueAmount = overdueAmount.plus(balance);
      }
    }
  }

  let mrr = new Decimal(0);
  for (const sub of mockSubscriptions) {
    if (sub.status === 'ACTIVE') {
      const amount = new Decimal(sub.totalAmount || 0);
      if (sub.billingInterval === 'MONTHLY') {
        mrr = mrr.plus(amount);
      } else if (sub.billingInterval === 'YEARLY') {
        mrr = mrr.plus(amount.dividedBy(12));
      } else if (sub.billingInterval === 'WEEKLY') {
        mrr = mrr.plus(amount.times(4.33));
      }
    }
  }

  return {
    activeSubscriptionsCount: mockSubscriptions.filter((s) => s.status === 'ACTIVE').length,
    totalInvoicedRevenue: totalInvoiced.toFixed(2),
    totalCollectedPayments: totalCollected.toFixed(2),
    outstandingReceivables: outstanding.toFixed(2),
    overdueCount,
    overdueAmount: overdueAmount.toFixed(2),
    mrr: mrr.toFixed(2),
    totalCustomers: mockCustomers.length,
    upcomingRenewalsCount: mockSubscriptions.filter((s) => s.status === 'ACTIVE').length,
    revenueHistory: [
      { month: 'Jun', revenue: 12000, mrr: 8500 },
      { month: 'Jul', revenue: 14500, mrr: 10200 },
      { month: 'Aug', revenue: 18000, mrr: 12800 },
      { month: 'Sep', revenue: 22400, mrr: 15600 },
      { month: 'Oct', revenue: 26800, mrr: 19400 },
      { month: 'Nov', revenue: 31200, mrr: 23100 },
    ],
    subscriptionBreakdown: [
      { status: 'ACTIVE', count: mockSubscriptions.filter((s) => s.status === 'ACTIVE').length },
      { status: 'PAUSED', count: mockSubscriptions.filter((s) => s.status === 'PAUSED').length },
      { status: 'CLOSED', count: mockSubscriptions.filter((s) => s.status === 'CLOSED').length },
      { status: 'DRAFT', count: mockSubscriptions.filter((s) => s.status === 'DRAFT').length },
    ],
  };
}

export async function handleMockRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; latencyMs: number }> {
  // Simulate network latency (between 60ms and 140ms)
  const simulatedLatency = Math.floor(Math.random() * 60) + 50;
  await new Promise((resolve) => setTimeout(resolve, simulatedLatency));

  const method = (options.method || 'GET').toUpperCase();
  const cleanPath = endpoint.split('?')[0] ?? '';
  let payload: Record<string, unknown> = {};

  if (options.body && typeof options.body === 'string') {
    try {
      payload = JSON.parse(options.body) as Record<string, unknown>;
    } catch {
      // payload not JSON
    }
  }

  let result: unknown = null;

  // --- Auth & Session Routes ---
  if (cleanPath === '/auth/session' || cleanPath === '/auth/me') {
    result = { user: currentSessionUser, isAuthenticated: currentSessionUser !== null };
  } else if (cleanPath === '/auth/login' && method === 'POST') {
    const email = String(payload.email || '').trim().toLowerCase();
    const matchedUser = mockUsers.find((u) => u.email.toLowerCase() === email);

    if (matchedUser) {
      currentSessionUser = matchedUser;
    } else {
      const role = email.includes('admin') ? 'ADMIN' : email.includes('staff') ? 'STAFF' : 'CUSTOMER';
      const newUser: User = {
        id: `usr_${Date.now()}`,
        email,
        fullName: email.split('@')[0]?.replace('.', ' ').toUpperCase() || 'User',
        role,
        createdAt: new Date().toISOString(),
      };
      mockUsers.push(newUser);
      currentSessionUser = newUser;
    }
    result = { user: currentSessionUser };
  } else if (cleanPath === '/auth/register' && method === 'POST') {
    const email = String(payload.email || '').trim().toLowerCase();
    const fullName = String(payload.fullName || '').trim();

    const exists = mockUsers.some((u) => u.email.toLowerCase() === email);
    if (exists) {
      throw new Error('An account with this email address already exists. Please sign in or use a different email.');
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      email,
      fullName: fullName || 'New Customer',
      role: 'CUSTOMER',
      createdAt: new Date().toISOString(),
    };
    mockUsers.push(newUser);
    currentSessionUser = newUser;

    // Also add to customers list
    mockCustomers.push({
      id: `cust_${Date.now()}`,
      name: newUser.fullName,
      email: newUser.email,
      createdAt: new Date().toISOString(),
      activeSubscriptionsCount: 0,
      totalInvoiced: '0.00',
      totalPaid: '0.00',
      outstandingBalance: '0.00',
    });

    mockEmailOutbox.unshift({
      id: `eml_${Date.now()}`,
      recipientUserId: newUser.id,
      recipientEmail: newUser.email,
      subject: 'Welcome to LoopBill – Registration Complete',
      bodyContent: `Hello ${newUser.fullName},\n\nWelcome to Brightloop Software. Your customer account is active.`,
      emailType: 'CUSTOMER_WELCOME',
      status: 'SENT',
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    result = { user: newUser };
  } else if (cleanPath === '/auth/logout' && method === 'POST') {
    currentSessionUser = null;
    result = { message: 'Logged out successfully' };
  } else if (cleanPath === '/auth/forgot-password' && method === 'POST') {
    const email = String(payload.email || '').trim().toLowerCase();
    const token = `rst_${Math.random().toString(36).substring(2, 12)}`;

    mockEmailOutbox.unshift({
      id: `eml_${Date.now()}`,
      recipientEmail: email,
      subject: 'LoopBill Password Reset Request',
      bodyContent: `Password recovery token: ${token}\nLink: http://localhost:3000/reset-password?token=${token}`,
      emailType: 'PASSWORD_RESET',
      status: 'SENT',
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    result = { message: 'Password recovery instruction dispatched to local outbox.' };
  } else if (cleanPath === '/auth/reset-password' && method === 'POST') {
    result = { message: 'Password updated successfully.' };
  } else if (cleanPath === '/admin/users/staff') {
    if (method === 'POST') {
      const email = String(payload.email || '').trim().toLowerCase();
      const fullName = String(payload.fullName || '').trim();
      const newStaff: User = {
        id: `usr_staff_${Date.now()}`,
        email,
        fullName: fullName || 'Staff Specialist',
        role: 'STAFF',
        createdAt: new Date().toISOString(),
      };
      mockUsers.push(newStaff);
      result = { user: newStaff };
    } else {
      result = mockUsers.filter((u) => u.role === 'STAFF');
    }
  }

  // --- Outbox Routes ---
  else if (cleanPath === '/outbox') {
    result = mockEmailOutbox;
  } else if (cleanPath.startsWith('/outbox/')) {
    const id = cleanPath.replace('/outbox/', '');
    result = mockEmailOutbox.find((e) => e.id === id) || null;
  }

  // --- Products Catalog Routes ---
  else if (cleanPath === '/products') {
    if (method === 'GET') {
      result = mockProducts;
    } else if (method === 'POST') {
      const newProd: Product = {
        id: `prod_${Date.now()}`,
        name: String(payload.name || 'New Product'),
        productType: (payload.productType as Product['productType']) || 'SOFTWARE',
        salesPrice: new Decimal(Number(payload.salesPrice) || 0).toFixed(2),
        costPrice: new Decimal(Number(payload.costPrice) || 0).toFixed(2),
        notes: String(payload.notes || ''),
        isActive: payload.isActive !== false,
        variants: Array.isArray(payload.variants) ? (payload.variants as Product['variants']) : [],
      };
      mockProducts.unshift(newProd);
      result = newProd;
    }
  } else if (cleanPath.startsWith('/products/') && cleanPath.endsWith('/variants') && method === 'POST') {
    const productId = cleanPath.split('/')[2];
    const product = mockProducts.find((p) => p.id === productId);
    if (!product) throw new Error('Product not found');
    const newVariant = {
      id: `var_${Date.now()}`,
      productId: product.id,
      variantName: String(payload.variantName || 'New Variant'),
      priceDelta: new Decimal(Number(payload.priceDelta) || 0).toFixed(2),
      sku: String(payload.sku || `SKU-${Date.now()}`),
    };
    if (!product.variants) product.variants = [];
    product.variants.push(newVariant);
    result = newVariant;
  } else if (cleanPath.startsWith('/products/')) {
    const id = cleanPath.replace('/products/', '');
    const productIndex = mockProducts.findIndex((p) => p.id === id);
    if (method === 'GET') {
      result = mockProducts[productIndex] || null;
    } else if (method === 'PUT') {
      if (productIndex !== -1 && mockProducts[productIndex]) {
        mockProducts[productIndex] = {
          ...mockProducts[productIndex],
          ...payload,
        } as Product;
        result = mockProducts[productIndex];
      }
    } else if (method === 'DELETE') {
      if (productIndex !== -1) mockProducts.splice(productIndex, 1);
      result = { success: true };
    }
  }

  // --- Plans Routes ---
  else if (cleanPath === '/plans') {
    if (method === 'GET') {
      result = mockPlans;
    } else if (method === 'POST') {
      const newPlan: BillingPlan = {
        id: `plan_${Date.now()}`,
        name: String(payload.name || 'New Plan'),
        billingInterval: (payload.billingInterval as BillingPlan['billingInterval']) || 'MONTHLY',
        intervalCount: Number(payload.intervalCount) || 1,
        minQuantity: Number(payload.minQuantity) || 1,
        validFrom: String(payload.validFrom || new Date().toISOString()),
        validUntil: payload.validUntil ? String(payload.validUntil) : null,
        autoClose: Boolean(payload.autoClose),
        allowEarlyClosure: Boolean(payload.allowEarlyClosure),
        allowPause: Boolean(payload.allowPause),
        allowRenewal: Boolean(payload.allowRenewal),
        description: String(payload.description || ''),
        isActive: payload.isActive !== false,
      };
      mockPlans.unshift(newPlan);
      result = newPlan;
    }
  } else if (cleanPath.startsWith('/plans/')) {
    const id = cleanPath.replace('/plans/', '');
    const planIndex = mockPlans.findIndex((p) => p.id === id);
    if (method === 'GET') {
      result = mockPlans[planIndex] || null;
    } else if (method === 'PUT' || method === 'PATCH') {
      if (planIndex !== -1 && mockPlans[planIndex]) {
        mockPlans[planIndex] = { ...mockPlans[planIndex], ...payload } as BillingPlan;
        result = mockPlans[planIndex];
      }
    }
  }

  // --- Taxes Routes ---
  else if (cleanPath === '/taxes') {
    if (method === 'GET') {
      result = mockTaxes;
    } else if (method === 'POST') {
      const newTax: TaxRule = {
        id: `tax_${Date.now()}`,
        name: String(payload.name || 'Tax Rule'),
        rate: new Decimal(Number(payload.rate) || 0).toFixed(2),
        taxType: (payload.taxType as TaxRule['taxType']) || 'PERCENTAGE',
        description: String(payload.description || ''),
        isActive: payload.isActive !== false,
        createdAt: new Date().toISOString(),
      };
      mockTaxes.unshift(newTax);
      result = newTax;
    }
  } else if (cleanPath.startsWith('/taxes/')) {
    const id = cleanPath.replace('/taxes/', '');
    const taxIndex = mockTaxes.findIndex((t) => t.id === id);
    if (taxIndex !== -1 && mockTaxes[taxIndex]) {
      mockTaxes[taxIndex] = { ...mockTaxes[taxIndex], ...payload } as TaxRule;
      result = mockTaxes[taxIndex];
    }
  }

  // --- Discounts Routes ---
  else if (cleanPath === '/discounts') {
    if (method === 'GET') {
      result = mockDiscounts;
    } else if (method === 'POST') {
      const newDiscount: DiscountRule = {
        id: `disc_${Date.now()}`,
        code: String(payload.code || `PROMO${Date.now()}`).toUpperCase(),
        name: String(payload.name || 'Promotional Discount'),
        discountType: (payload.discountType as DiscountRule['discountType']) || 'PERCENTAGE',
        value: new Decimal(Number(payload.value) || 0).toFixed(2),
        minOrderAmount: new Decimal(Number(payload.minOrderAmount) || 0).toFixed(2),
        minQuantity: Number(payload.minQuantity) || 1,
        validFrom: String(payload.validFrom || new Date().toISOString()),
        validUntil: payload.validUntil ? String(payload.validUntil) : null,
        maxUsageCount: Number(payload.maxUsageCount) || 100,
        currentUsageCount: 0,
        scope: (payload.scope as DiscountRule['scope']) || 'SUBSCRIPTION',
        isActive: payload.isActive !== false,
        createdAt: new Date().toISOString(),
      };
      mockDiscounts.unshift(newDiscount);
      result = newDiscount;
    }
  } else if (cleanPath.startsWith('/discounts/')) {
    const id = cleanPath.replace('/discounts/', '');
    const discIndex = mockDiscounts.findIndex((d) => d.id === id);
    if (discIndex !== -1 && mockDiscounts[discIndex]) {
      mockDiscounts[discIndex] = { ...mockDiscounts[discIndex], ...payload } as DiscountRule;
      result = mockDiscounts[discIndex];
    }
  }

  // --- Customers Routes ---
  else if (cleanPath === '/customers') {
    if (method === 'GET') {
      // In Customer session, enforce tenant isolation
      if (currentSessionUser?.role === 'CUSTOMER') {
        result = mockCustomers.filter((c) => c.email.toLowerCase() === currentSessionUser?.email.toLowerCase());
      } else {
        result = mockCustomers;
      }
    } else if (method === 'POST') {
      const newCust: Customer = {
        id: `cust_${Date.now()}`,
        name: String(payload.name || 'New Customer'),
        email: String(payload.email || ''),
        phone: String(payload.phone || ''),
        companyName: String(payload.companyName || ''),
        address: String(payload.address || ''),
        createdAt: new Date().toISOString(),
        activeSubscriptionsCount: 0,
        totalInvoiced: '0.00',
        totalPaid: '0.00',
        outstandingBalance: '0.00',
      };
      mockCustomers.unshift(newCust);
      result = newCust;
    }
  } else if (cleanPath.startsWith('/customers/')) {
    const id = cleanPath.replace('/customers/', '');
    result = mockCustomers.find((c) => c.id === id) || null;
  }

  // --- Quotations Routes ---
  else if (cleanPath === '/quotations') {
    if (method === 'GET') {
      if (currentSessionUser?.role === 'CUSTOMER') {
        result = mockQuotations.filter((q) => q.customerEmail.toLowerCase() === currentSessionUser?.email.toLowerCase());
      } else {
        result = mockQuotations;
      }
    } else if (method === 'POST') {
      const newQuo: Quotation = {
        id: `quo_${Date.now()}`,
        quotationNumber: `QUO-2026-${String(mockQuotations.length + 1).padStart(4, '0')}`,
        customerId: String(payload.customerId || ''),
        customerName: String(payload.customerName || 'Customer'),
        customerEmail: String(payload.customerEmail || ''),
        planId: String(payload.planId || ''),
        planName: String(payload.planName || ''),
        status: 'DRAFT',
        startDate: String(payload.startDate || new Date().toISOString()),
        endDate: payload.endDate ? String(payload.endDate) : null,
        paymentTerms: String(payload.paymentTerms || 'Immediate'),
        notes: String(payload.notes || ''),
        lines: Array.isArray(payload.lines) ? (payload.lines as Quotation['lines']) : [],
        subtotal: String(payload.subtotal || '0.00'),
        discountTotal: String(payload.discountTotal || '0.00'),
        taxTotal: String(payload.taxTotal || '0.00'),
        grandTotal: String(payload.grandTotal || '0.00'),
        createdAt: new Date().toISOString(),
      };
      mockQuotations.unshift(newQuo);
      result = newQuo;
    }
  } else if (cleanPath.startsWith('/quotations/') && cleanPath.endsWith('/status') && method === 'PATCH') {
    const id = cleanPath.split('/')[2];
    const quo = mockQuotations.find((q) => q.id === id);
    if (!quo) throw new Error('Quotation not found');
    quo.status = (payload.status as QuotationStatus) || quo.status;
    result = quo;
  } else if (cleanPath.startsWith('/quotations/') && cleanPath.endsWith('/convert') && method === 'POST') {
    const id = cleanPath.split('/')[2];
    const quo = mockQuotations.find((q) => q.id === id);
    if (!quo) throw new Error('Quotation not found');

    quo.status = 'ACTIVE';
    const newSub: Subscription = {
      id: `sub_${Date.now()}`,
      subscriptionNumber: `SUB-2026-${String(mockSubscriptions.length + 1).padStart(4, '0')}`,
      customerId: quo.customerId,
      customerName: quo.customerName,
      customerEmail: quo.customerEmail,
      planId: quo.planId,
      planName: quo.planName,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
      startDate: quo.startDate,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: quo.endDate,
      totalAmount: quo.grandTotal,
      quotationId: quo.id,
      lines: quo.lines.map((l) => ({
        id: `sline_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        subscriptionId: `sub_${Date.now()}`,
        productId: l.productId,
        productName: l.productName,
        variantId: l.variantId,
        variantName: l.variantName,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discountAmount: l.discountAmount,
      })),
    };
    mockSubscriptions.unshift(newSub);
    quo.convertedSubscriptionId = newSub.id;

    // Update customer active subscription count
    const cust = mockCustomers.find((c) => c.id === quo.customerId);
    if (cust) cust.activeSubscriptionsCount += 1;

    result = { quotation: quo, subscription: newSub };
  } else if (cleanPath.startsWith('/quotations/')) {
    const id = cleanPath.replace('/quotations/', '');
    result = mockQuotations.find((q) => q.id === id) || null;
  }

  // --- Subscriptions Routes ---
  else if (cleanPath === '/subscriptions') {
    if (currentSessionUser?.role === 'CUSTOMER') {
      result = mockSubscriptions.filter((s) => s.customerEmail.toLowerCase() === currentSessionUser?.email.toLowerCase());
    } else {
      result = mockSubscriptions;
    }
  } else if (cleanPath.startsWith('/subscriptions/') && cleanPath.endsWith('/status') && method === 'PATCH') {
    const id = cleanPath.split('/')[2];
    const sub = mockSubscriptions.find((s) => s.id === id);
    if (!sub) throw new Error('Subscription not found');

    const newStatus = payload.status as SubscriptionStatus;
    const plan = mockPlans.find((p) => p.id === sub.planId);

    // Enforce Plan Governance Flags
    if (newStatus === 'PAUSED' && plan && !plan.allowPause) {
      throw new Error(`Plan "${plan.name}" does not allow pausing.`);
    }
    if (newStatus === 'CLOSED' && plan && !plan.allowEarlyClosure) {
      throw new Error(`Plan "${plan.name}" does not allow early termination.`);
    }

    sub.status = newStatus;
    result = sub;
  } else if (cleanPath.startsWith('/subscriptions/') && cleanPath.endsWith('/renew') && method === 'POST') {
    const id = cleanPath.split('/')[2];
    const sub = mockSubscriptions.find((s) => s.id === id);
    if (!sub) throw new Error('Subscription not found');

    const plan = mockPlans.find((p) => p.id === sub.planId);
    if (plan && !plan.allowRenewal) {
      throw new Error(`Plan "${plan.name}" policy does not permit renewal.`);
    }

    // Advance next billing date by 1 month
    const currentDate = new Date(sub.nextBillingDate || sub.startDate);
    currentDate.setMonth(currentDate.getMonth() + 1);
    sub.nextBillingDate = currentDate.toISOString();
    sub.status = 'ACTIVE';
    result = sub;
  } else if (cleanPath.startsWith('/subscriptions/')) {
    const id = cleanPath.replace('/subscriptions/', '');
    result = mockSubscriptions.find((s) => s.id === id) || null;
  }

  // --- Invoices Routes ---
  else if (cleanPath === '/invoices') {
    if (currentSessionUser?.role === 'CUSTOMER') {
      result = mockInvoices.filter((i) => i.customerName.toLowerCase() === currentSessionUser?.fullName.toLowerCase());
    } else {
      result = mockInvoices;
    }
  } else if (cleanPath.startsWith('/invoices/') && cleanPath.endsWith('/confirm') && method === 'POST') {
    const id = cleanPath.split('/')[2];
    const inv = mockInvoices.find((i) => i.id === id);
    if (!inv) throw new Error('Invoice not found');
    inv.status = 'CONFIRMED';
    result = inv;
  } else if (cleanPath.startsWith('/invoices/')) {
    const id = cleanPath.replace('/invoices/', '');
    result = mockInvoices.find((i) => i.id === id) || null;
  }

  // --- Recurring Billing Engine (Dry-Run vs Real Execution) ---
  else if (cleanPath === '/billing/dry-run' && method === 'POST') {
    // CRITICAL: Zero database writes! Return simulation summary only
    const targetDate = String(payload.targetDate || new Date().toISOString().substring(0, 10));
    const cycleId = targetDate.substring(0, 7); // e.g. "2026-11"

    const eligibleSubs = mockSubscriptions.filter((s) => {
      if (s.status !== 'ACTIVE') return false;
      const nextDate = s.nextBillingDate.substring(0, 10);
      return nextDate <= targetDate;
    });

    let projectedTotal = new Decimal(0);
    const simulatedInvoices: Invoice[] = [];

    eligibleSubs.forEach((sub, idx) => {
      const subAmount = new Decimal(sub.totalAmount);
      projectedTotal = projectedTotal.plus(subAmount);

      simulatedInvoices.push({
        id: `sim_inv_${idx + 1}`,
        invoiceNumber: `SIM-INV-${cycleId}-${String(idx + 1).padStart(3, '0')}`,
        subscriptionId: sub.id,
        customerId: sub.customerId,
        customerName: sub.customerName,
        issueDate: targetDate,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        billingCycleId: cycleId,
        subtotal: subAmount.toFixed(2),
        taxTotal: '0.00',
        totalAmount: subAmount.toFixed(2),
        amountPaid: '0.00',
        status: 'DRAFT',
        lines: sub.lines.map((l, lIdx) => ({
          id: `sim_line_${lIdx}`,
          invoiceId: `sim_inv_${idx + 1}`,
          productId: l.productId,
          description: `${l.productName}${l.variantName ? ` (${l.variantName})` : ''}`,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: '0.00',
          lineTotal: new Decimal(l.unitPrice).times(l.quantity).toFixed(2),
        })),
      });
    });

    result = {
      isDryRun: true,
      targetDate,
      totalEligible: eligibleSubs.length,
      invoicesGenerated: simulatedInvoices.length,
      skippedCount: 0,
      invoices: simulatedInvoices,
      simulatedSummary: {
        totalRevenueProjected: projectedTotal.toFixed(2),
        subscriptionsAffected: eligibleSubs.map((s) => `${s.subscriptionNumber} (${s.customerName})`),
      },
    };
  } else if (cleanPath === '/billing/execute' && method === 'POST') {
    // REAL Billing Run with Idempotency composite check: (subscription_id, billing_cycle_id)
    const targetDate = String(payload.targetDate || new Date().toISOString().substring(0, 10));
    const cycleId = targetDate.substring(0, 7); // e.g. "2026-11"

    const eligibleSubs = mockSubscriptions.filter((s) => {
      if (s.status !== 'ACTIVE') return false;
      const nextDate = s.nextBillingDate.substring(0, 10);
      return nextDate <= targetDate;
    });

    const createdInvoices: Invoice[] = [];
    let skipped = 0;

    eligibleSubs.forEach((sub) => {
      // Idempotency check: has this subscription already been billed for this cycleId?
      const alreadyBilled = mockInvoices.some(
        (inv) => inv.subscriptionId === sub.id && inv.billingCycleId === cycleId && inv.status !== 'CANCELLED'
      );

      if (alreadyBilled) {
        skipped += 1;
        return;
      }

      const invTotal = new Decimal(sub.totalAmount);
      const newInvoice: Invoice = {
        id: `inv_${Date.now()}_${sub.id}`,
        invoiceNumber: `INV-2026-${String(mockInvoices.length + 1).padStart(4, '0')}`,
        subscriptionId: sub.id,
        customerId: sub.customerId,
        customerName: sub.customerName,
        issueDate: targetDate,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        billingCycleId: cycleId,
        subtotal: invTotal.toFixed(2),
        discountTotal: '0.00',
        taxTotal: '0.00',
        totalAmount: invTotal.toFixed(2),
        amountPaid: '0.00',
        status: 'CONFIRMED',
        lines: sub.lines.map((l, lIdx) => ({
          id: `inv_line_${Date.now()}_${lIdx}`,
          invoiceId: `inv_${Date.now()}_${sub.id}`,
          productId: l.productId,
          description: `${l.productName}${l.variantName ? ` (${l.variantName})` : ''}`,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: '0.00',
          lineTotal: new Decimal(l.unitPrice).times(l.quantity).toFixed(2),
        })),
      };

      mockInvoices.unshift(newInvoice);
      createdInvoices.push(newInvoice);

      // Advance subscription nextBillingDate
      const nextDate = new Date(sub.nextBillingDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      sub.nextBillingDate = nextDate.toISOString();

      // Log invoice notice to local email outbox
      mockEmailOutbox.unshift({
        id: `eml_${Date.now()}`,
        recipientUserId: sub.customerId,
        recipientEmail: sub.customerEmail,
        subject: `New Invoice Issued: ${newInvoice.invoiceNumber}`,
        bodyContent: `Invoice ${newInvoice.invoiceNumber} for billing cycle ${cycleId} has been generated. Amount: ₹${newInvoice.totalAmount}. Due Date: ${newInvoice.dueDate}.`,
        emailType: 'INVOICE_NOTICE',
        status: 'SENT',
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    });

    result = {
      isDryRun: false,
      targetDate,
      totalEligible: eligibleSubs.length,
      invoicesGenerated: createdInvoices.length,
      skippedCount: skipped,
      invoices: createdInvoices,
    };
  }

  // --- Payments Routes ---
  else if (cleanPath === '/payments') {
    if (method === 'GET') {
      if (currentSessionUser?.role === 'CUSTOMER') {
        result = mockPayments.filter((p) => p.customerName.toLowerCase() === currentSessionUser?.fullName.toLowerCase());
      } else {
        result = mockPayments;
      }
    } else if (method === 'POST') {
      const invoiceId = String(payload.invoiceId || '');
      const paymentAmount = new Decimal(Number(payload.amount) || 0);

      const targetInvoice = mockInvoices.find((i) => i.id === invoiceId);
      if (!targetInvoice) {
        throw new Error('Target invoice not found');
      }

      const total = new Decimal(targetInvoice.totalAmount);
      const alreadyPaid = new Decimal(targetInvoice.amountPaid || 0);
      const remainingBalance = total.minus(alreadyPaid);

      // BUSINESS RULE: A payment cannot exceed the outstanding invoice balance
      if (paymentAmount.gt(remainingBalance)) {
        throw new Error(`Payment amount (₹${paymentAmount.toFixed(2)}) cannot exceed outstanding balance of ₹${remainingBalance.toFixed(2)}.`);
      }

      if (paymentAmount.lte(0)) {
        throw new Error('Payment amount must be greater than zero.');
      }

      const newPaidTotal = alreadyPaid.plus(paymentAmount);
      targetInvoice.amountPaid = newPaidTotal.toFixed(2);

      // Derived Settlement Status: PAID strictly when cumulative verified payments equal invoice total
      if (newPaidTotal.gte(total)) {
        targetInvoice.status = 'PAID';
      }

      const newPayment: Payment = {
        id: `pay_${Date.now()}`,
        invoiceId: targetInvoice.id,
        invoiceNumber: targetInvoice.invoiceNumber,
        customerId: targetInvoice.customerId,
        customerName: targetInvoice.customerName,
        paymentDate: String(payload.paymentDate || new Date().toISOString()),
        amount: paymentAmount.toFixed(2),
        paymentMethod: (payload.paymentMethod as Payment['paymentMethod']) || 'UPI',
        referenceNote: String(payload.referenceNote || 'Direct Settlement'),
        status: 'COMPLETED',
      };
      mockPayments.unshift(newPayment);

      // Also update customer profile totals
      const cust = mockCustomers.find((c) => c.id === targetInvoice.customerId);
      if (cust) {
        const curPaid = new Decimal(cust.totalPaid || 0);
        cust.totalPaid = curPaid.plus(paymentAmount).toFixed(2);
        const curOut = new Decimal(cust.outstandingBalance || 0);
        cust.outstandingBalance = Decimal.max(0, curOut.minus(paymentAmount)).toFixed(2);
      }

      result = { payment: newPayment, invoice: targetInvoice };
    }
  }

  // --- Analytics & Reports Routes ---
  else if (cleanPath === '/analytics/kpis') {
    result = computeLiveKPIs();
  } else if (cleanPath === '/analytics/reports/revenue') {
    const kpis = computeLiveKPIs();
    result = {
      totalRevenue: kpis.totalInvoicedRevenue,
      periodMrr: kpis.mrr,
      collections: kpis.totalCollectedPayments,
      receivables: kpis.outstandingReceivables,
      breakdown: [
        { date: '2026-10-01', amount: '1560.00', count: 1 },
        { date: '2026-10-15', amount: '2800.00', count: 1 },
      ],
    };
  } else {
    result = { message: `Mock endpoint matched: ${method} ${cleanPath}` };
  }

  return {
    data: result as T,
    latencyMs: simulatedLatency,
  };
}
