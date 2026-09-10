import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Group } from '@sitera/shared';
import {
  CalendarClock,
  MessageSquare,
  Plus,
  Search,
  X,
  Table as TableIcon,
  LayoutGrid,
} from 'lucide-react';
import { tenantsApi } from '../services/tenants.api';
import { SiteMetricsStrip } from './SiteMetricsStrip';
import { SiteTableView } from './SiteTableView';
import { SiteCardGridView } from './SiteCardGridView';
import { SiteLicenseModal } from './SiteLicenseModal';

interface SitesManagementPageProps {
  groups: Group[];
  loading?: boolean;
  tenantSlug?: string;
  onRefresh?: () => void;
}

export const SitesManagementPage: React.FC<SitesManagementPageProps> = ({
  groups,
  tenantSlug = 'gencosman-apartmani',
  onRefresh,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'trial' | 'critical' | 'frozen'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Aksiyon bildirimleri
  const [actionGroupId, setActionGroupId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Hızlı Lisans Düzenleme
  const [quickEditGroup, setQuickEditGroup] = useState<any | null>(null);

  const handleCopyPhone = (phone: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleFreeze = async (group: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const actionName = group.isFrozen ? 'aktifleşsin' : 'dondurulsun';
    if (!window.confirm(`${group.name} sitesi ${actionName} mi?`)) {
      return;
    }

    setActionGroupId(group.id);
    try {
      if (group.isFrozen) {
        await tenantsApi.toggleFreeze(group.id, false);
        setActionFeedback({ type: 'success', text: 'Site aktifleştirildi' });
      } else {
        await tenantsApi.toggleFreeze(group.id, true, 'Yönetici tarafından donduruldu');
        setActionFeedback({ type: 'success', text: 'Site donduruldu' });
      }
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setActionFeedback({ type: 'error', text: err.message || 'İşlem başarısız' });
    } finally {
      setTimeout(() => {
        setActionGroupId(null);
        setActionFeedback(null);
      }, 2500);
    }
  };

  const openQuickEdit = (group: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickEditGroup(group);
  };

  // Grupları Zenginleştirme
  const enrichedGroups = useMemo(() => {
    return groups.map((g) => {
      const usersList = (g as any).users || [];
      const managers = usersList.filter(
        (u: any) => u.role === 'admin' || u.role === 'accountant' || u.role === 'auditor'
      );
      const technicians = usersList.filter(
        (u: any) => u.role === 'staff' || u.role === 'security'
      );
      const residents = usersList.filter((u: any) => u.role === 'member');
      const calculatedUnitsCount =
        g.totalUnits ||
        (residents.length > 0
          ? Array.from(new Set(residents.flatMap((r: any) => r.units || []))).length || residents.length
          : 24);

      const unitFee = Number(g.unitFee) || (g.monthlyFee && calculatedUnitsCount ? Math.round(Number(g.monthlyFee) / calculatedUnitsCount) : 20);
      const monthlyFee = Number(g.monthlyFee) || calculatedUnitsCount * unitFee;
      const isFrozen = !!g.isFrozen;
      const isTrial = g.subscriptionStatus === 'trial';

      const targetExpiry =
        !isTrial && g.licenseExpiresAt
          ? new Date(g.licenseExpiresAt)
          : isTrial && g.trialEndsAt
          ? new Date(g.trialEndsAt)
          : g.licenseExpiresAt
          ? new Date(g.licenseExpiresAt)
          : g.trialEndsAt
          ? new Date(g.trialEndsAt)
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      const diffMs = targetExpiry.getTime() - Date.now();
      const remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      return {
        ...g,
        totalUnits: calculatedUnitsCount,
        city: g.city || 'İstanbul',
        district: g.district || 'Kadıköy',
        managers,
        technicians,
        residentsCount: residents.length,
        unitFee,
        monthlyFee,
        isFrozen,
        isTrial,
        remainingDays,
        targetExpiry,
      };
    });
  }, [groups]);

  // Filtreleme ve Arama
  const filteredGroups = useMemo(() => {
    return enrichedGroups.filter((g) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = g.name.toLowerCase().includes(q);
        const matchSlug = g.slug.toLowerCase().includes(q);
        const matchCity = g.city?.toLowerCase().includes(q);
        const matchDistrict = g.district?.toLowerCase().includes(q);
        const matchManager = g.managers.some(
          (m: any) => m.name.toLowerCase().includes(q) || m.phone?.includes(q) || m.email?.toLowerCase().includes(q)
        );
        const matchTech = g.technicians.some(
          (t: any) => t.name.toLowerCase().includes(q) || t.phone?.includes(q)
        );

        if (!matchName && !matchSlug && !matchCity && !matchDistrict && !matchManager && !matchTech) {
          return false;
        }
      }

      if (activeFilter === 'trial') return g.isTrial;
      if (activeFilter === 'active') return !g.isTrial && !g.isFrozen && g.paymentStatus === 'paid';
      if (activeFilter === 'critical') return g.remainingDays <= 30 && !g.isFrozen;
      if (activeFilter === 'frozen') return g.isFrozen;
      return true;
    });
  }, [enrichedGroups, searchQuery, activeFilter]);

  const totalSitesCount = enrichedGroups.length;
  const totalUnitsAll = enrichedGroups.reduce((sum, g) => sum + (g.totalUnits || 0), 0);
  const trialSitesCount = enrichedGroups.filter((g) => g.isTrial).length;
  const activePaidSitesCount = enrichedGroups.filter((g) => !g.isTrial && !g.isFrozen && g.paymentStatus === 'paid').length;
  const criticalSitesCount = enrichedGroups.filter((g) => g.remainingDays <= 30 && !g.isFrozen).length;

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full max-w-full overflow-hidden font-sans pb-16">
      {/* 1. Sayfa Başlığı ve Aksiyonlar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/70">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Siteler &amp; Apartmanlar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Sistemdeki tüm kayıtlı binaların bağımsız bölüm, yönetici ve lisans kayıtları
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => navigate(`/${tenantSlug}/admin/licenses`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Lisans vadeleri ve tahsilat takvimini görüntüle"
          >
            <CalendarClock size={15} className="text-amber-600" />
            <span>Lisans &amp; Ödeme Takvimi</span>
            {criticalSitesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-amber-100 text-amber-800 border border-amber-200">
                {criticalSitesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate(`/${tenantSlug}/admin/messages`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Sitelerin SMS ve WhatsApp kotalarını incele (Demo Veri)"
          >
            <MessageSquare size={15} className="text-indigo-600" />
            <span>SMS &amp; WP Paketleri</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Demo
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/${tenantSlug}/admin/sites/new`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={15} />
            <span>Yeni Site Ekle</span>
          </button>
        </div>
      </div>

      {/* 2. Kurumsal Metrik Şeridi (StatCard ile Standartlaştırıldı) */}
      <SiteMetricsStrip
        totalSitesCount={totalSitesCount}
        totalUnitsAll={totalUnitsAll}
        activePaidSitesCount={activePaidSitesCount}
        trialSitesCount={trialSitesCount}
      />

      {/* 3. Arama, Filtreler ve Görünüm Seçici */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Arama Input */}
          <div className="relative w-full lg:w-72">
            <Search size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Site, yönetici veya ilçe ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-400 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filtre Butonları ve Görünüm Seçici */}
          <div className="flex items-center justify-between lg:justify-end gap-3 flex-wrap">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-xs">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tümü ({enrichedGroups.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('active')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  activeFilter === 'active'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aktif ({activePaidSitesCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('trial')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  activeFilter === 'trial'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Lansman ({trialSitesCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('critical')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  activeFilter === 'critical'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Süresi Azalan ({criticalSitesCount})
              </button>
            </div>

            {/* Görünüm Geçişi (Tablo / Kartlar) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tablo Görünümü"
              >
                <TableIcon size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Kart Görünümü"
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Tablo veya Kart Görünümü */}
        {viewMode === 'table' ? (
          <SiteTableView
            filteredGroups={filteredGroups}
            tenantSlug={tenantSlug}
            copiedId={copiedId}
            onCopyPhone={handleCopyPhone}
            onOpenQuickEdit={openQuickEdit}
            onToggleFreeze={handleToggleFreeze}
            actionGroupId={actionGroupId}
            actionFeedback={actionFeedback}
          />
        ) : (
          <SiteCardGridView
            filteredGroups={filteredGroups}
            tenantSlug={tenantSlug}
            onOpenQuickEdit={openQuickEdit}
          />
        )}
      </div>

      {/* Daire Başı Lisans Ücreti Hızlı Düzenleme Modalı */}
      <SiteLicenseModal
        group={quickEditGroup}
        onClose={() => setQuickEditGroup(null)}
        onSuccess={onRefresh}
      />
    </div>
  );
};
