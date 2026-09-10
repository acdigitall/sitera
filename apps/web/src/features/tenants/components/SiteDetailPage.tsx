import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';
import { Group, User as UserType, PlatformModuleCode } from '@sitera/shared';
import { tenantsApi } from '../services/tenants.api';
import { modulesApi } from '../services/modules.api';
import { getSiteCommunicationQuota } from '../services/communication-mock';
import { SiteDetailHeader } from './SiteDetailHeader';
import { SiteDetailMetrics } from './SiteDetailMetrics';
import { SiteLicenseSection } from './SiteLicenseSection';
import { SiteCommunicationSection } from './SiteCommunicationSection';
import { SiteModulesSection } from './SiteModulesSection';
import { SiteStaffSection } from './SiteStaffSection';
import { SiteResidentsTable } from './SiteResidentsTable';

interface SiteDetailPageProps {
  groups: Group[];
  tenantSlug?: string;
  onRefresh?: () => void;
}

export const SiteDetailPage: React.FC<SiteDetailPageProps> = ({
  groups,
  tenantSlug = 'gencosman-apartmani',
  onRefresh,
}) => {
  const { siteSlug } = useParams<{ siteSlug: string }>();
  const navigate = useNavigate();
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const initialGroup = groups.find(
    (g) => g.slug === siteSlug || g.id === siteSlug
  );

  const [currentGroup, setCurrentGroup] = useState<Group | null>(initialGroup || null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingModule, setSavingModule] = useState(false);

  useEffect(() => {
    if (initialGroup) setCurrentGroup(initialGroup);
  }, [initialGroup]);

  const group = currentGroup || initialGroup;

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const usersList: UserType[] = ((group as any)?.users) || [];
  const managers = usersList.filter(
    (u) => u.role === 'admin' || u.role === 'accountant' || u.role === 'auditor'
  );
  const technicians = usersList.filter(
    (u) => u.role === 'staff' || u.role === 'security'
  );
  const residents = usersList.filter((u) => u.role === 'member');
  const totalUnits =
    group?.totalUnits ||
    (residents.length > 0
      ? Array.from(new Set(residents.flatMap((r) => r.units || []))).length || residents.length
      : 24);

  const currentUnitFee = group?.unitFee ?? (group?.monthlyFee && totalUnits ? Math.round(Number(group.monthlyFee) / totalUnits) : 20);
  const [editingUnitFee, setEditingUnitFee] = useState<number>(currentUnitFee);
  const [editingMonthlyFee, setEditingMonthlyFee] = useState<number>(Number(group?.monthlyFee) || totalUnits * currentUnitFee);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [pricingSuccess, setPricingSuccess] = useState(false);

  useEffect(() => {
    if (!group) return;
    const uFee = group.unitFee ?? (group.monthlyFee && totalUnits ? Math.round(Number(group.monthlyFee) / totalUnits) : 20);
    setEditingUnitFee(uFee);
    setEditingMonthlyFee(Number(group.monthlyFee) || totalUnits * uFee);
  }, [group, totalUnits]);

  if (!group) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <Building2 size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Site veya Apartman Bulunamadı</h2>
        <p className="text-xs text-slate-500 mt-1">
          Aradığınız site adresi sistemde kayıtlı değil veya silinmiş olabilir.
        </p>
        <button
          onClick={() => navigate(`/${tenantSlug}/admin/overview`)}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Platform Yönetim Merkezine Dön</span>
        </button>
      </div>
    );
  }

  const handleUnitFeeChange = (val: number) => {
    const cleanVal = Math.max(0, val);
    setEditingUnitFee(cleanVal);
    setEditingMonthlyFee(Math.round(totalUnits * cleanVal));
  };

  const handleMonthlyFeeChange = (val: number) => {
    const cleanVal = Math.max(0, val);
    setEditingMonthlyFee(cleanVal);
    setEditingUnitFee(totalUnits > 0 ? parseFloat((cleanVal / totalUnits).toFixed(2)) : 20);
  };

  const handleSavePricing = async () => {
    setActionLoading(true);
    setIsSavingPricing(true);
    setActionFeedback(null);
    try {
      const updated = await tenantsApi.update(group.id, {
        unitFee: Number(editingUnitFee),
        monthlyFee: Number(editingMonthlyFee),
      });
      setCurrentGroup(updated);
      onRefresh?.();
      setPricingSuccess(true);
      setTimeout(() => setPricingSuccess(false), 3000);
      setActionFeedback({
        type: 'success',
        text: `Daire başı lisans ücreti ₺${editingUnitFee}/daire (Aylık toplam ₺${editingMonthlyFee}) olarak güncellendi.`,
      });
    } catch (err: any) {
      setActionFeedback({ type: 'error', text: err.message || 'Fiyatlandırma güncellenemedi.' });
    } finally {
      setActionLoading(false);
      setIsSavingPricing(false);
    }
  };

  const monthlyFee = Number(group.monthlyFee) || totalUnits * (group.unitFee || 20);
  const isTrial = group.subscriptionStatus === 'trial';
  const commQuota = getSiteCommunicationQuota(group);

  const targetExpiry =
    !isTrial && group.licenseExpiresAt
      ? new Date(group.licenseExpiresAt)
      : isTrial && group.trialEndsAt
      ? new Date(group.trialEndsAt)
      : group.licenseExpiresAt
      ? new Date(group.licenseExpiresAt)
      : group.trialEndsAt
      ? new Date(group.trialEndsAt)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const diffMs = targetExpiry.getTime() - Date.now();
  const remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const handleApplyTrial = async (months: number) => {
    setActionLoading(true);
    setActionFeedback(null);
    try {
      const updated = await tenantsApi.applyTrial(group.id, months);
      setCurrentGroup(updated);
      onRefresh?.();
      setActionFeedback({
        type: 'success',
        text: `Tebrikler! Bu siteye ${months} ay ücretsiz lansman hediyesi başarıyla tanımlandı.`,
      });
    } catch (err: any) {
      setActionFeedback({ type: 'error', text: err.message || 'Lansman süresi tanımlanamadı.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendLicense = async (months: number = 12) => {
    setActionLoading(true);
    setActionFeedback(null);
    try {
      const updated = await tenantsApi.extendLicense(group.id, months);
      setCurrentGroup(updated);
      onRefresh?.();
      setActionFeedback({
        type: 'success',
        text: `Lisans süresi ${months} ay (${Math.round(months / 12)} yıl) uzatıldı ve ödeme kaydedildi.`,
      });
    } catch (err: any) {
      setActionFeedback({ type: 'error', text: err.message || 'Lisans uzatılamadı.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFreeze = async () => {
    setActionLoading(true);
    setActionFeedback(null);
    const willFreeze = !group.isFrozen;
    try {
      const updated = await tenantsApi.toggleFreeze(
        group.id,
        willFreeze,
        willFreeze ? 'Süper Admin tarafından askıya alındı' : undefined
      );
      setCurrentGroup(updated);
      onRefresh?.();
      setActionFeedback({
        type: 'success',
        text: willFreeze ? 'Site donduruldu (askıya alındı).' : 'Site dondurması kaldırıldı, tekrar aktif.',
      });
    } catch (err: any) {
      setActionFeedback({ type: 'error', text: err.message || 'İşlem gerçekleştirilemedi.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportData = async () => {
    setActionLoading(true);
    setActionFeedback(null);
    try {
      const exportData = await tenantsApi.exportData(group.id);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sitera-site-${group.slug}-yasal-arsiv.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setActionFeedback({
        type: 'success',
        text: 'KMK & KVKK uyumlu site verileri dışa aktarıldı ve indirildi.',
      });
    } catch (err: any) {
      setActionFeedback({ type: 'error', text: err.message || 'Veri dışa aktarılamadı.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleModuleInDetail = async (
    moduleCode: PlatformModuleCode,
    status: 'active' | 'trial' | 'inactive',
    durationDays = 30
  ) => {
    if (!group) return;
    setSavingModule(true);
    try {
      const updated = await modulesApi.toggleModule(group.id, {
        moduleCode,
        status,
        durationDays,
      });
      setCurrentGroup(updated);
      onRefresh?.();
      setActionFeedback({
        type: 'success',
        text: `Modül durumu güncellendi: ${status === 'active' ? 'Aktif Lisans' : status === 'trial' ? '30 Gün Deneme' : 'Kapatıldı'}`,
      });
    } catch (err: any) {
      setActionFeedback({ type: 'error', text: err.message || 'Modül güncellenemedi.' });
    } finally {
      setSavingModule(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in pb-16 font-sans">
      {/* 1. Başlık & Hızlı Navigasyon */}
      <SiteDetailHeader group={group} tenantSlug={tenantSlug} />

      {/* 2. Bento Sayaç Kartları */}
      <SiteDetailMetrics
        totalUnits={totalUnits}
        residents={residents}
        managers={managers}
        technicians={technicians}
      />

      {/* 3. Lisans, Fiyatlandırma ve Offboarding */}
      <SiteLicenseSection
        group={group}
        totalUnits={totalUnits}
        monthlyFee={monthlyFee}
        isTrial={isTrial}
        remainingDays={remainingDays}
        targetExpiry={targetExpiry}
        editingUnitFee={editingUnitFee}
        editingMonthlyFee={editingMonthlyFee}
        isSavingPricing={isSavingPricing}
        pricingSuccess={pricingSuccess}
        actionLoading={actionLoading}
        actionFeedback={actionFeedback}
        onUnitFeeChange={handleUnitFeeChange}
        onMonthlyFeeChange={handleMonthlyFeeChange}
        onSavePricing={handleSavePricing}
        onApplyTrial={handleApplyTrial}
        onExtendLicense={handleExtendLicense}
        onExportData={handleExportData}
        onToggleFreeze={handleToggleFreeze}
      />

      {/* 4. İletişim & Mesaj Paketleri (SMS/WhatsApp) */}
      <SiteCommunicationSection
        commQuota={commQuota}
        tenantSlug={tenantSlug}
      />

      {/* 5. Aktif Eklenti & IoT Paketleri */}
      <SiteModulesSection
        group={group}
        totalUnits={totalUnits}
        tenantSlug={tenantSlug}
        savingModule={savingModule}
        onToggleModule={handleToggleModuleInDetail}
      />

      {/* 6. Yetkili Kadro & Personel */}
      <SiteStaffSection
        managers={managers}
        technicians={technicians}
        tenantSlug={tenantSlug}
        copiedText={copiedText}
        onCopy={handleCopy}
      />

      {/* 7. Sakinler & Kat Malikleri Tablosu */}
      <SiteResidentsTable
        residents={residents}
        totalUnits={totalUnits}
      />
    </div>
  );
};
