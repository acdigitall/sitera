import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface DashboardLayoutProps {
  onOpenCreateUser?: () => void;
  userCount?: number;
  loading?: boolean;
  onRefresh?: () => void;
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  onOpenCreateUser,
  userCount = 0,
  loading = false,
  onRefresh,
  children,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen h-[100dvh] w-full overflow-hidden bg-slate-50 text-slate-900 antialiased font-sans">
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Navigation Sidebar: Full height, pinned on desktop, slide-over on mobile */}
      <Sidebar
        userCount={userCount}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area: Scrolls smoothly inside container while TopBar and Sidebar stay pinned */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto overflow-x-hidden">
        <TopBar
          onRefresh={onRefresh}
          loading={loading}
          onOpenCreateUser={onOpenCreateUser}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
