export type TaxType = 'PERCENTAGE' | 'FIXED';

export interface TaxRule {
  id: string;
  name: string;
  rate: string; // e.g. "18.00" for 18%
  taxType: TaxType;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

