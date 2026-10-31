import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { TopNavbar } from './TopNavbar';
import { OutboxDrawer } from '@/features/outbox/OutboxDrawer';
import { StaffManagementModal } from '@/features/auth/StaffManagementModal';

export const AppLayout: React.FC = () => {
  const [isOutboxOpen, setIsOutboxOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-brand-canvas text-brand-sidebar">
      {/* Sidebar with dark token #0F172A */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar
          onToggleOutbox={() => setIsOutboxOpen(true)}
          onOpenStaffModal={() => setIsStaffModalOpen(true)}
        />

        <main id="main-content" className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Local Email Outbox Drawer (Scene 1) */}
      <OutboxDrawer
        isOpen={isOutboxOpen}
        onClose={() => setIsOutboxOpen(false)}
      />

      {/* Staff Provisioning Modal (ADMIN only) */}
      <StaffManagementModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
      />
    </div>
  );
};

export default AppLayout;
