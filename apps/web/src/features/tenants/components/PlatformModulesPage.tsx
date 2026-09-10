import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  X,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Car,
  QrCode,
  PhoneCall,
  CalendarCheck,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Sliders,
  Check,
  Store,
  Info,
} from 'lucide-react';
import {
  Group,
  PlatformModuleCode,
  PlatformModuleDefinition,
  GroupModuleSubscription,
  PLATFORM_MODULE_CATALOG,
} from '@sitera/shared';
import { useNavigate } from 'react-router-dom';
import { modulesApi } from '../services/modules.api';

interface PlatformModulesPageProps {
  groups: Group[];
  loading?: boolean;
  onRefresh?: () => void;
  tenantSlug?: string;
}

// Kısa etiketler ve renk yapılandırması
const MODULE_CONFIG: Record<
  PlatformModuleCode,
  { label: string; shortLabel: string; category: string }
> = {
  ANPR_PLATE_RECOGNITION: {
    label: 'Plaka Tanıma',
    shortLabel: 'Plaka',
    category: 'IoT / Kamera',
  },
  GUEST_QR_PASS: {
    label: 'Misafir QR',
    shortLabel: 'Misafir QR',
    category: 'Geçiş',
  },
  SMART_INTERCOM: {
    label: 'Akıllı İnterkom',
    shortLabel: 'İnterkom',
    category: 'IoT / SIP',
  },
  FACILITY_RESERVATION: {
    label: 'Tesis Rezervasyon',
    shortLabel: 'Tesis',
    category: 'Bulut',
  },
  VALET_PARKING: {
    label: 'Vale & Otopark',
    shortLabel: 'Otopark',
    category: 'Güvenlik',
  },
};

export const PlatformModulesPage: React.FC<PlatformModulesPageProps> = ({
  groups,
  loading = false,
  onRefresh,
  tenantSlug = 'gencosman-apartmani',
}) => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'has_active' | 'has_trial' | 'none'>('all');
  const [savingModule, setSavingModule] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Matris ve Hesaplamalar
  const matrixData = useMemo(() => {
    return groups.map((g) => {
      const activeSubs: GroupModuleSubscription[] = Array.isArray(g.modules) ? g.modules : [];
      const subMap = new Map<string, GroupModuleSubscription>();
      activeSubs.forEach((s) => subMap.set(s.moduleCode, s));

      const units = g.totalUnits || 24;
      let extraMrr = 0;

      PLATFORM_MODULE_CATALOG.forEach((def) => {
        const sub = subMap.get(def.code);
        if (sub && sub.status === 'active') {
          const price = sub.price !== undefined ? sub.price : def.defaultPrice;
          if (def.pricingModel === 'per_unit') {
            extraMrr += units * price;
          } else {
            extraMrr += price;
          }
        }
      });

      const activeList = activeSubs.filter((s) => s.status === 'active');
      const trialList = activeSubs.filter((s) => s.status === 'trial');

      return {
        group: g,
        subMap,
        activeList,
        trialList,
        activeCount: activeList.length,
        trialCount: trialList.length,
        totalAddonCount: activeList.length + trialList.length,
        extraMrr,
        units,
      };
    });
  }, [groups]);

  // Filtrelenmiş Siteler
  const filteredData = useMemo(() => {
    return matrixData.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.group.name.toLowerCase().includes(q);
        const matchSlug = item.group.slug.toLowerCase().includes(q);
        const matchCity = item.group.city?.toLowerCase().includes(q);
        const matchDistrict = item.group.district?.toLowerCase().includes(q);
        if (!matchName && !matchSlug && !matchCity && !matchDistrict) {
          return false;
        }
      }

      if (filterStatus === 'has_active') return item.activeCount > 0;
      if (filterStatus === 'has_trial') return item.trialCount > 0;
      if (filterStatus === 'none') return item.totalAddonCount === 0;

      return true;
    });
  }, [matrixData, searchQuery, filterStatus]);

  // Özet İstatistikler
  const totalActiveSubs = matrixData.reduce((sum, m) => sum + m.activeCount, 0);
  const totalTrialSubs = matrixData.reduce((sum, m) => sum + m.trialCount, 0);
  const totalExtraMrr = matrixData.reduce((sum, m) => sum + m.extraMrr, 0);
  const sitesWithAddons = matrixData.filter((m) => m.totalAddonCount > 0).length;

  // İkon Eşleştirici
  const renderModuleIcon = (iconName: string, size = 14) => {
    switch (iconName) {
      case 'Car':
        return <Car size={size} />;
      case 'QrCode':
        return <QrCode size={size} />;
      case 'PhoneCall':
        return <PhoneCall size={size} />;
      case 'CalendarCheck':
        return <CalendarCheck size={size} />;
      case 'ShieldAlert':
        return <ShieldAlert size={size} />;
      default:
        return <Layers size={size} />;
    }
  };

  // Modül Durumunu Döndürerek Değiştir (Kapalı -> Deneme -> Aktif -> Kapalı)
  const handleCycleStatus = async (
    groupId: string,
    groupName: string,
    moduleCode: PlatformModuleCode,
    currentStatus: 'active' | 'trial' | 'inactive'
  ) => {
    if (savingModule) return;

    let nextStatus: 'active' | 'trial' | 'inactive';
    let durationDays = 30;

    if (currentStatus === 'inactive') {
      nextStatus = 'trial';
      durationDays = 30;
    } else if (currentStatus === 'trial') {
      nextStatus = 'active';
      durationDays = 365;
    } else {
      nextStatus = 'inactive';
      durationDays = 0;
    }

    setSavingModule(true);
    setFeedback(null);
    try {
      await modulesApi.toggleModule(groupId, {
        moduleCode,
        status: nextStatus,
        durationDays,
      });
      onRefresh?.();
      const modName = MODULE_CONFIG[moduleCode]?.label || moduleCode;
      setFeedback({
        type: 'success',
        message: `${groupName} · ${modName}: ${
          nextStatus === 'active' ? 'Aktif Lisans Yapıldı' : nextStatus === 'trial' ? '30 Gün Deneme Başlatıldı' : 'Kapatıldı'
        }`,
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: err.message || 'İşlem gerçekleştirilemedi.',
      });
    } finally {
      setSavingModule(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full max-w-full overflow-hidden font-sans pb-16">
      {/* 1. Sayfa Başlığı ve Aksiyonlar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Modül &amp; Eklenti Yönetimi
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
              <Sparkles size={12} className="text-indigo-600" />
              <span>SaaS Feature Entitlements</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Plaka tanıma, misafir QR, akıllı interkom ve tesis rezervasyonu modüllerinin siteler bazında aktivasyon ve lisans yönetimi
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => navigate(`/${tenantSlug}/admin/marketplace`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Site yöneticilerinin gördüğü Modül Pazarı vitrini"
          >
            <Store size={14} className="text-indigo-600" />
            <span>Modül Pazarı Vitrini</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/${tenantSlug}/admin/sites`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <Building2 size={14} className="text-slate-500" />
            <span>Siteler Kataloğu</span>
          </button>
        </div>
      </div>

      {/* 2. Kurumsal 4 Temel KPI Kartı */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metrik 1 */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Aktif Lisanslar</span>
            <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
              <CheckCircle2 size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {totalActiveSubs} Lisans
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {sitesWithAddons} sitede aktif kullanılıyor
            </div>
          </div>
        </div>

        {/* Metrik 2 */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>30 Günlük Denemeler</span>
            <div className="w-6 h-6 rounded bg-purple-50 text-purple-600 flex items-center justify-center text-xs">
              <Clock size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-purple-700 font-mono tabular-nums">
              {totalTrialSubs} Deneme
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Ücretsiz test sürecindeki modüller
            </div>
          </div>
        </div>

        {/* Metrik 3 */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Add-on Aylık Gelir (MRR)</span>
            <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">
              <TrendingUp size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-indigo-600 font-mono tabular-nums">
              ₺{totalExtraMrr.toLocaleString('tr-TR')}
              <span className="text-xs font-sans text-slate-400 font-normal"> /ay</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Yıllık ek ciro: <strong className="font-mono text-slate-700">₺{(totalExtraMrr * 12).toLocaleString('tr-TR')}</strong>
            </div>
          </div>
        </div>

        {/* Metrik 4 */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Satışa Açık Çözümler</span>
            <div className="w-6 h-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center text-xs">
              <Layers size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {PLATFORM_MODULE_CATALOG.length} Modül
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Plaka, QR, İnterkom, Tesis, Vale
            </div>
          </div>
        </div>
      </div>

      {/* 3. TEK VE FERAH MODÜL YETKİ MATRİSİ TABLOSU */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        {/* Üst Arama & Filtre Çubuğu */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Arama Barı */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Site adı veya ilçe ara..."
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

          {/* Durum Filtre Butonları */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-xs">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tümü ({matrixData.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('has_active')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  filterStatus === 'has_active'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aktif Eklentili ({matrixData.filter((m) => m.activeCount > 0).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('has_trial')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  filterStatus === 'has_trial'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Denemedekiler ({matrixData.filter((m) => m.trialCount > 0).length})
              </button>
            </div>
          </div>
        </div>

        {/* Canlı Geri Bildirim */}
        {feedback && (
          <div
            className={`p-3 text-xs flex items-center gap-2 border-b animate-fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={14} className="text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Ana Matris Tablosu */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[860px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-medium text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6 min-w-[260px] w-72">Site / Apartman</th>
                {PLATFORM_MODULE_CATALOG.map((mod) => {
                  const cfg = MODULE_CONFIG[mod.code];
                  return (
                    <th key={mod.code} className="py-3 px-3 text-center whitespace-nowrap w-36">
                      <div className="flex items-center justify-center gap-1">
                        {renderModuleIcon(mod.iconName, 13)}
                        <span>{cfg.shortLabel}</span>
                      </div>
                    </th>
                  );
                })}
                <th className="py-3 px-5 text-right whitespace-nowrap w-36">Ek MRR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertCircle size={20} className="mx-auto mb-1.5 text-slate-300" />
                    Arama kriterlerinize uygun site bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredData.map(({ group, subMap, extraMrr, units }) => {
                  return (
                    <tr key={group.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Site Adı & Konumu (Asla Dikey Kırılmaz) */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5 whitespace-nowrap">
                            <span>{group.name}</span>
                            {group.isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Aktif Site" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">
                            {units} Bağımsız Bölüm · {group.district ? `${group.district}, ` : ''}{group.city || 'İstanbul'}
                          </div>
                        </div>
                      </td>

                      {/* 5 Modül Hücresi: Tek Tıkla Durumu Değiştiren Sade Düğmeler */}
                      {PLATFORM_MODULE_CATALOG.map((mod) => {
                        const sub = subMap.get(mod.code);
                        const currentStatus: 'active' | 'trial' | 'inactive' = sub?.status || 'inactive';
                        const cost = mod.pricingModel === 'per_unit' ? units * mod.defaultPrice : mod.defaultPrice;

                        return (
                          <td key={mod.code} className="py-3 px-2.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              disabled={savingModule}
                              onClick={() => handleCycleStatus(group.id, group.name, mod.code, currentStatus)}
                              className="cursor-pointer transition-all active:scale-95 inline-flex items-center justify-center"
                              title={`${mod.name} (${mod.pricingModel === 'per_unit' ? `₺${mod.defaultPrice}/daire = ₺${cost}/ay` : `₺${mod.defaultPrice}/ay`})\nTıklayarak durumu değiştirin.`}
                            >
                              {currentStatus === 'active' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span>Aktif</span>
                                </span>
                              ) : currentStatus === 'trial' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                  <span>30G Deneme</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-700">
                                  Kapalı
                                </span>
                              )}
                            </button>
                          </td>
                        );
                      })}

                      {/* Ek MRR */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap font-mono font-medium">
                        {extraMrr > 0 ? (
                          <span className="text-emerald-700 font-bold text-sm">+₺{extraMrr.toLocaleString('tr-TR')}/ay</span>
                        ) : (
                          <span className="text-slate-400 text-xs">₺0</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Tablo Altı Hızlı İpucu Notu */}
        <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-4 sm:px-6">
          <div className="flex items-center gap-1.5">
            <Info size={13} className="text-slate-400 shrink-0" />
            <span>
              Durumları değiştirmek için ilgili butonun üzerine tıklayın: <strong>Kapalı ➔ 30 Gün Deneme ➔ Aktif Lisans ➔ Kapalı</strong>
            </span>
          </div>
          <span className="font-mono text-slate-400 hidden sm:inline">
            Daire başı ücretler bina kapasitesiyle otomatik çarpılır
          </span>
        </div>
      </div>

      {/* 4. SADE MODÜL KATALOĞU & FİYAT BİLGİ KARTLARI (REFERANS ALANI) */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-slate-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Modül Kataloğu &amp; Standart Tarifeler ({PLATFORM_MODULE_CATALOG.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            IoT &amp; Yazılım Entegrasyonları
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {PLATFORM_MODULE_CATALOG.map((mod) => {
            const activeCount = matrixData.filter((m) => m.subMap.get(mod.code)?.status === 'active').length;
            const trialCount = matrixData.filter((m) => m.subMap.get(mod.code)?.status === 'trial').length;
            const cfg = MODULE_CONFIG[mod.code];

            return (
              <div
                key={mod.code}
                className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center">
                      {renderModuleIcon(mod.iconName, 14)}
                    </div>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-200/60 text-slate-700">
                      {cfg.category}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-xs mb-1">
                    {mod.name.split('&')[0].trim()}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {mod.shortDescription}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Tarife:</span>
                    <strong className="font-mono text-slate-900 font-semibold">
                      {mod.pricingModel === 'per_unit' ? `₺${mod.defaultPrice}/daire` : `₺${mod.defaultPrice}/ay`}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[10px]">
                    <span>Kullanım:</span>
                    <span className="font-mono">
                      <strong className="text-emerald-700">{activeCount}</strong> Aktif · <strong className="text-purple-700">{trialCount}</strong> Deneme
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
