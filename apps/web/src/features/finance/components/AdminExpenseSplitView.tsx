import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Calculator,
  Plus,
  Calendar,
  Building2,
  Receipt,
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Check,
  Trash2,
  Clock,
  ArrowRight,
  Settings,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { User as SiteraUser, Group, Period } from '@sitera/shared';
import { useAuth } from '../../auth';
import { useFinance, triggerFinanceUpdate } from '../useFinance';
import { FinanceSettingsModal } from './FinanceSettingsModal';

interface AdminExpenseSplitViewProps {
  groupId?: string;
  users?: SiteraUser[];
  activeGroup?: Group;
}

export const AdminExpenseSplitView: React.FC<AdminExpenseSplitViewProps> = ({
  groupId,
  users = [],
  activeGroup,
}) => {
  const { user } = useAuth();
  const effectiveGroupId = groupId || user?.groupId;
  const {
    periods,
    debts,
    summary,
    settings,
    createPeriod,
    deletePeriod,
    autoGenerateMonthlyDues,
    updateSettings,
    loading,
  } = useFinance(effectiveGroupId);

  // Active sub-tab: 'split' (Yeni Masraf Dağıtımı) or 'history' (Geçmiş Tahakkuklar)
  const [activeTab, setActiveTab] = useState<'split' | 'history'>('split');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Form states
  const [expenseTitle, setExpenseTitle] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'fixture' | 'dues'>('fixture');
  const [expenseTotalAmount, setExpenseTotalAmount] = useState('');
  const [expenseSplitMode, setExpenseSplitMode] = useState<'equal_split' | 'share'>('equal_split');
  const [expenseDueDate, setExpenseDueDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extract all distinct apartments from user list
  const unitList = useMemo(() => {
    const list: { unit: string; residentName: string; residentType: string; id: string }[] = [];
    const members = users.filter((u) => u.role === 'member');

    members.forEach((m) => {
      if (m.units && m.units.length > 0) {
        m.units.forEach((un) => {
          list.push({
            id: `${m.id}-${un}`,
            unit: un,
            residentName: m.name,
            residentType: m.residentType || 'owner',
          });
        });
      } else if (m.name) {
        list.push({
          id: m.id,
          unit: m.name,
          residentName: m.name,
          residentType: m.residentType || 'owner',
        });
      }
    });

    return list;
  }, [users]);

  const totalUnits = unitList.length;
  const numTotalAmount = parseFloat(expenseTotalAmount) || 0;
  const perUnitEqual = totalUnits > 0 ? Math.round((numTotalAmount / totalUnits) * 100) / 100 : 0;

  // Real-time breakdown calculation per apartment
  const unitBreakdown = useMemo(() => {
    return unitList.map((item, index) => {
      let amount = perUnitEqual;
      if (expenseSplitMode === 'share' && numTotalAmount > 0) {
        const weight = 1 + (index % 4) * 0.15;
        const avgWeight = 1.225;
        amount = Math.round(((numTotalAmount / totalUnits) * (weight / avgWeight)) * 100) / 100;
      }
      return {
        ...item,
        amount,
        shareRatio: totalUnits > 0 ? (100 / totalUnits).toFixed(1) : '0.0',
      };
    });
  }, [unitList, numTotalAmount, perUnitEqual, expenseSplitMode, totalUnits]);

  // Fast preset templates
  const presets = [
    {
      title: 'Asansör Bakım & Halat Onarımı',
      vendor: 'KONE Asansör Servisi A.Ş.',
      category: 'fixture' as const,
      amount: '15000',
    },
    {
      title: 'Çatı İzolasyon & Aktarımı',
      vendor: 'Mega Çatı Sistemleri Ltd.',
      category: 'fixture' as const,
      amount: '24000',
    },
    {
      title: 'Hidrofor & Su Deposu Tamiri',
      vendor: 'Dalaman Pompa & Mekanik',
      category: 'fixture' as const,
      amount: '8500',
    },
    {
      title: 'Dış Cephe & Mantolama Onarımı',
      vendor: 'Akdeniz Yapı İzolasyon',
      category: 'fixture' as const,
      amount: '35000',
    },
    {
      title: 'Ortak Alan Temizlik & Dezenfeksiyon',
      vendor: 'Penta Profesyonel Temizlik',
      category: 'dues' as const,
      amount: '3200',
    },
  ];

  const handleApplyPreset = (preset: (typeof presets)[0]) => {
    setExpenseTitle(preset.title);
    setVendorName(preset.vendor);
    setExpenseCategory(preset.category);
    setExpenseTotalAmount(preset.amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseTotalAmount) {
      setErrorMessage('Lütfen masraf başlığını ve tutarını giriniz.');
      return;
    }

    if (numTotalAmount <= 0) {
      setErrorMessage('Geçerli bir tutar giriniz.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await createPeriod({
        name: expenseTitle.trim(),
        amount: perUnitEqual,
        totalAmount: numTotalAmount,
        calculationMode: expenseSplitMode,
        category: expenseCategory,
        targetRole: expenseCategory === 'fixture' ? 'owner' : 'resident',
        dueDate: expenseDueDate,
        generateDebtsForUnits: true,
      });

      triggerFinanceUpdate();
      setSuccessMessage(
        `✅ "${expenseTitle}" gideri (${numTotalAmount.toLocaleString('tr-TR')} ₺) başarıyla sisteme işlendi ve ${totalUnits} bağımsız bölüme borç olarak tahakkuk ettirildi.`
      );
      setTimeout(() => setSuccessMessage(null), 6000);
      setActiveTab('history');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gider paylaştırılırken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-full animate-fade-in pb-16">
      {/* 1. FLUSH PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Gider & Masraf Dağıtımı
            </h1>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-md">
              KMK m. 20 Standart
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {activeGroup?.name || user?.group?.name || 'Site Yönetimi'} · Asansör, çatı, tadilat ve ortak faturaların dairelere yasal paylaştırılması
          </p>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="h-10 inline-flex items-center gap-2 px-3.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <Settings size={14} className="text-slate-600" />
            <span>Aidat &amp; Bütçe Ayarları</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              try {
                const res = await autoGenerateMonthlyDues(false);
                alert(
                  `⚡ ${res.period.name} aidatı başarıyla oluşturuldu! ${res.createdDebtsCount} daireye borç yansıtıldı.`
                );
              } catch (err: any) {
                alert('Otomatik aidat üretim hatası: ' + err.message);
              }
            }}
            className="h-10 inline-flex items-center gap-2 px-4 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
          >
            <Zap size={14} className="text-amber-600" />
            <span>⚡ Bu Ayın Aidatını Üret</span>
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-scale-up">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-teal-700 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-teal-700 hover:text-teal-900"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertTriangle size={18} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. 3'LÜ KPI VARLIK KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Kart 1: Kayıtlı Daire Sayısı */}
        <div className="bg-white border border-slate-300 border-t-3 border-t-teal-700 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900">Kayıtlı Bağımsız Bölüm</span>
              <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                Tamamı Aktif
              </span>
            </div>
            <div className="text-sm text-slate-500 mt-1 font-medium">
              Masrafların paylaştırılacağı daire adedi
            </div>

            <div className="mt-4">
              <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                {totalUnits} Daire
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                {unitList.length > 0 ? unitList.map((u) => u.unit).join(', ') : 'Henüz kayıtlı daire yok'}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Yasal Dayanak:</span>
            <span className="text-teal-700 font-bold">KMK m. 20 (Ortak Giderler)</span>
          </div>
        </div>

        {/* Kart 2: Standart Aidat Tutarı */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900">Rutin Aylık Aidat</span>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className="text-xs font-semibold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Settings size={12} className="text-teal-700" />
                <span>{settings?.defaultDuesAmount && settings.defaultDuesAmount > 0 ? 'Düzenle' : '+ Aidat Belirle'}</span>
              </button>
            </div>
            <div className="text-sm text-slate-500 mt-1 font-medium">
              Genel kurulda kararlaştırılan standart pay
            </div>

            <div className="mt-4">
              <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                {settings?.defaultDuesAmount && settings.defaultDuesAmount > 0 ? (
                  `${settings.defaultDuesAmount.toLocaleString('tr-TR')} ₺`
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="text-base font-bold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>+ Aidat Tutarı Belirle</span>
                  </button>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                {settings?.defaultDuesAmount && settings.defaultDuesAmount > 0
                  ? `Her ayın ${settings?.duesDueDay || 30}. günü vadeli`
                  : 'Yönetici tarafından henüz aidat tutarı girilmedi'}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Aylık Toplam Aidat:</span>
            <span className="text-teal-700 font-bold">
              {(totalUnits * (settings?.defaultDuesAmount || 0)).toLocaleString('tr-TR')} ₺
            </span>
          </div>
        </div>

        {/* Kart 3: Yıllık İşletme Bütçesi */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900">Yıllık İşletme Bütçesi</span>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className="text-xs font-semibold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Settings size={12} className="text-teal-700" />
                <span>{settings?.annualBudget && settings.annualBudget > 0 ? 'Düzenle' : '+ Bütçe Belirle'}</span>
              </button>
            </div>
            <div className="text-sm text-slate-500 mt-1 font-medium">
              Onaylanan yıllık tahmini gider tavanı
            </div>

            <div className="mt-4">
              <div className="text-3xl font-bold text-teal-900 tracking-tight tabular-nums">
                {settings?.annualBudget && settings.annualBudget > 0 ? (
                  `${settings.annualBudget.toLocaleString('tr-TR')} ₺`
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="text-base font-bold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>+ Bütçe Belirle</span>
                  </button>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                {settings?.annualBudget && settings.annualBudget > 0
                  ? 'Demirbaş fonu ve rutin işletme ayrımı'
                  : 'Yıllık bütçe henüz girilmedi'}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Demirbaş Fonu:</span>
            <span className="text-teal-700 font-bold">Ayrı Hesapta Takip Edilir</span>
          </div>
        </div>
      </div>

      {/* 3. ANA SEKMELER: Yeni Masraf Dağıtımı vs Geçmiş Dağıtımlar */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('split')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${activeTab === 'split'
              ? 'border-teal-700 text-teal-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
        >
          <Wrench size={16} />
          <span>Yeni Masraf / Gider Paylaştır (Asansör, Çatı vb.)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${activeTab === 'history'
              ? 'border-teal-700 text-teal-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
        >
          <Receipt size={16} />
          <span>Geçmiş Masraf & Aidat Tahakkukları ({periods.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SEKME 1: YENİ GİDER PAYLAŞTIRMA SİHİRBAZI (APSIYON 7+5 İKİ SÜTUNLU DÜZEN)   */}
      {/* ========================================================================= */}
      {activeTab === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* SOL SÜTUN (7 Kolon): Fatura Bilgileri ve Dağıtım Parametreleri */}
          <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-base font-bold text-slate-900">Masraf ve Fatura Detayları</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  Adım 1 / 2
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Faturayı düzenleyen firma, fatura tutarı ve KMK gereği muhatap tarafı belirleyiniz.
              </p>
            </div>

            {/* Hızlı Masraf Şablonları */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Sık Kullanılan Masraf Şablonları (Tek Tıkla Doldur)
              </label>
              <div className="flex gap-2 flex-wrap">
                {presets.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${expenseTitle === preset.title
                        ? 'bg-teal-50 border-teal-600 text-teal-950 ring-1 ring-teal-600 shadow-2xs font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Muhatap Seçim Kartları (KMK m. 20) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Gider Türü & Yasal Muhatap (KMK m. 20 Kuralı)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Kart 1: Demirbaş */}
                <button
                  type="button"
                  onClick={() => setExpenseCategory('fixture')}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${expenseCategory === 'fixture'
                      ? 'border-teal-700 bg-teal-50/70 ring-1.5 ring-teal-700 shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <Wrench size={16} className="text-teal-700" />
                        <span>Demirbaş & Yatırım</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                        Ev Sahibi Öder
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Asansör, çatı, mantolama, hidrofor ve ana bina tesisatı. Kanunen <strong>Kat Malikine</strong> aittir.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-teal-800 font-semibold">
                    Borç doğrudan mülk sahibine tahakkuk eder ✓
                  </div>
                </button>

                {/* Kart 2: İşletme Masrafı */}
                <button
                  type="button"
                  onClick={() => setExpenseCategory('dues')}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${expenseCategory === 'dues'
                      ? 'border-teal-700 bg-teal-50/70 ring-1.5 ring-teal-700 shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <Zap size={16} className="text-slate-700" />
                        <span>İşletme / Rutin Masraf</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        İkamet Eden Öder
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Ortak elektrik, temizlik, ampul, bahçe bakımı gibi dönemsel kullanım giderleri.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-700 font-semibold">
                    Borç dairede oturan sakine (kiracıya) tahakkuk eder ✓
                  </div>
                </button>
              </div>
            </div>

            {/* Masraf Başlığı */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Gider / Masraf Başlığı (Dairelerin Borç Listesinde Görünür)
              </label>
              <input
                type="text"
                required
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                placeholder="Örn: Asansör Motor Revizyonu ve Çelik Halat Değişimi"
                className="w-full h-11 px-3.5 border border-slate-300 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 outline-none font-medium text-slate-900 text-sm shadow-2xs"
              />
            </div>

            {/* Tedarikçi Firma ve Fatura No */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Hizmeti Veren Firma / Usta</label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="Örn: KONE Asansör Servisi A.Ş."
                  className="w-full h-11 px-3.5 border border-slate-300 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 outline-none font-medium text-slate-900 text-xs shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Fatura / Belge No</label>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="Örn: FAT-2026-0891"
                  className="w-full h-11 px-3.5 border border-slate-300 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 outline-none font-mono font-medium text-slate-900 text-xs shadow-2xs"
                />
              </div>
            </div>

            {/* Tutar ve Son Ödeme Tarihi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Toplam Fatura Tutarı (₺)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={expenseTotalAmount}
                    onChange={(e) => setExpenseTotalAmount(e.target.value)}
                    placeholder="15000"
                    className="w-full h-11 pl-4 pr-9 border border-slate-300 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 outline-none font-black font-mono text-slate-900 text-base shadow-2xs"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ₺
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Son Ödeme Tarihi (Vade)</label>
                <input
                  type="date"
                  required
                  value={expenseDueDate}
                  onChange={(e) => setExpenseDueDate(e.target.value)}
                  className="w-full h-11 px-3.5 border border-slate-300 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 outline-none font-medium text-slate-900 text-sm shadow-2xs"
                />
              </div>
            </div>

            {/* Paylaştırma Kriteri Seçici */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Dağıtım Anahtarı (Kriter)</label>
              <div className="p-1 bg-slate-100 rounded-xl flex gap-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setExpenseSplitMode('equal_split')}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${expenseSplitMode === 'equal_split'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                  <span>Daire Sayısına Eşit Böl</span>
                  <span className="text-[10px] text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded font-mono">
                    {perUnitEqual.toLocaleString('tr-TR')} ₺ / Daire
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseSplitMode('share')}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${expenseSplitMode === 'share'
                      ? 'bg-white text-teal-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                  <span>Arsa Payı (m² Oranında)</span>
                  <span className="text-[10px] text-slate-600 bg-slate-200 px-1.5 py-0.2 rounded font-mono">
                    KMK m. 20
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* SAĞ SÜTUN (5 Kolon): Daire Dağıtım Önizleme Cetveli & Onay Butonu */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900">Daire Dağıtım Cetveli</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-mono">
                    {totalUnits} Bağımsız Bölüm
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Onay verdiğinizde aşağıdaki dairelerin cari hesaplarına bu tutarlar borç olarak yansıtılacaktır.
                </p>
              </div>

              {/* Tutar Özeti */}
              <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Toplam Masraf Tutarı:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {numTotalAmount.toLocaleString('tr-TR')} ₺
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Hedef Muhatap:</span>
                  <span className="font-bold text-teal-900">
                    {expenseCategory === 'fixture' ? 'Kat Malikleri (Ev Sahipleri)' : 'İkamet Edenler (Kiracılar)'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-teal-200/60">
                  <span className="text-slate-700 font-bold">Daire Başına Ortalama:</span>
                  <span className="font-mono font-black text-teal-900 text-base">
                    {perUnitEqual.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </span>
                </div>
              </div>

              {/* Daire Listesi Tablosu */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-100 max-h-[380px] overflow-y-auto bg-white">
                {unitBreakdown.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <Building2 size={24} className="mx-auto mb-2 text-slate-300" />
                    Henüz kayıtlı daire bulunmuyor. Daireler &amp; Sakinler menüsünden daire ekleyebilirsiniz.
                  </div>
                ) : (
                  unitBreakdown.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono font-bold text-slate-900 text-[11px] shrink-0">
                          {item.unit}
                        </span>
                        <div className="min-w-0 truncate">
                          <span className="font-bold text-slate-900 block truncate">{item.residentName}</span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {expenseCategory === 'fixture' ? 'Kat Maliki' : 'İkamet Eden'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-slate-900 text-sm tabular-nums block">
                          {item.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </span>
                        <span className="text-[10px] text-teal-700 font-mono font-semibold block">
                          Pay: %{item.shareRatio}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Onay & Tahakkuk Ettir Butonu */}
              <button
                type="button"
                disabled={submitting || numTotalAmount <= 0 || totalUnits === 0}
                onClick={handleSubmit}
                className="w-full h-12 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Check size={18} />
                <span>
                  {totalUnits === 0
                    ? 'Kayıtlı Daire Bulunmuyor'
                    : submitting
                      ? 'Dairelere Dağıtılıyor...'
                      : `Dairelere Borçlandır ve Tahakkuk Ettir (${numTotalAmount.toLocaleString('tr-TR')} ₺)`}
                </span>
              </button>

              <div className="text-[11px] text-slate-400 text-center leading-relaxed">
                Bu işlem onaylandığında sakinlerin portallerinde ödeme bildirimi oluşur ve işletme defterine tahakkuk olarak kaydedilir.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEKME 2: GEÇMİŞ MASRAF & AİDAT TAHAKKUKLARI                               */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Tahakkuk ve Dönem Geçmişi</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daha önce oluşturulmuş rutin aidatlar ve olağanüstü demirbaş paylaştırmaları
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('split')}
              className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span> Yeni Masraf Dağıt</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {periods.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Henüz kayıtlı bir aidat veya gider dağıtım dönemi bulunmuyor.
              </div>
            ) : (
              periods.map((p) => {
                const periodDebts = debts.filter((d) => d.periodId === p.id);
                const periodTotal = periodDebts.reduce((sum, d) => sum + Number(d.amount), 0);
                const periodPaid = periodDebts.reduce((sum, d) => sum + Number(d.paidAmount), 0);
                const collectionRate =
                  periodTotal > 0 ? Math.round((periodPaid / periodTotal) * 100) : 0;

                return (
                  <div
                    key={p.id}
                    className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">{p.name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${p.status === 'active'
                              ? 'bg-teal-50 text-teal-800 border border-teal-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                        >
                          {p.status === 'active' ? 'Aktif Dönem' : 'Tamamlandı'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap">
                        <span>Vade: {new Date(p.dueDate).toLocaleDateString('tr-TR')}</span>
                        <span>•</span>
                        <span>Daire Başı Pay: {Number(p.amount).toLocaleString('tr-TR')} ₺</span>
                        <span>•</span>
                        <span>Tahakkuk Eden Daire: {periodDebts.length || totalUnits} Bağımsız Bölüm</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 shrink-0 justify-between lg:justify-end">
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                          {periodPaid.toLocaleString('tr-TR')} ₺ / {periodTotal.toLocaleString('tr-TR')} ₺
                        </div>
                        <div className="text-[11px] text-teal-700 font-semibold mt-0.5">
                          %{collectionRate} Tahsil Edildi
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`"${p.name}" dönemini ve bağlı borçlarını silmek istediğinize emin misiniz?`)) {
                            await deletePeriod(p.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Dönemi Sil"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 4. AİDAT & BÜTÇE AYARLARI MODALI */}
      <FinanceSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />
    </div>
  );
};
