import React, { useState, useMemo } from 'react';
import {
  Car,
  QrCode,
  PhoneCall,
  CalendarCheck,
  ShieldAlert,
  Layers,
  CheckCircle2,
  Check,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Zap,
  ChevronRight,
  FileText,
} from 'lucide-react';
import {
  Group,
  PlatformModuleCode,
  PlatformModuleDefinition,
  GroupModuleSubscription,
  PLATFORM_MODULE_CATALOG,
} from '@sitera/shared';
import { useNavigate, useParams } from 'react-router-dom';
import { modulesApi } from '../../tenants/services/modules.api';
import { ModuleDetailPage } from './ModuleDetailPage';

interface TenantMarketplacePageProps {
  activeGroup?: Group | null;
  onRefresh?: () => void;
  tenantSlug?: string;
}

export const TenantMarketplacePage: React.FC<TenantMarketplacePageProps> = ({
  activeGroup,
  onRefresh,
  tenantSlug,
}) => {
  const navigate = useNavigate();
  const routeParams = useParams<{ moduleCode?: string; tenantSlug?: string }>();
  const effectiveTenantSlug =
    routeParams.tenantSlug || tenantSlug || activeGroup?.slug || 'gencosman-apartmani';

  const [activatingCode, setActivatingCode] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const units = activeGroup?.totalUnits || 24;

  const currentModulesMap = useMemo(() => {
    const map = new Map<string, GroupModuleSubscription>();
    if (activeGroup && Array.isArray(activeGroup.modules)) {
      activeGroup.modules.forEach((m) => map.set(m.moduleCode, m));
    }
    return map;
  }, [activeGroup]);

  const activeCount = Array.from(currentModulesMap.values()).filter((s) => s.status === 'active').length;
  const trialCount = Array.from(currentModulesMap.values()).filter((s) => s.status === 'trial').length;

  const handleStartTrial = async (moduleCode: PlatformModuleCode) => {
    if (!activeGroup?.id) return;
    setActivatingCode(moduleCode);
    try {
      await modulesApi.subscribeModule(activeGroup.id, {
        moduleCode,
        isTrial: true,
      });
      onRefresh?.();
      setFeedback({
        message: '30 Günlük Ücretsiz Deneme Başlatıldı! Modül siteniz için aktif hale getirildi.',
        type: 'success',
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({
        message: err.message || 'İşlem sırasında bir hata oluştu.',
        type: 'error',
      });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setActivatingCode(null);
    }
  };

  const renderIcon = (iconName: string, size = 18) => {
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

  const activeDetailCode = routeParams.moduleCode;

  if (activeDetailCode) {
    return (
      <ModuleDetailPage
        activeGroup={activeGroup}
        onRefresh={onRefresh}
        tenantSlug={effectiveTenantSlug}
        moduleCodeProp={activeDetailCode}
        onBack={() => navigate(`/${effectiveTenantSlug}/admin/marketplace`)}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-full font-sans pb-16">
      {/* 1. FLUSH PAGE HEADER (Ana Sayfa Kasa & Operasyon Birebir Formatı) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Eklenti &amp; Donanım Modülleri
            </h1>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
              Sitera PropTech
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {activeGroup?.name || 'Gencosman Apartmanı'} · {units} Bağımsız Bölüm · Bina Donanım ve Akıllı Servisler
          </p>
        </div>

        {/* Aksiyon Butonu */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate(`/${effectiveTenantSlug}/admin/overview`)}
            className="h-10 inline-flex items-center gap-2 px-4 text-sm font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-lg shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Building2 size={15} className="text-slate-500" />
            <span>Kasa &amp; Operasyona Dön</span>
          </button>
        </div>
      </div>

      {/* 2. BİLGİLENDİRME & GÜVENCE BANDI (Ana Sayfa Bütçe Gerçekleşmesi Kutusu Formatı) */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-base font-bold text-slate-900">
              Akıllı Bina Donanım &amp; Modül Ekosistemi
            </div>
            <div className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Sitenizin kapı, bariyer ve ortak alanlarını mevcut altyapınızı değiştirmeden tek tıkla akıllandırın.
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg">
              30 Gün Kartsız Deneme
            </span>
          </div>
        </div>

        {/* 4 Temel Metrik Sütunu (Ana Sayfa ile Birebir) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-3.5 border-t border-slate-100 text-sm">
          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
              Kurulum Süresi
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
              1 İş Günü
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Mevcut altyapıyla uyumlu</div>
          </div>

          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
              Test Süreci
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
              30 Gün Ücretsiz
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Kredi kartı gerekmez</div>
          </div>

          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
              Aidat Dağılımı
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
              {units} Daireye Pay
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Ay sonu bütçesine yansıtılır</div>
          </div>

          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
              Sitede Aktif Modül
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
              {activeCount} Aktif · {trialCount} Deneme
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Tek tıkla devreye alma</div>
          </div>
        </div>
      </div>

      {/* Bildirim Alanı */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold shadow-xs ${feedback.type === 'success'
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
        >
          <CheckCircle2 size={16} className={feedback.type === 'success' ? 'text-emerald-400 shrink-0' : 'text-rose-600 shrink-0'} />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 3. MODÜL LİSTESİ BAŞLIĞI */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-sm font-bold text-slate-900 tracking-wider uppercase">
            Kullanılabilir Bina Modülleri
          </div>
          <div className="text-sm text-slate-500 font-medium">
            Toplam: <span className="font-bold text-slate-900 text-base tabular-nums ml-1">5 Modül</span>
          </div>
        </div>

        {/* MODÜL KARTLARI (Ana Sayfa Kasa & Banka Kart Yapısı ile Birebir) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORM_MODULE_CATALOG.map((mod) => {
            const sub = currentModulesMap.get(mod.code);
            const isActive = sub?.status === 'active';
            const isTrial = sub?.status === 'trial';
            const monthlyPrice =
              mod.pricingModel === 'per_unit' ? units * mod.defaultPrice : mod.defaultPrice;

            // Her modül için ayırt edici kurumsal renk ikonu
            const getIconStyle = (code: string) => {
              switch (code) {
                case 'ANPR_PLATE_RECOGNITION':
                  return 'bg-blue-50 border-blue-200 text-blue-700';
                case 'GUEST_QR_PASS':
                  return 'bg-indigo-50 border-indigo-200 text-indigo-700';
                case 'SMART_INTERCOM':
                  return 'bg-sky-50 border-sky-200 text-sky-700';
                case 'FACILITY_RESERVATION':
                  return 'bg-emerald-50 border-emerald-200 text-emerald-700';
                case 'VALET_PARKING':
                  return 'bg-amber-50 border-amber-200 text-amber-700';
                default:
                  return 'bg-slate-100 border-slate-200 text-slate-700';
              }
            };

            return (
              <div
                key={mod.code}
                className={`bg-white border rounded-xl p-5 flex flex-col justify-between transition-all shadow-xs hover:shadow-md hover:border-slate-300 ${isActive
                    ? 'border-slate-300 border-t-2 border-t-emerald-600'
                    : isTrial
                      ? 'border-slate-300 border-t-2 border-t-purple-600'
                      : 'border-slate-200'
                  }`}
              >
                <div>
                  {/* Başlık & İkon (Kasa & Banka kartının aynısı) */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900 truncate">
                          {mod.name}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate font-medium">
                        {mod.code === 'ANPR_PLATE_RECOGNITION' && 'Kamera & Otomatik Geçiş'}
                        {mod.code === 'GUEST_QR_PASS' && 'Turnike & Yaya Kapı Otomatiği'}
                        {mod.code === 'SMART_INTERCOM' && 'Mobil Diyafon & Zil Kontrolü'}
                        {mod.code === 'FACILITY_RESERVATION' && 'Ortak Alan & Randevu Yönetimi'}
                        {mod.code === 'VALET_PARKING' && 'Kapasite & Sensör Takibi'}
                      </div>
                    </div>

                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${getIconStyle(mod.code)}`}>
                      {renderIcon(mod.iconName, 18)}
                    </div>
                  </div>

                  {/* Fiyat Bilgisi (Ana Sayfa 38.450 ₺ formatında) */}
                  <div className="mt-4">
                    <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums font-mono">
                      {monthlyPrice.toLocaleString('tr-TR')} ₺
                      <span className="text-xs font-normal text-slate-400 font-sans"> /ay</span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-1 truncate">
                      {mod.pricingModel === 'per_unit'
                        ? `${units} Daire × ₺${mod.defaultPrice} /ay`
                        : 'Sabit Bina Lisansı'}
                    </div>
                  </div>

                  {/* Modül Açıklaması */}
                  <p className="mt-3 text-xs text-slate-600 leading-relaxed line-clamp-3 font-normal">
                    {mod.shortDescription}
                  </p>
                </div>

                {/* Alt Aksiyon Çubuğu (Ana Sayfa Kasa Kartı footerı ile aynı) */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    {isActive ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md border bg-emerald-50 border-emerald-200 text-emerald-800">
                        Aktif
                      </span>
                    ) : isTrial ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md border bg-purple-50 border-purple-200 text-purple-800">
                        30G Deneme
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md border bg-slate-50 border-slate-200 text-slate-600">
                        30 Gün Deneme
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => navigate(`/${effectiveTenantSlug}/admin/marketplace/${mod.code}`)}
                      className="h-8 px-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      İncele
                    </button>

                    {!isActive && !isTrial && (
                      <button
                        type="button"
                        disabled={activatingCode === mod.code}
                        onClick={() => handleStartTrial(mod.code as PlatformModuleCode)}
                        className="h-8 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Zap size={12} className="text-amber-400" />
                        <span>{activatingCode === mod.code ? '...' : 'Dene'}</span>
                      </button>
                    )}
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
