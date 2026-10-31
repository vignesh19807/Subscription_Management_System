import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-brand-canvas">
        <div className="flex items-center gap-3 text-sm font-medium text-brand-muted">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
          <span>Verifying session authorization...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const defaultAuthorizedRoute = user.role === 'CUSTOMER' ? '/portal' : '/';

    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-canvas p-6">
        <div className="max-w-md w-full bg-white rounded-xl border border-brand-border p-8 text-center shadow-sm space-y-4">
          <div className="h-12 w-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldX className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Access Restricted (403)</h2>
            <p className="mt-1 text-xs text-brand-muted">
              Your account has the role <span className="font-semibold text-slate-700">{user.role}</span>, which lacks authorization to view this resource.
            </p>
          </div>
          <div className="pt-2">
            <Link to={defaultAuthorizedRoute}>
              <Button variant="primary" size="md" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Authorized Dashboard</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

