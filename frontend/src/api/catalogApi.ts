import { apiClient } from './client';
import { Product, ProductVariant } from '@/types/catalog';

export const catalogApi = {
  async getProducts(): Promise<Product[]> {
    const res = await apiClient<Product[]>('/products', { method: 'GET' });
    return res.data;
  },

  async getProductById(id: string): Promise<Product> {
    const res = await apiClient<Product>(`/products/${id}`, { method: 'GET' });
    return res.data;
  },

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const res = await apiClient<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    return res.data;
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const res = await apiClient<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
    return res.data;
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    const res = await apiClient<{ success: boolean }>(`/products/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  async addVariant(productId: string, variant: Omit<ProductVariant, 'id' | 'productId'>): Promise<ProductVariant> {
    const res = await apiClient<ProductVariant>(`/products/${productId}/variants`, {
      method: 'POST',
      body: JSON.stringify(variant),
    });
    return res.data;
  },
};

