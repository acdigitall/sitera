import React from 'react';
import {
  RefreshCw,
  Plus,
  Menu,
  Search,
  Bell,
  Building2,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth';

interface TopBarProps {
  onRefresh?: () => void;
  loading?: boolean;
  onOpenCreateUser?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onToggleMobileMenu?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onRefresh,
  loading = false,
  onOpenCreateUser,
  searchQuery = '',
  onSearchChange,
  onToggleMobileMenu,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';

  const getPageTitle = () => {
    const normalizedPath = location.pathname.replace(/^\/[^/]+(?=\/(admin|portal))/, '');

    switch (normalizedPath) {
      case '/admin/overview':
        return 'Kasa & Operasyon';
      case '/admin/users':
        return isSuperAdmin ? 'Yöneticiler' : 'Daireler & Sakinler';
      case '/admin/periods':
        return 'Aidat Dönemleri';
      case '/admin/debts':
        return 'Borç & Tahsilat';
      case '/admin/payment-approvals':
        return 'Ödeme Onayları';
      case '/admin/reports':
        return 'Mali Raporlar';
      case '/admin/legal':
        return 'İcra & Hukuk';
      case '/admin/reminders':
        return 'Hatırlatmalar';
      case '/admin/announcements':
        return 'Duyurular';
      case '/admin/audit-logs':
        return 'İşlem Geçmişi';
      case '/admin/profile':
        return 'Hesap Ayarları';
      case '/admin/architecture':
        return 'Veri İzolasyonu';
      case '/portal/home':
        return 'Sakin Portalı';
      case '/portal/announcements':
        return 'Duyurular';
      case '/portal/payments':
        return 'Aidat & Ödemeler';
      case '/portal/profile':
        return 'Profilim';
      default:
        return 'Genel Bakış';
    }
  };

  return (
    <header className="py-4.5 px-6 sm:px-10 lg:px-12 xl:px-14 min-h-[88px] bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between gap-6 max-w-full w-full shadow-xs">
      {/* 1. Left: Mobile Toggle + Large Interactive Building Switcher Pill */}
      <div className="flex items-center gap-3.5 min-w-0 shrink-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            title="Menüyü Aç"
          >
            <Menu size={22} />
          </button>
        )}

        {/* Building Identity Display (Clean static display, not a button) */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
            <Building2 size={18} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                {user?.group?.name || 'Gencosman Apartmanı'}
              </span>
              <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-full">
                Aktif Dönem
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium leading-none mt-1">
              16 Bağımsız Bölüm · {getPageTitle()}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Center: Large Command Search Bar (h-11, text-sm, ⌘K) */}
      <div className="flex-1 max-w-lg mx-3 hidden md:block">
        <div className="relative group">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-slate-600 transition-colors pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Daire no, sakin adı veya işlem ara..."
            className="w-full h-11 pl-11 pr-14 bg-slate-100/70 hover:bg-slate-100 focus:bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 rounded-xl border border-transparent focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 focus:outline-hidden transition-all shadow-2xs"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <kbd className="text-xs font-mono font-semibold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* 3. Right: Large Live Cash Pulse + Action Buttons + Profile Chip */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Live Liquidity Pulse Badge */}
        <div
          className="hidden xl:flex items-center gap-2.5 h-11 px-4 rounded-xl bg-teal-50/90 border border-teal-200/80 text-sm shadow-2xs"
          title="Güncel Toplam Likit Kasa & Banka Rezervi"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse" />
          <span className="text-teal-800 font-semibold text-xs">Kasa:</span>
          <span className="text-teal-950 font-bold tabular-nums text-base">53.875 ₺</span>
        </div>

        {/* Notifications Button */}
        <button
          type="button"
          onClick={() => alert('3 yeni bildiriminiz var:\n• 2 adet vadesi dolmuş aidat borcu\n• Zeynep Çelik 625 ₺ FAST dekont onayı bekliyor\n• KONE Asansör periyodik bakım faturası geldi')}
          className="relative w-11 h-11 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/90 cursor-pointer shadow-2xs"
          title="Bildirimler (3 yeni)"
        >
          <Bell size={19} />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`w-11 h-11 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/90 cursor-pointer shadow-2xs ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Verileri Yenile"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        )}

        {/* Primary Action Button (Sitera Teal, h-11 px-5) */}
        {(isSuperAdmin || isAdmin) && onOpenCreateUser && (
          <button
            onClick={onOpenCreateUser}
            className="h-11 flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold px-5 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
            title={isSuperAdmin ? 'Yeni Yönetici' : 'Yeni Daire Ekle'}
          >
            <Plus size={18} />
            <span className="hidden sm:inline">{isSuperAdmin ? 'Yeni Yönetici' : 'Yeni Daire Ekle'}</span>
            <span className="sm:hidden">Ekle</span>
          </button>
        )}

        {/* User Identity Chip */}
        <div className="hidden lg:flex items-center gap-3 pl-3.5 border-l border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ring-2 ring-slate-100">
            {user?.name?.charAt(0).toUpperCase() || 'Ç'}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-bold text-slate-900 leading-tight">
              {user?.name || 'Çağatay Dalaman'}
            </span>
            <span className="text-xs text-teal-700 font-semibold leading-none mt-1">
              Yönetici
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
