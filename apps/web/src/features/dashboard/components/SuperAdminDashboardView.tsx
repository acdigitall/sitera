import React, { useState, useMemo } from 'react';
import {
  Building2,
  Users2,
  Search,
  Plus,
  ArrowRight,
  MapPin,
  X,
  Layers,
  Phone,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  CalendarClock,
} from 'lucide-react';
import { Group, User } from '@sitera/shared';
import { useNavigate } from 'react-router-dom';
import { SuperAdminCashflowChart } from './SuperAdminCashflowChart';
import { SuperAdminUserDistributionChart } from './SuperAdminUserDistributionChart';

interface SuperAdminDashboardProps {
  groups: Group[];
  health?: { status: string; database?: string; redis?: string } | null;
  loading?: boolean;
  tenantSlug?: string;
  onOpenCreateAdmin?: () => void;
}

export const SuperAdminDashboardView: React.FC<SuperAdminDashboardProps> = ({
  groups,
  health,
  loading = false,
  tenantSlug,
  onOpenCreateAdmin,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'trial' | 'critical' | 'with_admin'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyPhone = (phone: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Her bina için zenginleştirilmiş verileri hesapla
  const enrichedGroups = useMemo(() => {
    return groups.map((g) => {
      const usersList: User[] = (g as any).users || [];

      const managers = usersList.filter(
        (u) => u.role === 'admin' || u.role === 'accountant' || u.role === 'auditor'
      );

      const technicians = usersList.filter(
        (u) => u.role === 'staff' || u.role === 'security'
      );

      const residents = usersList.filter((u) => u.role === 'member');

      const calculatedUnitsCount =
        g.totalUnits ||
        (residents.length > 0
          ? Array.from(new Set(residents.flatMap((r) => r.units || []))).length || residents.length
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
      };
    });
  }, [groups]);

  // Canlı Filtreleme ve Arama
  const filteredGroups = useMemo(() => {
    return enrichedGroups.filter((g) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = g.name.toLowerCase().includes(q);
        const matchSlug = g.slug.toLowerCase().includes(q);
        const matchCity = g.city?.toLowerCase().includes(q);
        const matchDistrict = g.district?.toLowerCase().includes(q);
        const matchManager = g.managers.some(
          (m) => m.name.toLowerCase().includes(q) || m.phone?.includes(q)
        );
        const matchTech = g.technicians.some(
          (t) => t.name.toLowerCase().includes(q) || t.phone?.includes(q)
        );

        if (!matchName && !matchSlug && !matchCity && !matchDistrict && !matchManager && !matchTech) {
          return false;
        }
      }

      if (activeFilter === 'trial') return g.isTrial;
      if (activeFilter === 'critical') return g.remainingDays <= 30 && !g.isFrozen;
      if (activeFilter === 'with_admin') return g.managers.length > 0;
      return true;
    });
  }, [enrichedGroups, searchQuery, activeFilter]);

  const totalSites = enrichedGroups.length;
  const totalUnitsAll = enrichedGroups.reduce((sum, g) => sum + (g.totalUnits || 0), 0);
  const totalMRR = enrichedGroups.reduce((sum, g) => sum + (g.monthlyFee || 0), 0);
  const paidMRR = enrichedGroups
    .filter((g) => !g.isTrial && !g.isFrozen && g.paymentStatus === 'paid')
    .reduce((sum, g) => sum + (g.monthlyFee || 0), 0);
  const trialSitesCount = enrichedGroups.filter((g) => g.isTrial).length;
  const criticalSitesCount = enrichedGroups.filter((g) => g.remainingDays <= 30 && !g.isFrozen).length;

  const isDbHealthy = health ? Boolean(health.database?.includes('connected')) : true;
  const isRedisHealthy = health ? Boolean(health.redis === 'connected') : true;
  const isAllHealthy = health ? (isDbHealthy && isRedisHealthy && health.status === 'ok') : true;

  if (loading && groups.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-pulse w-full max-w-full overflow-hidden font-sans pb-16">
        <div className="h-12 bg-slate-200/60 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-24 bg-white rounded-xl border border-slate-200" />
          <div className="h-24 bg-white rounded-xl border border-slate-200" />
          <div className="h-24 bg-white rounded-xl border border-slate-200" />
          <div className="h-24 bg-white rounded-xl border border-slate-200" />
        </div>
        <div className="h-80 bg-white rounded-xl border border-slate-200" />
      </div>
    );
  }

  const currentTenantSlug = tenantSlug || groups[0]?.slug || 'gencosman-apartmani';

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full max-w-full overflow-hidden font-sans pb-16">
      {/* 1. Sayfa Başlığı ve Temel Aksiyon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Platform Genel Bakış
            </h1>
            {isAllHealthy ? (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs"
                title="PostgreSQL, Redis ve API ayakta"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-500 font-normal">Sistem Durumu:</span>
                <span className="font-semibold text-emerald-700">Tüm Servisler Aktif</span>
                <span className="hidden md:inline text-emerald-600/80 text-[11px] font-normal">
                  (PostgreSQL, Redis ve API ayakta)
                </span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs"
                title="Veritabanı veya önbellek sunucusuna erişilemiyor"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-rose-600/80 font-normal">Sistem Durumu:</span>
                <span className="font-semibold text-rose-700">
                  {!isDbHealthy && !isRedisHealthy
                    ? 'Veritabanı veya Redis Erişilemiyor'
                    : !isDbHealthy
                    ? 'Veritabanı Erişilemiyor'
                    : 'Redis Erişilemiyor'}
                </span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Sistem genelindeki kayıtlı siteler, bağımsız bölümler ve lisans durumu
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => navigate(`/${currentTenantSlug}/admin/licenses`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <CalendarClock size={15} className="text-amber-600" />
            <span>Lisans &amp; Ödeme Takvimi</span>
            {criticalSitesCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/${currentTenantSlug}/admin/sites`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <Building2 size={15} className="text-slate-500" />
            <span>Tüm Siteleri Yönet</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (onOpenCreateAdmin) {
                onOpenCreateAdmin();
              } else {
                navigate(`/${currentTenantSlug}/admin/sites/new`);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={15} />
            <span>Yeni Site Ekle</span>
          </button>
        </div>
      </div>

      {/* 2. Kurumsal KPI Metrik Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metrik 1: Kayıtlı Siteler */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Kayıtlı Siteler</span>
            <Building2 size={16} className="text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {totalSites}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Tüm binalar devrede</span>
            </div>
          </div>
        </div>

        {/* Metrik 2: Toplam Bağımsız Bölüm */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Bağımsız Bölüm</span>
            <Layers size={16} className="text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {totalUnitsAll}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Ortalama {Math.round(totalUnitsAll / Math.max(1, totalSites))} daire / site
            </div>
          </div>
        </div>

        {/* Metrik 3: Platform MRR */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Platform MRR</span>
            <span className="text-[11px] text-slate-400 font-mono">₺/ay</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              ₺{totalMRR.toLocaleString('tr-TR')}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              ₺{paidMRR.toLocaleString('tr-TR')} tahsilat
            </div>
          </div>
        </div>

        {/* Metrik 4: Lansman & Lisans Durumu */}
        <div
          onClick={() => navigate(`/${currentTenantSlug}/admin/licenses`)}
          className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors cursor-pointer group"
          title="Yaklaşan Lisans Yenilemeleri & Ödeme Takvimine Git"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Yaklaşan Yenilemeler</span>
            <CalendarClock size={16} className="text-amber-500 group-hover:text-amber-600 transition-colors" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums flex items-center justify-between">
              <span>{criticalSitesCount} Site</span>
              <span className="text-[11px] text-indigo-600 font-sans font-medium flex items-center gap-0.5 group-hover:underline">
                Takvime Git <ArrowRight size={12} />
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {criticalSitesCount > 0 ? (
                <span className="text-amber-600 font-medium">{criticalSitesCount} sitenin lisans vadesi yaklaşıyor</span>
              ) : (
                <span>Tüm lisans vadeleri güncel</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Çift Grafik Bölümü (Nakit Akışı & Rol Dağılımı) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          <SuperAdminCashflowChart />
        </div>
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          <SuperAdminUserDistributionChart groups={groups} />
        </div>
      </div>

      {/* 4. Kayıtlı Siteler & Apartmanlar Tablosu */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        {/* Tablo Üst Araç Çubuğu */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">
              Kayıtlı Apartmanlar ve Siteler
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sistemdeki tüm sitelerin yönetici, bağımsız bölüm ve lisans durumu
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Arama Input */}
            <div className="relative w-full sm:w-60">
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

            {/* Filtre Butonları */}
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
              <button
                type="button"
                onClick={() => setActiveFilter('with_admin')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  activeFilter === 'with_admin'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yöneticili
              </button>
            </div>
          </div>
        </div>

        {/* Tablo İçeriği */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-medium text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4">Site / Apartman</th>
                <th className="py-2.5 px-4">Konum</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Bağımsız Bölüm</th>
                <th className="py-2.5 px-4">Site Yöneticisi</th>
                <th className="py-2.5 px-4">Teknik Personel</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Lisans Durumu</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap w-24">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertCircle size={20} className="mx-auto mb-1.5 text-slate-300" />
                    Kriterlere uygun site bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => {
                  const primaryManager = group.managers[0];
                  const primaryTech = group.technicians[0];
                  const detailUrl = `/${currentTenantSlug}/admin/sites/${group.slug}`;

                  return (
                    <tr
                      key={group.id}
                      onClick={() => navigate(detailUrl)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* 1. Site Adı & Slug */}
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{group.name}</span>
                            {group.isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Aktif Site" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            sitera.app/{group.slug}
                          </div>
                        </div>
                      </td>

                      {/* 2. Konum */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span>{group.district}, {group.city}</span>
                        </div>
                      </td>

                      {/* 3. Bağımsız Bölüm */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-medium text-slate-900">
                          {group.totalUnits} Bölüm
                        </span>
                        <div className="text-[11px] text-slate-400">
                          {group.residentsCount} kayıtlı sakin
                        </div>
                      </td>

                      {/* 4. Site Yöneticisi */}
                      <td className="py-3 px-4">
                        {primaryManager ? (
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 truncate">
                              {primaryManager.name}
                            </div>
                            {primaryManager.phone ? (
                              <button
                                type="button"
                                onClick={(e) => handleCopyPhone(primaryManager.phone!, `${group.id}-mgr`, e)}
                                className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 font-mono transition-colors cursor-pointer mt-0.5"
                                title="Telefon numarasını kopyala"
                              >
                                <Phone size={10} className="text-slate-400" />
                                <span>{primaryManager.phone}</span>
                                {copiedId === `${group.id}-mgr` ? (
                                  <Check size={10} className="text-emerald-600" />
                                ) : (
                                  <Copy size={10} className="text-slate-300 hover:text-slate-500" />
                                )}
                              </button>
                            ) : (
                              <div className="text-[11px] text-slate-400 truncate">
                                {primaryManager.email}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Yönetici atanmamış</span>
                        )}
                      </td>

                      {/* 5. Teknik Kadro */}
                      <td className="py-3 px-4">
                        {primaryTech ? (
                          <div className="min-w-0">
                            <div className="font-medium text-slate-800 truncate">
                              {primaryTech.name}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {primaryTech.phone || 'Teknik Servis'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Tanımlı değil</span>
                        )}
                      </td>

                      {/* 6. Lisans Durumu */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {group.isTrial ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              Lansman ({group.remainingDays} gün)
                            </span>
                          ) : group.remainingDays <= 30 ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              {group.remainingDays} gün kaldı
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Aktif Lisans
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          ₺{group.unitFee}/daire <span className="text-slate-300">·</span> ₺{group.monthlyFee}/ay
                        </div>
                      </td>

                      {/* 7. İşlem */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(detailUrl);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <span>Yönet</span>
                          <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
