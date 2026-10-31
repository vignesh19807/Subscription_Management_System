export type EmailStatus = 'QUEUED' | 'SENT' | 'FAILED';

export type EmailType = 'PASSWORD_RESET' | 'INVOICE_NOTICE' | 'CUSTOMER_WELCOME' | 'STAFF_INVITE';

export interface EmailOutboxItem {
  id: string;
  recipientUserId?: string;
  recipientEmail: string;
  subject: string;
  bodyContent: string;
  emailType: EmailType;
  status: EmailStatus;
  sentAt?: string | null;
  createdAt: string;
}
