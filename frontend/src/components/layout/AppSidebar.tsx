import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Package,
  CalendarClock,
  Percent,
  Tag,
  Users,
  FileCheck2,
  Layers,
  FileText,
  CreditCard,
  BarChart3,
  Building2,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const backOfficeNavItems: NavItem[] = [
  { label: 'Executive Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Product Catalog', path: '/catalog', icon: Package },
  { label: 'Billing Plans', path: '/plans', icon: CalendarClock },
  { label: 'Tax Rules', path: '/taxes', icon: Percent },
  { label: 'Discount Rules', path: '/discounts', icon: Tag },
  { label: 'Customer Directory', path: '/customers', icon: Users },
  { label: 'Quotations', path: '/quotations', icon: FileCheck2 },
  { label: 'Subscriptions', path: '/subscriptions', icon: Layers },
  { label: 'Invoices & Billing', path: '/invoices', icon: FileText },
  { label: 'Payment Ledger', path: '/payments', icon: CreditCard },
  { label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
];

const customerNavItems: NavItem[] = [
  { label: 'Portal Dashboard', path: '/portal', icon: Building2 },
  { label: 'My Subscriptions', path: '/portal/subscriptions', icon: Layers },
  { label: 'My Invoices', path: '/portal/invoices', icon: FileText },
];

export const AppSidebar: React.FC = () => {
  const { user } = useAuth();
  const isCustomer = user?.role === 'CUSTOMER';

  return (
    <aside className="w-64 flex-shrink-0 bg-brand-sidebar text-white flex flex-col min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
        <div className="h-9 w-9 rounded-lg bg-brand-primary flex items-center justify-center font-bold text-lg text-white shadow-md">
          LB
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white leading-tight">
            LoopBill
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Brightloop Software</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!isCustomer ? (
          <>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Operations &amp; Billing Desk
            </div>
            {backOfficeNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )
                  }
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <div className="pt-5 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Client Portal Preview
            </div>
            <NavLink
              to="/portal"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <span>Customer Portal</span>
            </NavLink>
          </>
        ) : (
          <>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Customer Self-Service
            </div>
            {customerNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/portal'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )
                  }
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      {/* System Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Session: <strong className="text-white">{user?.role || 'Guest'}</strong></span>
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" title="Connected Session" />
      </div>
    </aside>
  );
};
