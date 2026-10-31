import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

// Public Auth routes
const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/ResetPasswordPage'));

// Back-Office feature routes (ADMIN & STAFF)
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const ProductListPage = lazy(() => import('@/features/catalog/ProductListPage'));
const PlanListPage = lazy(() => import('@/features/plans/PlanListPage'));
const TaxListPage = lazy(() => import('@/features/taxes/TaxListPage'));
const DiscountListPage = lazy(() => import('@/features/discounts/DiscountListPage'));
const CustomerListPage = lazy(() => import('@/features/customers/CustomerListPage'));
const QuotationListPage = lazy(() => import('@/features/quotations/QuotationListPage'));
const SubscriptionListPage = lazy(() => import('@/features/subscriptions/SubscriptionListPage'));
const InvoiceListPage = lazy(() => import('@/features/invoices/InvoiceListPage'));
const PaymentListPage = lazy(() => import('@/features/payments/PaymentListPage'));
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage'));

// Customer portal routes (CUSTOMER, plus ADMIN/STAFF preview)
const CustomerPortalOverview = lazy(() => import('@/features/portal/CustomerPortalOverview'));
const CustomerSubscriptionsPage = lazy(() => import('@/features/portal/CustomerSubscriptionsPage'));
const CustomerInvoicesPage = lazy(() => import('@/features/portal/CustomerInvoicesPage'));

// Accessible loading fallback
const RouteLoadingFallback: React.FC = () => (
  <div className="flex h-screen w-full items-center justify-center bg-brand-canvas">
    <div className="flex items-center gap-3 text-sm font-medium text-brand-muted">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      <span>Loading module...</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              {/* Public Authentication Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected Back-Office Routes (ADMIN and STAFF) */}
              <Route
                path="/"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="catalog" element={<ProductListPage />} />
                <Route path="plans" element={<PlanListPage />} />
                <Route path="taxes" element={<TaxListPage />} />
                <Route path="discounts" element={<DiscountListPage />} />
                <Route path="customers" element={<CustomerListPage />} />
                <Route path="quotations" element={<QuotationListPage />} />
                <Route path="subscriptions" element={<SubscriptionListPage />} />
                <Route path="invoices" element={<InvoiceListPage />} />
                <Route path="payments" element={<PaymentListPage />} />
                <Route path="reports" element={<ReportsPage />} />
              </Route>

              {/* Protected Customer Portal Routes */}
              <Route
                path="/portal"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN', 'STAFF']}>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<CustomerPortalOverview />} />
                <Route path="subscriptions" element={<CustomerSubscriptionsPage />} />
                <Route path="invoices" element={<CustomerInvoicesPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
