import React, { useState, useRef, useEffect } from 'react';
import {
  RefreshCw,
  Plus,
  Menu,
  Search,
  Bell,
  Building2,
  Home,
  CreditCard,
  CheckCircle2,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Receipt,
  FileText,
  LifeBuoy,
  Landmark,
} from '../common/fontawesome-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { useFinance } from '../../features/finance';
import { useAnnouncements } from '../../features/announcements';
import { NotificationCenterPopover } from '../../features/notifications';
import { useSupport } from '../../features/support';

interface TopBarProps {
  onRefresh?: () => void;
  loading?: boolean;
  onOpenCreateUser?: () => void;
  userCount?: number;
  groupsCount?: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onToggleMobileMenu?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onRefresh,
  loading = false,
  onOpenCreateUser,
  userCount,
  groupsCount,
  searchQuery = '',
  onSearchChange,
  onToggleMobileMenu,
}) => {
  const { user, selectedUnit, setSelectedUnit, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';
  const isResident = !isSuperAdmin && !isAdmin;
  const { openTenantModal, isInSupportMode, supportSession } = useSupport();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [isUnitMenuOpen, setIsUnitMenuOpen] = useState(false);
  const unitMenuRef = useRef<HTMLDivElement>(null);

  const userUnits = user?.units && user.units.length > 0 ? user.units : (user?.name ? [user.name] : []);
  const hasMultipleUnits = userUnits.length > 1;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (unitMenuRef.current && !unitMenuRef.current.contains(event.target as Node)) {
        setIsUnitMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tenantSlug =
    isSuperAdmin
      ? isInSupportMode && supportSession?.targetGroupSlug
        ? supportSession.targetGroupSlug
        : 'platform'
      : user?.group?.slug ||
        (user?.group?.name
          ? user.group.name
            .toLowerCase()
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
          : 'platform');

  const getTenantPath = (path: string) => `/${tenantSlug}${path}`;

  const residentTypeTitle =
    user?.residentType === 'tenant'
      ? (hasMultipleUnits ? `${userUnits.length} Daire Kiracısı` : 'Kiracı Sakin')
      : user?.residentType === 'both'
        ? (hasMultipleUnits ? `${userUnits.length} Daire Sahibi (Oturan)` : 'Ev Sahibi (İkamet Eden)')
        : (hasMultipleUnits ? `${userUnits.length} Daire Maliki` : 'Kat Maliki');

  // Query finance data: if resident, filter by selected unit or aggregate all units
  const activeUnitFilter = selectedUnit === 'all' ? undefined : (selectedUnit || undefined);
  const { debts, summary } = useFinance(
    user?.groupId,
    isResident ? user?.id : undefined,
    isResident ? activeUnitFilter : undefined,
  );
  const { unreadCount } = useAnnouncements(user?.groupId, user?.id);

  const pendingDebts = debts.filter((d) => d.status !== 'paid');
  const myTotalDebt = pendingDebts.reduce(
    (sum, d) => sum + (Number((d as any).totalWithLateFee || d.amount) - Number(d.paidAmount)),
    0,
  );

  const getPageTitle = () => {
    const normalizedPath = location.pathname.replace(/^\/[^/]+(?=\/(admin|portal))/, '');

    if (normalizedPath.startsWith('/admin/sites/')) {
      if (normalizedPath === '/admin/sites/new') return 'Yeni Site & Apartman';
      return 'Site & Apartman Detayı';
    }

    if (normalizedPath.startsWith('/admin/marketplace/')) {
      return 'Modül Detayı & Çalışma Prensibi';
    }

    switch (normalizedPath) {
      case '/admin/overview':
        return isSuperAdmin ? 'SaaS & Genel Bakış' : 'Kasa & Operasyon';
      case '/admin/sites':
        return 'Siteler & Apartmanlar';
      case '/admin/licenses':
        return 'Lisans & Ödeme Takvimi';
      case '/admin/messages':
        return 'SMS & WhatsApp Paketleri (Demo)';
      case '/admin/modules':
        return 'Modül & Eklenti Yönetimi';
      case '/admin/marketplace':
        return 'Eklenti & Modül Pazarı';
      case '/admin/users':
        return isSuperAdmin ? 'Yöneticiler & Kullanıcılar' : 'Daireler & Sakinler';
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
      case '/admin/support':
        return 'Destek Talepleri & Müdahaleler';
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
        return isResident ? 'Sakin Paneli' : 'Genel Bakış';
    }
  };

  return (
    <header className="py-3.5 px-6 sm:px-8 lg:px-10 min-h-[64px] bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between gap-6 max-w-full w-full shadow-xs">
      {/* 1. Sol: Mobil Menü Butonu + Logo (sadece mobil) + Sayfa Başlığı (sadece desktop) */}
      <div className="flex items-center gap-3.5 min-w-0 shrink-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0 cursor-pointer"
            title="Menüyü Aç"
          >
            <Menu size={22} />
          </button>
        )}

        {/* Mobil: Logo + Site Adı */}
        <div
          onClick={() => navigate(getTenantPath(isResident ? '/portal/home' : '/admin/overview'))}
          className="lg:hidden flex items-center gap-3 cursor-pointer group"
          title={isResident ? 'Sakin Ana Sayfasına Git' : 'Yönetim Paneline Git'}
        >
          <img
            src="/logo.png"
            alt="Sitera Logo"
            className="w-9 h-9 rounded-xl object-contain bg-white border border-slate-200/90 p-0.5 shadow-xs transition-transform group-hover:scale-105 shrink-0"
          />
          <span className="font-bold text-slate-900 tracking-tight text-sm leading-tight">
            {user?.group?.name || 'Sitera'}
          </span>
        </div>

        {/* Desktop: Sayfa Başlığı + Breadcrumb */}
        <div className="hidden lg:flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900 tracking-tight leading-tight">
              {getPageTitle()}
            </span>
            {/* Çoklu Daire Seçici / Tek Daire Rozeti — Sadece sakinlerde */}
            {isResident ? (
              hasMultipleUnits ? (
                <div className="relative" ref={unitMenuRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsUnitMenuOpen(!isUnitMenuOpen);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/90 cursor-pointer shadow-2xs transition-colors"
                    title="Aktif dairenizi seçin veya tüm daireleri görüntüleyin"
                  >
                    <Home size={12} className="text-teal-700" />
                    <span>
                      {selectedUnit === 'all'
                        ? `Tüm Dairelerim (${userUnits.length})`
                        : selectedUnit}
                    </span>
                    <ChevronDown size={12} className="text-teal-600" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUnitMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-scale-up text-xs font-medium"
                    >
                      <div className="px-3.5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Daire Seçimi ({userUnits.length} Bağımsız Bölüm)
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUnit('all');
                          setIsUnitMenuOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center justify-between hover:bg-slate-50 cursor-pointer ${selectedUnit === 'all'
                            ? 'text-teal-800 font-bold bg-teal-50/80'
                            : 'text-slate-700'
                          }`}
                      >
                        <span className="flex items-center gap-2">
                          <Building2 size={14} className="text-teal-700" />
                          <span>Tüm Dairelerim ({userUnits.length})</span>
                        </span>
                        {selectedUnit === 'all' && <CheckCircle2 size={14} className="text-teal-700" />}
                      </button>
                      <div className="border-t border-slate-100 my-1" />
                      {userUnits.map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => {
                            setSelectedUnit(u);
                            setIsUnitMenuOpen(false);
                          }}
                          className={`w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center justify-between hover:bg-slate-50 cursor-pointer ${selectedUnit === u
                              ? 'text-teal-800 font-bold bg-teal-50/80'
                              : 'text-slate-700'
                            }`}
                        >
                          <span className="flex items-center gap-2">
                            <Home size={14} className="text-slate-500" />
                            <span>{u}</span>
                          </span>
                          {selectedUnit === u && <CheckCircle2 size={14} className="text-teal-700" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-full">
                  {userUnits[0] || 'Daire'}
                </span>
              )
            ) : (
              <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-full">
                Aktif Dönem
              </span>
            )}
          </div>

          <span className="text-xs text-slate-500 font-medium leading-none mt-0.5">
            {isResident
              ? `${residentTypeTitle} · ${user?.group?.name || ''}`
              : isSuperAdmin
              ? isInSupportMode
                ? `🔧 Destek Müdahale Modu · ${supportSession?.targetGroupName || ''}`
                : `🛡️ Platform Yönetim Merkezi · ${groupsCount ?? 0} Kayıtlı Site`
              : `${userCount ?? 0} Bağımsız Bölüm · ${user?.group?.name || ''}`}
          </span>
        </div>
      </div>

      {/* 2. Orta: Komut Arama Çubuğu (h-11, text-sm, ⌘K) */}
      <div className="flex-1 max-w-lg mx-3 hidden md:block">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isResident) {
              navigate(getTenantPath('/portal/announcements'));
            } else {
              navigate(getTenantPath('/admin/users'));
            }
          }}
          className="relative group"
        >
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-slate-600 transition-colors pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={
              isResident
                ? hasMultipleUnits
                  ? `${userUnits.join(', ')} için duyuru veya borç ara...`
                  : 'Duyuru, aidat veya ödeme ara...'
                : 'Daire no, sakin adı veya işlem ara...'
            }
            className="w-full h-11 pl-11 pr-14 bg-slate-100/70 hover:bg-slate-100 focus:bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 rounded-xl border border-transparent focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 focus:outline-hidden transition-all shadow-2xs"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <kbd className="text-xs font-mono font-semibold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </form>
      </div>

      {/* 3. Sağ: Canlı Bakiye Rozeti + Bildirimler + Yenile + Aksiyon + Profil */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Canlı Bakiye / Kasa Göstergesi */}
        {isResident ? (
          myTotalDebt > 0 ? (
            <div
              onClick={() => navigate(getTenantPath('/portal/payments'))}
              className="hidden xl:flex items-center gap-2 h-11 px-4 rounded-xl bg-rose-50/90 border border-rose-200/80 text-sm shadow-2xs cursor-pointer hover:bg-rose-100 transition-colors"
              title={`${selectedUnit === 'all' ? 'Tüm dairelerinizin' : `${selectedUnit} için`} ödenmemiş borcu var. Ödemek için tıklayın.`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
              <span className="text-rose-800 font-semibold text-xs">
                {selectedUnit === 'all' ? 'Toplam Borcum:' : `${selectedUnit} Borcu:`}
              </span>
              <span className="text-rose-950 font-bold tabular-nums font-mono text-base">
                {myTotalDebt.toLocaleString('tr-TR')} ₺
              </span>
            </div>
          ) : (
            <div
              onClick={() => navigate(getTenantPath('/portal/payments'))}
              className="hidden xl:flex items-center gap-2 h-11 px-4 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-sm shadow-2xs cursor-pointer hover:bg-emerald-100 transition-colors"
              title="Seçili daire için tüm aidat ve ortak gider ödemeleriniz günceldir."
            >
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span className="text-emerald-900 font-bold text-xs">
                {selectedUnit === 'all' ? 'Tüm Daireler Borçsuz' : `${selectedUnit} Borçsuz`}
              </span>
            </div>
          )
        ) : !isSuperAdmin ? (
          <div
            onClick={() => navigate(getTenantPath('/admin/accounts'))}
            className="hidden xl:flex items-center gap-2.5 h-10 px-3.5 rounded-lg bg-slate-50 border border-slate-200 text-sm cursor-pointer hover:bg-slate-100 hover:border-teal-300 transition-colors"
            title="Kasa & Banka Hesapları Yönetimi"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-500 font-medium text-xs">Kasa:</span>
            <span className="text-slate-900 font-semibold tabular-nums text-sm">
              {summary && typeof summary.totalLiquidity === 'number'
                ? summary.totalLiquidity.toLocaleString('tr-TR')
                : '0'} ₺
            </span>
          </div>
        ) : null}

        {/* Merkezi Uygulama İçi Bildirim Kutusu (Notification Center Popover) */}
        <NotificationCenterPopover tenantSlug={tenantSlug} />

        {/* Yenileme Butonu */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer bg-white ${loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            title="Verileri Yenile"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        )}

        {/* Süper Admin: Siteleri Gör Butonu */}
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => navigate(getTenantPath('/admin/sites'))}
            className={`hidden sm:inline-flex items-center gap-2 h-10 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              location.pathname.includes('/admin/sites') && !location.pathname.includes('/admin/sites/new')
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
            }`}
            title="Sistemdeki Tüm Siteleri ve Apartmanları Yönet"
          >
            <Building2 size={15} className={location.pathname.includes('/admin/sites') && !location.pathname.includes('/admin/sites/new') ? 'text-white' : 'text-slate-500'} />
            <span className="hidden md:inline">Siteler & Apartmanlar</span>
            <span className="md:hidden">Siteler</span>
            {groupsCount !== undefined && groupsCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded text-[11px] font-mono font-medium ${
                  location.pathname.includes('/admin/sites') && !location.pathname.includes('/admin/sites/new')
                    ? 'bg-slate-800 text-slate-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {groupsCount}
              </span>
            )}
          </button>
        )}

        {/* Süper Admin: Destek Talepleri Butonu */}
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => navigate(getTenantPath('/admin/support'))}
            className={`hidden sm:inline-flex items-center gap-2 h-10 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              location.pathname.includes('/admin/support')
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
            }`}
            title="Gelen Platform Destek Taleplerini ve Müdahaleleri Yönet"
          >
            <LifeBuoy size={15} className={location.pathname.includes('/admin/support') ? 'text-white' : 'text-teal-600'} />
            <span className="hidden md:inline">Destek Talepleri</span>
            <span className="md:hidden">Destek</span>
          </button>
        )}

        {/* Site Yöneticisi: Platform Destek Aç Butonu */}
        {isAdmin && (
          <button
            type="button"
            onClick={openTenantModal}
            className="hidden sm:inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs text-xs font-semibold transition-colors cursor-pointer"
            title="Süper Admine Platform Destek Talebi Aç veya Talepleri Gör"
          >
            <LifeBuoy size={15} className="text-teal-600" />
            <span className="hidden md:inline">Destek Talebi</span>
            <span className="md:hidden">Destek</span>
          </button>
        )}

        {/* Ana Aksiyon Butonu */}
        {isResident ? (
          <button
            onClick={() => navigate(getTenantPath('/portal/payments'))}
            className="h-11 flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold px-4 sm:px-5 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
            title="Aidat ve Borç Ödeme Sayfasına Git"
          >
            <CreditCard size={17} />
            <span className="hidden sm:inline">Aidat Öde</span>
            <span className="sm:hidden">Öde</span>
          </button>
        ) : (
          (isSuperAdmin || isAdmin) && (
            <button
              onClick={() => {
                if (isSuperAdmin) {
                  navigate(getTenantPath('/admin/sites/new'));
                } else {
                  navigate(getTenantPath('/admin/users/new'));
                }
              }}
              className="h-11 flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold px-5 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
              title={isSuperAdmin ? 'Yeni Site & Apartman Ekle' : 'Yeni Daire Ekle'}
            >
              <Plus size={18} />
              <span className="hidden sm:inline">
                {isSuperAdmin ? 'Yeni Site & Apartman Ekle' : 'Yeni Daire Ekle'}
              </span>
              <span className="sm:hidden">Ekle</span>
            </button>
          )
        )}

        {/* Kullanıcı Profil Kartı ve Açılır Menü */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="hidden lg:flex items-center gap-3 pl-3.5 border-l border-slate-200 cursor-pointer hover:opacity-85 transition-opacity text-left"
            title="Hesap Menüsü"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ring-2 ring-slate-100">
              {user?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-slate-900 leading-tight">
                {user?.name || 'Sakin'}
              </span>
              <span className="text-xs text-teal-700 font-semibold leading-none mt-1">
                {isSuperAdmin
                  ? 'Süper Yönetici'
                  : isAdmin
                    ? 'Site Yöneticisi'
                    : residentTypeTitle}
              </span>
            </div>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </button>

          {/* Profil Açılır Menüsü */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-fade-in text-xs font-medium">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="font-bold text-slate-900 text-sm">{user?.name}</div>
                <div className="text-slate-500 truncate font-mono text-[11px] mt-0.5">{user?.email}</div>
                <div className="mt-2">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                    {isSuperAdmin
                      ? 'Süper Yönetici'
                      : isAdmin
                        ? 'Yönetici Hesabı'
                        : `${userUnits.join(' & ')} · ${residentTypeTitle}`}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate(getTenantPath(isResident ? '/portal/profile' : '/admin/profile'));
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <UserIcon size={15} className="text-slate-400" />
                  <span>Profil & Kullanıcı Bilgileri</span>
                </button>

                {!isResident && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate(getTenantPath('/admin/accounts'));
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer font-medium"
                  >
                    <Landmark size={15} className="text-teal-600" />
                    <span>Kasa & Banka (IBAN) Ayarları</span>
                  </button>
                )}

                {isResident ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate(getTenantPath('/portal/payments'));
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <CreditCard size={15} className="text-slate-400" />
                    <span>Aidat & Borç Ödemelerim</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate(getTenantPath('/admin/debts'));
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <Receipt size={15} className="text-slate-400" />
                    <span>Borç & Tahsilat Listesi</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate(getTenantPath(isResident ? '/portal/announcements' : '/admin/announcements'));
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <Bell size={15} className="text-slate-400" />
                  <span>Bina Duyuruları</span>
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      openTenantModal();
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <LifeBuoy size={15} className="text-teal-600" />
                    <span>Platform Destek Talebi</span>
                  </button>
                )}
              </div>

              <div className="border-t border-slate-100 pt-1 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 transition-colors text-left font-semibold cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Oturumu Kapat</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
