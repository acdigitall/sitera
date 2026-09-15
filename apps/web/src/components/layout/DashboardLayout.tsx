import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { SupportModeBanner, TenantSupportModal } from '../../features/support';

interface DashboardLayoutProps {
  onOpenCreateUser?: () => void;
  userCount?: number;
  totalUnitsCount?: number;
  groupsCount?: number;
  upcomingRenewalsCount?: number;
  loading?: boolean;
  onRefresh?: () => void;
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  onOpenCreateUser,
  userCount = 0,
  totalUnitsCount,
  groupsCount = 0,
  upcomingRenewalsCount = 0,
  loading = false,
  onRefresh,
  children,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevPathRef = useRef(location.pathname);

  // Sayfalar arası geçiş dinleyicisi & akıcı loading animasyonu
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;

      // Sayfa değiştiğinde en üste kaydır
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
      }

      setIsNavigating(true);
      setProgress(35);

      const t1 = setTimeout(() => setProgress(75), 60);
      const t2 = setTimeout(() => setProgress(98), 150);
      const t3 = setTimeout(() => {
        setProgress(100);
      }, 240);
      const t4 = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 360);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-slate-50 text-slate-900 antialiased font-sans relative print:h-auto print:overflow-visible print:bg-white">
      {/* 0. KVKK Teknik Destek Modu Üst Bandı (Süper Admin bir siteye destek girişi yaptığında) */}
      <SupportModeBanner />

      <div className="h-[100dvh] w-full bg-slate-50 flex overflow-hidden print:h-auto print:overflow-visible print:bg-white">
        {/* 1. Üst Hassas İlerleme Çubuğu (Top Progress Loader - Sitera Teal) */}
        {progress > 0 && (
          <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-[3.5px] bg-teal-900/10">
            <div
              className="h-full bg-gradient-to-r from-teal-700 via-teal-500 to-emerald-400 shadow-[0_0_12px_rgba(13,148,136,0.9)] transition-all ease-out"
              style={{
                width: `${progress}%`,
                transitionDuration: progress === 100 ? '120ms' : '90ms',
                opacity: progress === 100 ? 0 : 1,
              }}
            />
          </div>
        )}

        {/* 2. Sayfa Geçiş Rozeti (Floating Navigation Pill) */}
        {isNavigating && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-scale-up">
            <div className="bg-slate-900/90 text-white backdrop-blur-md px-4 py-1.5 rounded-full shadow-xl border border-slate-700/60 flex items-center gap-2 text-xs font-semibold">
              <Loader2 size={14} className="animate-spin text-teal-400 shrink-0" />
              <span className="tracking-wide">Sayfa Değiştiriliyor...</span>
            </div>
          </div>
        )}

        {/* Mobile Drawer Backdrop Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Navigation Sidebar: Full height, pinned on desktop, slide-over on mobile */}
        <Sidebar
          userCount={totalUnitsCount || userCount}
          groupsCount={groupsCount}
          upcomingRenewalsCount={upcomingRenewalsCount}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area: Scrolls smoothly inside container while TopBar and Sidebar stay pinned */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto overflow-x-hidden print:overflow-visible print:h-auto"
        >
          <div className="print:hidden">
            <TopBar
              onRefresh={onRefresh}
              loading={loading || isNavigating}
              userCount={userCount}
              totalUnitsCount={totalUnitsCount}
              groupsCount={groupsCount}
              onOpenCreateUser={onOpenCreateUser}
              onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
            />
          </div>

          <main
            key={location.pathname}
            className={`flex-1 p-4 sm:p-6 md:p-8 max-w-[1600px] w-full mx-auto transition-all duration-200 print:p-0 print:m-0 print:max-w-none print:w-auto ${
              isNavigating
                ? 'opacity-35 filter blur-[0.4px] pointer-events-none scale-[0.997]'
                : 'opacity-100 filter-none animate-fade-in scale-100'
            }`}
          >
            {children || <Outlet />}
          </main>
        </div>
      </div>

      {/* Site Yöneticisi Destek & Yardım Modalı */}
      <TenantSupportModal />
    </div>
  );
};
