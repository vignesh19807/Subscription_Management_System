import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogApi } from '@/api/catalogApi';
import { Product, ProductVariant } from '@/types/catalog';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProductModal } from './ProductModal';
import { VariantModal } from './VariantModal';
import { useToast } from '@/components/ui/Toast';
import { formatINR } from '@/utils/currency';
import { Plus, Layers, Search, Edit2, Trash2 } from 'lucide-react';

export const ProductListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SOFTWARE' | 'SERVICE' | 'HARDWARE'>('ALL');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => catalogApi.getProducts(),
  });

  const saveProductMutation = useMutation({
    mutationFn: async (data: Omit<Product, 'id'>) => {
      if (productToEdit) {
        return catalogApi.updateProduct(productToEdit.id, data);
      }
      return catalogApi.createProduct(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast({
        type: 'success',
        title: productToEdit ? 'Product Updated' : 'Product Created',
        message: 'Product catalog entry has been recorded.',
      });
      setProductToEdit(null);
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Operation Failed',
        message: err instanceof Error ? err.message : 'Could not save product',
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => catalogApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast({
        type: 'info',
        title: 'Product Deleted',
        message: 'Product removed from active catalog.',
      });
    },
  });

  const addVariantMutation = useMutation({
    mutationFn: async ({
      productId,
      variant,
    }: {
      productId: string;
      variant: Omit<ProductVariant, 'id' | 'productId'>;
    }) => {
      return catalogApi.addVariant(productId, variant);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast({
        type: 'success',
        title: 'Variant Configured',
        message: 'Price delta and surcharge rule attached.',
      });
    },
  });

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'ALL' || p.productType === typeFilter;
    return matchesSearch && matchesType;
  });

  const columns: Column<Product>[] = [
    {
      header: 'Product Name',
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.name}</span>
          {row.notes && <span className="text-[11px] text-brand-muted line-clamp-1">{row.notes}</span>}
        </div>
      ),
    },
    {
      header: 'Classification',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs border border-slate-200">
          {row.productType}
        </span>
      ),
    },
    {
      header: 'Sales Price',
      accessorKey: 'salesPrice',
      align: 'right',
      cell: (row) => <span className="font-bold text-slate-900">{formatINR(row.salesPrice)}</span>,
    },
    {
      header: 'Cost Price',
      accessorKey: 'costPrice',
      align: 'right',
      cell: (row) => <span className="text-slate-500 font-mono">{formatINR(row.costPrice)}</span>,
    },
    {
      header: 'Variants',
      cell: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setVariantProduct(row);
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-indigo-50 text-brand-primary border border-indigo-200 hover:bg-indigo-100 transition-colors"
        >
          <Layers className="h-3 w-3" />
          <span>{row.variants?.length || 0} variant(s)</span>
        </button>
      ),
    },
    {
      header: 'Status',
      align: 'center',
      cell: (row) => (
        <StatusBadge
          status={row.isActive ? 'ACTIVE' : 'CLOSED'}
          variant={row.isActive ? 'ACTIVE' : 'CLOSED'}
        />
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setProductToEdit(row);
              setIsProductModalOpen(true);
            }}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-brand-primary transition-colors"
            title="Edit product"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Delete product ${row.name}?`)) {
                deleteProductMutation.mutate(row.id);
              }
            }}
            className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
            title="Delete product"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-brand-primary text-white">
              Catalog
            </span>
            <span className="text-xs text-brand-muted font-medium">Brightloop Software</span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Product &amp; Multi-Attribute Variant Catalog
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Configure subscription software tiers, consulting services, hardware add-ons, and variant price deltas.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setProductToEdit(null);
            setIsProductModalOpen(true);
          }}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-brand-border shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Search catalog products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'SOFTWARE', 'SERVICE', 'HARDWARE'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                typeFilter === type
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'ALL' ? 'All Types' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        emptyMessage="No products match your search criteria."
      />

      {/* Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
        onSave={async (data) => {
          await saveProductMutation.mutateAsync(data);
        }}
      />

      {/* Variant Modal */}
      <VariantModal
        isOpen={variantProduct !== null}
        onClose={() => setVariantProduct(null)}
        product={variantProduct}
        onAddVariant={async (productId, variant) => {
          await addVariantMutation.mutateAsync({ productId, variant });
          // refresh local state for the opened product
          const updated = products.find((p) => p.id === productId);
          if (updated) setVariantProduct({ ...updated });
        }}
      />
    </div>
  );
};

export default ProductListPage;
