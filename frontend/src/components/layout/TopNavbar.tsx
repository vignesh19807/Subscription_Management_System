import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LatencyBadge } from './LatencyBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Mail, ShieldCheck, UserPlus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface TopNavbarProps {
  onToggleOutbox?: () => void;
  onOpenStaffModal?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onToggleOutbox,
  onOpenStaffModal,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      navigate('/login', { replace: true });
    }
  };

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <header className="h-16 border-b border-brand-border bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider text-brand-muted">
          Environment
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-brand-border">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-primary" />
          <span className="hidden xs:inline">Local</span> Dev
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Latency Tracker (Scene 7 SLA Requirement) */}
        <LatencyBadge />

        {/* Local Simulated Outbox Drawer Trigger (Scene 1) */}
        {onToggleOutbox && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleOutbox}
            className="text-xs gap-1.5 px-2 sm:px-3"
            title="Open Local Simulated Email Outbox"
          >
            <Mail className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden md:inline">Email Outbox</span>
          </Button>
        )}

        {/* ADMIN Privilege: Provision Staff Account Button */}
        {user?.role === 'ADMIN' && onOpenStaffModal && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenStaffModal}
            className="text-xs gap-1.5 border border-slate-200"
            title="Provision Staff Account (Admin Only)"
          >
            <UserPlus className="h-3.5 w-3.5 text-slate-600" />
            <span className="hidden lg:inline">Add Staff</span>
          </Button>
        )}

        {/* User Info & Role Pill */}
        {user ? (
          <div className="flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-3 border-l border-brand-border">
            <div className="h-8 w-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-700 flex-shrink-0">
              {initials}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
                {user.fullName}
              </div>
              <div className="text-[10px] text-brand-muted truncate max-w-[120px]">
                {user.email}
              </div>
            </div>
            <StatusBadge status={user.role} variant={user.role} />
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
              title="Sign out of current session"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
};
