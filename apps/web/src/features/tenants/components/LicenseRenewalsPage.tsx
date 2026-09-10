import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  X,
  ExternalLink,
  MapPin,
  Copy,
  Check,
  ArrowRight,
  Phone,
  Pencil,
  CalendarClock,
  Zap,
  Mail,
  Clock,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Group, User } from '@sitera/shared';
import { useNavigate } from 'react-router-dom';
import { tenantsApi } from '../services/tenants.api';

interface LicenseRenewalsPageProps {
  groups: Group[];
  loading?: boolean;
  onRefresh?: () => void;
  tenantSlug?: string;
}

export const LicenseRenewalsPage: React.FC<LicenseRenewalsPageProps> = ({
  groups,
  loading = false,
  onRefresh,
  tenantSlug = 'gencosman-apartmani',
}) => {
  const navigate = useNavigate();

  // Vade Filtreleri ve Arama
  const [renewalTimeframe, setRenewalTimeframe] = useState<'upcoming' | '15days' | '30days' | '60days' | 'overdue' | 'trial_end' | 'all'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Daire Başı Ücret Hızlı Düzenleme Modalı
  const [quickEditGroup, setQuickEditGroup] = useState<any | null>(null);
  const [quickUnitFee, setQuickUnitFee] = useState<number>(20);
  const [quickMonthlyFee, setQuickMonthlyFee] = useState<number>(480);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickSuccess, setQuickSuccess] = useState<string | null>(null);

  const openQuickEdit = (group: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const uFee = group.unitFee || 20;
    const mFee = group.monthlyFee || (group.totalUnits || 24) * uFee;
    setQuickEditGroup(group);
    setQuickUnitFee(uFee);
    setQuickMonthlyFee(mFee);
    setQuickSuccess(null);
  };

  const handleQuickSave = async () => {
    if (!quickEditGroup) return;
    setQuickSaving(true);
    try {
      await tenantsApi.update(quickEditGroup.id, {
        unitFee: Number(quickUnitFee),
        monthlyFee: Number(quickMonthlyFee),
      });
      onRefresh?.();
      setQuickSuccess('Fiyatlandırma başarıyla güncellendi.');
      setTimeout(() => {
        setQuickEditGroup(null);
        setQuickSuccess(null);
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setQuickSaving(false);
    }
  };

  const handleCopyPhone = (phone: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Her bina için zenginleştirilmiş lisans, tahsilat ve iletişim verileri
  const enrichedGroups = useMemo(() => {
    return groups.map((g) => {
      const usersList: User[] = (g as any).users || [];

      // Yöneticiler
      const managers = usersList.filter(
        (u) => u.role === 'admin' || u.role === 'accountant' || u.role === 'auditor'
      );

      // Teknik Personel
      const technicians = usersList.filter(
        (u) => u.role === 'staff' || u.role === 'security'
      );

      // Sakinler
      const residents = usersList.filter((u) => u.role === 'member');

      // Bağımsız Bölüm Sayısı
      const calculatedUnitsCount =
        g.totalUnits ||
        (residents.length > 0
          ? Array.from(new Set(residents.flatMap((r) => r.units || []))).length || residents.length
          : 24);

      // Lisans & Bedel
      const unitFee = Number(g.unitFee) || (g.monthlyFee && calculatedUnitsCount ? Math.round(Number(g.monthlyFee) / calculatedUnitsCount) : 20);
      const monthlyFee = Number(g.monthlyFee) || calculatedUnitsCount * unitFee;
      const isFrozen = !!g.isFrozen;
      const isTrial = g.subscriptionStatus === 'trial';
      const billingCycle = g.billingCycle || 'monthly';

      // Hedef Bitiş / Yenileme Tarihi
      const targetExpiry =
        isTrial && g.trialEndsAt
          ? new Date(g.trialEndsAt)
          : !isTrial && g.licenseExpiresAt
          ? new Date(g.licenseExpiresAt)
          : g.licenseExpiresAt
          ? new Date(g.licenseExpiresAt)
          : g.trialEndsAt
          ? new Date(g.trialEndsAt)
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      const diffMs = targetExpiry.getTime() - Date.now();
      const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const isOverdue = remainingDays <= 0 || g.paymentStatus === 'overdue';

      // Tahsil Edilecek Tutar (Daire Sayısı × Daire Başı Ücret):
      const renewalAmount = billingCycle === 'yearly' ? monthlyFee * 12 : monthlyFee;
      const yearlyProjected = monthlyFee * 12;

      // Yenileme Türü:
      const renewalType = isOverdue
        ? 'overdue'
        : isTrial
        ? 'trial_end'
        : 'regular';

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
        billingCycle,
        renewalAmount,
        yearlyProjected,
        renewalType,
        isFrozen,
        isTrial,
        isOverdue,
        remainingDays,
        targetExpiry,
      };
    });
  }, [groups]);

  // Yaklaşan yenilemeler (60 gün içinde olanlar, gecikmede olanlar veya lansman denemesi bitmek üzere olanlar)
  const upcomingRenewals = useMemo(() => {
    return enrichedGroups
      .filter((g) => g.remainingDays <= 60 || g.isOverdue || g.isTrial)
      .sort((a, b) => a.remainingDays - b.remainingDays);
  }, [enrichedGroups]);

  // Filtreleme ve Arama
  const filteredRenewals = useMemo(() => {
    const baseList = renewalTimeframe === 'all' ? enrichedGroups : upcomingRenewals;
    return baseList.filter((g) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = g.name.toLowerCase().includes(q);
        const matchSlug = g.slug.toLowerCase().includes(q);
        const matchCity = g.city?.toLowerCase().includes(q);
        const matchDistrict = g.district?.toLowerCase().includes(q);
        const matchManager = g.managers.some(
          (m) => m.name.toLowerCase().includes(q) || m.phone?.includes(q) || m.email?.toLowerCase().includes(q)
        );
        if (!matchName && !matchSlug && !matchCity && !matchDistrict && !matchManager) {
          return false;
        }
      }

      if (renewalTimeframe === '15days') return g.remainingDays <= 15 && !g.isOverdue;
      if (renewalTimeframe === '30days') return g.remainingDays <= 30 && !g.isOverdue;
      if (renewalTimeframe === '60days') return g.remainingDays <= 60 && !g.isOverdue;
      if (renewalTimeframe === 'overdue') return g.isOverdue;
      if (renewalTimeframe === 'trial_end') return g.isTrial;
      return true;
    });
  }, [upcomingRenewals, enrichedGroups, searchQuery, renewalTimeframe]);

  // Metrik Hesaplamaları
  const overdueCount = upcomingRenewals.filter((g) => g.isOverdue).length;
  const within15Count = upcomingRenewals.filter((g) => g.remainingDays <= 15 && !g.isOverdue).length;
  const within30Count = upcomingRenewals.filter((g) => g.remainingDays <= 30 && !g.isOverdue).length;
  const within60Count = upcomingRenewals.filter((g) => g.remainingDays <= 60 && !g.isOverdue).length;
  const trialEndCount = upcomingRenewals.filter((g) => g.isTrial).length;

  const totalUpcomingExpectedRevenue = upcomingRenewals.reduce((sum, g) => sum + (g.renewalAmount || 0), 0);
  const within15ExpectedRevenue = upcomingRenewals
    .filter((g) => g.remainingDays <= 15 && !g.isOverdue)
    .reduce((sum, g) => sum + (g.renewalAmount || 0), 0);
  const overdueRevenue = upcomingRenewals
    .filter((g) => g.isOverdue)
    .reduce((sum, g) => sum + (g.renewalAmount || 0), 0);

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full max-w-full overflow-hidden font-sans pb-16">
      {/* 1. Sayfa Başlığı ve Aksiyon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Lisans &amp; Ödeme Takvimi
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-100 text-amber-900 border border-amber-200">
              {upcomingRenewals.length} Yaklaşan
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Sistem genelinde lisans süresi dolmak üzere olan veya gecikmede bulunan sitelerin tahsilat takvimi
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/${tenantSlug}/admin/sites`)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
        >
          <Building2 size={15} className="text-slate-500" />
          <span>Tüm Siteleri Yönet</span>
        </button>
      </div>

      {/* 2. Kurumsal Özet Metrik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metrik 1: Toplam Beklenen Yenileme Tahsilatı */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Yaklaşan Toplam Tahsilat</span>
            <Zap size={16} className="text-indigo-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              ₺{totalUpcomingExpectedRevenue.toLocaleString('tr-TR')}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {upcomingRenewals.length} siteden beklenen lisans cirosu
            </div>
          </div>
        </div>

        {/* Metrik 2: 15 Gün İçinde Vadesi Gelenler */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>15 Gün İçinde Vadesi Gelen</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-600 font-mono tabular-nums">
              {within15Count} Site
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-mono">
              ₺{within15ExpectedRevenue.toLocaleString('tr-TR')} acil tahsilat periyodu
            </div>
          </div>
        </div>

        {/* Metrik 3: Lansmandan Ücretliye Geçecekler */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Lansman Sonu (İlk Tahsilat)</span>
            <Sparkles size={16} className="text-blue-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-blue-600 font-mono tabular-nums">
              {trialEndCount} Site
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              3 aylık lansman süresi biten yeni aboneler
            </div>
          </div>
        </div>

        {/* Metrik 4: Gecikmedeki Ödemeler */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Gecikmedeki Lisanslar</span>
            <AlertTriangle size={16} className={overdueCount > 0 ? 'text-rose-500' : 'text-slate-400'} />
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-bold font-mono tabular-nums ${overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {overdueCount} Site
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {overdueCount > 0 ? (
                <span className="text-rose-600 font-mono font-medium">₺{overdueRevenue.toLocaleString('tr-TR')} tahsilat bekleniyor</span>
              ) : (
                <span>Gecikmiş ödeme bulunmuyor</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Otomatik Tahsilat & Lisanslama Bilgilendirme Notu */}
      <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border border-blue-200/70 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-950 shadow-2xs">
        <div className="p-1.5 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5 shadow-2xs">
          <Zap size={14} />
        </div>
        <div className="space-y-0.5 flex-1">
          <div className="font-semibold text-blue-950 flex items-center gap-1.5">
            <span>Otomatik Tahsilat &amp; Yenileme Sistemi Devrede</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-blue-800 leading-relaxed text-[11px] sm:text-xs">
            Bu ekrandaki siteler için manuel &ldquo;Tahsil Edildi &amp; Uzat&rdquo; işlemine gerek yoktur. Site yöneticisi online ödeme yaptığında lisans süresi sistem tarafından <strong>anında otomatik olarak uzatılır</strong>. Gerektiğinde yönetici iletişim bilgileri üzerinden doğrudan iletişime geçebilirsiniz.
          </p>
        </div>
      </div>

      {/* 4. Vade Filtreleri ve Arama Çubuğu */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Arama Input */}
          <div className="relative w-full lg:w-72">
            <Search size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Site adı, yönetici veya ilçe ara..."
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

          {/* Vade Filtreleme Butonları */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => setRenewalTimeframe('upcoming')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                renewalTimeframe === 'upcoming'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yaklaşanlar ({upcomingRenewals.length})
            </button>
            <button
              type="button"
              onClick={() => setRenewalTimeframe('15days')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                renewalTimeframe === '15days'
                  ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              15 Gün İçinde ({within15Count})
            </button>
            <button
              type="button"
              onClick={() => setRenewalTimeframe('30days')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                renewalTimeframe === '30days'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Gün İçinde ({within30Count})
            </button>
            <button
              type="button"
              onClick={() => setRenewalTimeframe('60days')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                renewalTimeframe === '60days'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              60 Gün İçinde ({within60Count})
            </button>
            <button
              type="button"
              onClick={() => setRenewalTimeframe('overdue')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                renewalTimeframe === 'overdue'
                  ? 'bg-rose-50 text-rose-700 shadow-2xs font-bold border border-rose-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gecikmede ({overdueCount})
            </button>
            <button
              type="button"
              onClick={() => setRenewalTimeframe('trial_end')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                renewalTimeframe === 'trial_end'
                  ? 'bg-blue-50 text-blue-700 shadow-2xs font-semibold border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lansman Sonu ({trialEndCount})
            </button>
            <button
              type="button"
              onClick={() => setRenewalTimeframe('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                renewalTimeframe === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tüm Siteler ({enrichedGroups.length})
            </button>
          </div>
        </div>

        {/* 5. Yaklaşan Lisans Yenilemeleri Tablosu */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-medium text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Site / Apartman</th>
                <th className="py-3 px-4 whitespace-nowrap">Vade &amp; Kalan Gün</th>
                <th className="py-3 px-4 whitespace-nowrap">Daire × Birim Fiyat</th>
                <th className="py-3 px-4 whitespace-nowrap">Tahsil Edilecek Tutar</th>
                <th className="py-3 px-4 whitespace-nowrap">Ödeme / Yenileme Türü</th>
                <th className="py-3 px-4 whitespace-nowrap">Tahsilat Durumu</th>
                <th className="py-3 px-4">Yönetici &amp; İletişim</th>
                <th className="py-3 px-4 text-right whitespace-nowrap w-24">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRenewals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CalendarClock size={24} className="mx-auto mb-2 text-slate-300" />
                    <div className="font-medium text-slate-700">Seçilen kriterde yaklaşan ödeme bulunamadı</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tüm lisans vadeleri bu filtre için güncel ve düzenli durumdadır.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRenewals.map((group) => {
                  const detailUrl = `/${tenantSlug}/admin/sites/${group.slug}`;
                  const targetSiteOverviewUrl = `/${group.slug}/admin/overview`;
                  const primaryManager = group.managers[0];

                  return (
                    <tr key={group.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Site / Apartman & Konum */}
                      <td className="py-3.5 px-4 sm:px-6">
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
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                            <MapPin size={11} className="text-slate-400 shrink-0" />
                            <span>{group.district}, {group.city}</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Vade Tarihi & Kalan Süre */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900 text-xs">
                          {new Date(group.targetExpiry).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="mt-1">
                          {group.isOverdue ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle size={11} />
                              <span>Gecikmede ({Math.abs(group.remainingDays)} gün)</span>
                            </span>
                          ) : group.remainingDays <= 15 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>{group.remainingDays} gün kaldı</span>
                            </span>
                          ) : group.remainingDays <= 30 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50/70 text-amber-700 border border-amber-200/60">
                              <span>{group.remainingDays} gün kaldı</span>
                            </span>
                          ) : group.remainingDays <= 60 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              <span>{group.remainingDays} gün kaldı</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>{group.remainingDays} gün kaldı (Aktif)</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Daire Sayısı × Daire Başı Ücret (Formül) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-mono text-xs">
                          <span className="font-bold text-slate-900">{group.totalUnits} Daire</span>
                          <span className="text-slate-400">×</span>
                          <span className="font-bold text-indigo-600">₺{group.unitFee}</span>
                          <span className="text-slate-400 text-[11px]">/daire</span>
                          <button
                            type="button"
                            onClick={(e) => openQuickEdit(group, e)}
                            className="text-slate-400 hover:text-slate-800 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer ml-0.5"
                            title="Daire başı ücreti düzenle"
                          >
                            <Pencil size={11} />
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Aylık Çarpan: ₺{group.monthlyFee.toLocaleString('tr-TR')}
                        </div>
                      </td>

                      {/* 4. Tahsil Edilecek Tutar */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-sm font-bold text-slate-900">
                          ₺{group.renewalAmount.toLocaleString('tr-TR')}{' '}
                          <span className="text-xs font-normal text-slate-500">
                            / {group.billingCycle === 'yearly' ? 'yıl' : 'ay'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {group.billingCycle === 'yearly' ? (
                            <span>Aylık: ₺{group.monthlyFee.toLocaleString('tr-TR')}/ay</span>
                          ) : (
                            <span>Yıllık: ₺{group.yearlyProjected.toLocaleString('tr-TR')}</span>
                          )}
                        </div>
                      </td>

                      {/* 5. Ödeme / Yenileme Türü */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {group.isOverdue ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle size={11} />
                              <span>Gecikmede</span>
                            </span>
                            <div className="text-[10px] text-rose-600 mt-0.5">
                              Vadesi dolmuş ödeme
                            </div>
                          </div>
                        ) : group.isTrial ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <Sparkles size={11} className="text-blue-600" />
                              <span>Lansman Sonu</span>
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              İlk ücretli tahsilat
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              <RefreshCw size={11} />
                              <span>Normal Yenileme</span>
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {group.billingCycle === 'yearly' ? 'Yıllık' : 'Aylık'} periyodik
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 6. Tahsilat Durumu & Otomasyon Bilgisi */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50/80 text-blue-700 border border-blue-200/70 w-fit">
                            <Zap size={11} className="text-blue-600" />
                            <span>Otomatik Tahsilat Bekleniyor</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Kullanıcı ödediğinde sistem uzatır
                          </span>
                        </div>
                      </td>

                      {/* 7. Yönetici & İletişim (Tek Tıkla Aksiyon) */}
                      <td className="py-3.5 px-4">
                        {primaryManager ? (
                          <div className="min-w-0 space-y-1">
                            <div className="font-semibold text-slate-900 truncate text-xs">
                              {primaryManager.name}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {primaryManager.phone ? (
                                <div className="flex items-center gap-1">
                                  <a
                                    href={`tel:${primaryManager.phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 text-[11px] text-slate-700 hover:text-indigo-600 font-mono transition-colors"
                                    title="Doğrudan Ara"
                                  >
                                    <Phone size={10} className="text-slate-400" />
                                    <span>{primaryManager.phone}</span>
                                  </a>
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopyPhone(primaryManager.phone!, `${group.id}-renew-mgr`, e)}
                                    className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors cursor-pointer"
                                    title="Numarayı kopyala"
                                  >
                                    {copiedId === `${group.id}-renew-mgr` ? (
                                      <Check size={10} className="text-emerald-600" />
                                    ) : (
                                      <Copy size={10} className="text-slate-300 hover:text-slate-500" />
                                    )}
                                  </button>
                                </div>
                              ) : null}

                              {primaryManager.email ? (
                                <a
                                  href={`mailto:${primaryManager.email}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors truncate max-w-[140px]"
                                  title="E-posta Gönder"
                                >
                                  <Mail size={10} className="text-slate-400 shrink-0" />
                                  <span className="truncate">{primaryManager.email}</span>
                                </a>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Yönetici bilgisi yok</span>
                        )}
                      </td>

                      {/* 8. İşlemler */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(detailUrl)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Site Yönetim Detayına Git"
                          >
                            <span>İncele</span>
                            <ArrowRight size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => window.open(targetSiteOverviewUrl, '_blank')}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Site paneline yeni sekmede git"
                          >
                            <ExternalLink size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daire Başı Lisans Ücreti Hızlı Düzenleme Modalı */}
      {quickEditGroup && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Daire Başı Lisans Ücreti Düzenle
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {quickEditGroup.name} · {quickEditGroup.totalUnits} Bağımsız Bölüm
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickEditGroup(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">
                    Daire Başı Ücret (₺)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={quickUnitFee}
                      onChange={(e) => {
                        const u = parseFloat(e.target.value) || 0;
                        setQuickUnitFee(u);
                        setQuickMonthlyFee(Math.round((quickEditGroup.totalUnits || 24) * u));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-7 py-2 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-slate-400"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">₺</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">
                    Aylık Toplam (₺ / ay)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={quickMonthlyFee}
                      onChange={(e) => {
                        const m = parseFloat(e.target.value) || 0;
                        setQuickMonthlyFee(m);
                        const units = quickEditGroup.totalUnits || 24;
                        setQuickUnitFee(units > 0 ? parseFloat((m / units).toFixed(2)) : 20);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-7 py-2 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-slate-400"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">₺</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100 flex items-center justify-between font-mono">
                <span>Tarife Özeti:</span>
                <span>{quickEditGroup.totalUnits || 24} daire × ₺{quickUnitFee} = <strong className="text-slate-900">₺{quickMonthlyFee}/ay</strong></span>
              </div>

              {quickSuccess && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-600" />
                  <span>{quickSuccess}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickEditGroup(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={quickSaving}
                onClick={handleQuickSave}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
              >
                {quickSaving ? 'Kaydediliyor...' : 'Fiyatı Güncelle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
