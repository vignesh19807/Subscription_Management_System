export type ProductType = 'SERVICE' | 'SOFTWARE' | 'HARDWARE';

export interface ProductVariant {
  id: string;
  productId: string;
  variantName: string;
  priceDelta: string; // Stored as exact decimal string e.g. "560.00"
  sku: string;
}

export interface Product {
  id: string;
  name: string;
  productType: ProductType;
  salesPrice: string; // Exact decimal string e.g. "1000.00"
  costPrice: string;  // Exact decimal string e.g. "400.00"
  notes?: string;
  isActive: boolean;
  variants?: ProductVariant[];
}

