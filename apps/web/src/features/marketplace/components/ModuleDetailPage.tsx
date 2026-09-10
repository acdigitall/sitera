import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  ArrowLeft,
  Zap,
} from 'lucide-react';
import {
  Group,
  PlatformModuleCode,
  PLATFORM_MODULE_CATALOG,
} from '@sitera/shared';
import { useNavigate, useParams } from 'react-router-dom';
import { modulesApi } from '../../tenants/services/modules.api';
import { ModulePricingCard } from './ModulePricingCard';
import { ModulePreviewTab } from './ModulePreviewTab';
import { ModuleFlowTab } from './ModuleFlowTab';
import { ModuleHardwareTab } from './ModuleHardwareTab';

interface ModuleDetailPageProps {
  activeGroup?: Group | null;
  onRefresh?: () => void;
  tenantSlug?: string;
  moduleCodeProp?: string;
  onBack?: () => void;
}

export const ModuleDetailPage: React.FC<ModuleDetailPageProps> = ({
  activeGroup,
  onRefresh,
  tenantSlug,
  moduleCodeProp,
  onBack,
}) => {
  const navigate = useNavigate();
  const routeParams = useParams<{ moduleCode?: string; tenantSlug?: string }>();
  const effectiveTenantSlug = routeParams.tenantSlug || tenantSlug || 'gencosman-apartmani';

  const currentModuleCode = (moduleCodeProp || routeParams.moduleCode) as PlatformModuleCode;

  const moduleDef = useMemo(() => {
    return (
      PLATFORM_MODULE_CATALOG.find((m) => m.code === currentModuleCode) ||
      PLATFORM_MODULE_CATALOG[0]
    );
  }, [currentModuleCode]);

  const [activeTab, setActiveTab] = useState<'preview' | 'flow' | 'hardware'>('preview');
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const units = activeGroup?.totalUnits || 24;

  const currentSubscription = useMemo(() => {
    if (!activeGroup || !Array.isArray(activeGroup.modules)) return null;
    return activeGroup.modules.find((m) => m.moduleCode === moduleDef.code) || null;
  }, [activeGroup, moduleDef.code]);

  const isActive = currentSubscription?.status === 'active';
  const isTrial = currentSubscription?.status === 'trial';

  const monthlyPrice =
    moduleDef.pricingModel === 'per_unit'
      ? units * moduleDef.defaultPrice
      : moduleDef.defaultPrice;

  const handleSubscribe = async (isTrialAction: boolean) => {
    if (!activeGroup) return;
    setProcessing(true);
    try {
      await modulesApi.subscribeModule(activeGroup.id, {
        moduleCode: moduleDef.code,
        isTrial: isTrialAction,
      });
      onRefresh?.();
      setFeedback(
        isTrialAction
          ? '30 günlük ücretsiz deneme başlatıldı.'
          : 'Aboneliğiniz aktifleştirildi.'
      );
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error(err);
      setFeedback(err.message || 'İşlem gerçekleştirilemedi.');
    } finally {
      setProcessing(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(`/${effectiveTenantSlug}/admin/marketplace`);
    }
  };

  return (
    <div className="space-y-6 max-w-full font-sans pb-16">
      {/* 1. ÜST BAŞLIK & NAVİGASYON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <button
              type="button"
              onClick={handleBack}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Eklenti &amp; Modül Pazarı
            </button>
            <span>/</span>
            <span className="text-slate-800 font-semibold">{moduleDef.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {moduleDef.name}
            </h1>
            {isActive ? (
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                Sitede Aktif Lisanslı
              </span>
            ) : isTrial ? (
              <span className="text-xs font-semibold text-purple-800 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-md">
                30 Gün Deneme Devrede
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                30 Gün Ücretsiz Test İmkanı
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {activeGroup?.name || 'Gencosman Apartmanı'} · {units} Bağımsız Bölüm · {moduleDef.shortDescription}
          </p>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleBack}
            className="h-10 inline-flex items-center gap-2 px-4 text-sm font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-lg shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Modüllere Dön</span>
          </button>

          {!isActive && !isTrial && (
            <button
              type="button"
              disabled={processing}
              onClick={() => handleSubscribe(true)}
              className="h-10 inline-flex items-center gap-2 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Zap size={14} className="text-amber-400" />
              <span>{processing ? 'İşleniyor...' : '30 Gün Ücretsiz Başlat'}</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center gap-2.5 text-xs font-medium shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 2. TAB MENÜSÜ */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`pb-3 text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'preview'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          Canlı Yönetici Ekranı &amp; Loglar
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('flow')}
          className={`pb-3 text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'flow'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          Sakin Deneyimi &amp; Mobil Kullanım
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('hardware')}
          className={`pb-3 text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'hardware'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          Donanım &amp; Kurulum Şeması
        </button>
      </div>

      {/* 3. ANA İÇERİK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SOL VE ORTA ALAN (8 Kolon) */}
        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'preview' && <ModulePreviewTab moduleDef={moduleDef} />}
          {activeTab === 'flow' && <ModuleFlowTab moduleDef={moduleDef} />}
          {activeTab === 'hardware' && <ModuleHardwareTab moduleDef={moduleDef} />}
        </div>

        {/* SAĞ PANEL (4 Kolon): MALİ TARİFE & SİTEYE ÖZEL AKTİVASYON */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
          <ModulePricingCard
            moduleDef={moduleDef}
            activeGroup={activeGroup}
            units={units}
            monthlyPrice={monthlyPrice}
            isActive={isActive}
            isTrial={isTrial}
            processing={processing}
            onSubscribe={handleSubscribe}
          />
        </div>
      </div>
    </div>
  );
};
