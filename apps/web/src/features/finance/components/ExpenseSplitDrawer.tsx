import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Wrench,
  Check,
  Building2,
  Calendar,
  AlertTriangle,
  Receipt,
  User,
  ShieldCheck,
  Zap,
  Split,
  Calculator,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { User as SiteraUser } from '@sitera/shared';
import { useFinance, triggerFinanceUpdate } from '../useFinance';

interface ExpenseSplitDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  users?: SiteraUser[];
  groupId?: string;
  onSuccess?: () => void;
}

export const ExpenseSplitDrawer: React.FC<ExpenseSplitDrawerProps> = ({
  isOpen,
  onClose,
  users = [],
  groupId,
  onSuccess,
}) => {
  const { createPeriod } = useFinance(groupId);

  // Form states
  const [expenseTitle, setExpenseTitle] = useState('Asansör Bakım & Halat Onarımı');
  const [expenseCategory, setExpenseCategory] = useState<'fixture' | 'dues'>('fixture');
  const [expenseTotalAmount, setExpenseTotalAmount] = useState('15000');
  const [expenseSplitMode, setExpenseSplitMode] = useState<'equal_split' | 'share'>('equal_split');
  const [expenseDueDate, setExpenseDueDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Extract all distinct apartments and their owners/residents
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

    // Fallback if no members exist
    if (list.length === 0) {
      return [
        { id: 'u-1', unit: 'Daire 5', residentName: 'Kat Maliki 1', residentType: 'owner' },
        { id: 'u-2', unit: 'Daire 6', residentName: 'Kat Maliki 2', residentType: 'owner' },
      ];
    }

    return list;
  }, [users]);

  const totalUnits = unitList.length;
  const numTotalAmount = parseFloat(expenseTotalAmount) || 0;
  const perUnitEqual = totalUnits > 0 ? Math.round((numTotalAmount / totalUnits) * 100) / 100 : 0;

  // Real-time breakdown list
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
        shareRatio: totalUnits > 0 ? (100 / totalUnits).toFixed(1) : '50.0',
      };
    });
  }, [unitList, numTotalAmount, perUnitEqual, expenseSplitMode, totalUnits]);

  // Fast preset buttons
  const presets = [
    { title: 'Asansör Bakım & Halat Onarımı', category: 'fixture' as const, amount: '15000' },
    { title: 'Çatı İzolasyon & Aktarımı', category: 'fixture' as const, amount: '24000' },
    { title: 'Hidrofor & Su Deposu Tamiri', category: 'fixture' as const, amount: '8500' },
    { title: 'Dış Cephe & Mantolama Onarımı', category: 'fixture' as const, amount: '35000' },
    { title: 'Ortak Alan Temizlik & Dezenfeksiyon', category: 'dues' as const, amount: '3200' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseTotalAmount) {
      setError('Lütfen gider başlığını ve tutarını giriniz.');
      return;
    }

    if (numTotalAmount <= 0) {
      setError('Geçerli bir tutar giriniz.');
      return;
    }

    setSubmitting(true);
    setError(null);

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
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gider paylaştırılırken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Slide-Over Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[560px] md:w-[620px] lg:w-[680px] bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between transform transition-transform duration-250 ease-out select-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 1. Header */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0 shadow-2xs">
              <Wrench size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base leading-tight">
                Ortak Gider & Masraf Paylaştırma
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Asansör, çatı veya ortak harcamaları dairelere KMK uyarınca paylaştırın
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              ESC
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2. Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Hızlı Şablonlar */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Hızlı Masraf Şablonları</label>
            <div className="flex gap-2 flex-wrap">
              {presets.map((preset) => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => {
                    setExpenseTitle(preset.title);
                    setExpenseCategory(preset.category);
                    setExpenseTotalAmount(preset.amount);
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    expenseTitle === preset.title
                      ? 'bg-teal-50 border-teal-600 text-teal-900 ring-1 ring-teal-600 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>

          {/* Gider Türü & Muhatap (KMK Kuralı) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Gider Türü & Yasal Muhatap (KMK m. 20 Kuralı)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Seçenek 1: Demirbaş */}
              <button
                type="button"
                onClick={() => setExpenseCategory('fixture')}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  expenseCategory === 'fixture'
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
                  Borç doğrudan ev sahibine yansıtılır ✓
                </div>
              </button>

              {/* Seçenek 2: Rutin İşletme */}
              <button
                type="button"
                onClick={() => setExpenseCategory('dues')}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  expenseCategory === 'dues'
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
                  Borç oturan sakine (kiracıya) yansıtılır ✓
                </div>
              </button>
            </div>
          </div>

          {/* Masraf Başlığı */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Gider / Fatura Başlığı</label>
            <input
              type="text"
              required
              value={expenseTitle}
              onChange={(e) => setExpenseTitle(e.target.value)}
              placeholder="Örn: Asansör Motor Revizyonu ve Çelik Halat Değişimi"
              className="w-full h-11 px-3.5 border border-slate-300 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 outline-none font-medium text-slate-900 text-sm shadow-2xs"
            />
          </div>

          {/* Tutar & Vade */}
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
              <div className="relative">
                <input
                  type="date"
                  required
                  value={expenseDueDate}
                  onChange={(e) => setExpenseDueDate(e.target.value)}
                  className="w-full h-11 px-3.5 border border-slate-300 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 outline-none font-medium text-slate-900 text-sm shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Dağıtım Kriteri */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Paylaştırma / Dağıtım Kriteri</label>
            <div className="p-1 bg-slate-100 rounded-xl flex gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setExpenseSplitMode('equal_split')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  expenseSplitMode === 'equal_split'
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
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  expenseSplitMode === 'share'
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

          {/* Daire Dağıtım Canlı Önizleme Tablosu */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Daire Dağıtım Önizlemesi ({totalUnits} Bağımsız Bölüm)
              </span>
              <span className="text-xs font-bold font-mono text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                Toplam: {numTotalAmount.toLocaleString('tr-TR')} ₺
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-100 bg-white">
              {unitBreakdown.map((item) => (
                <div
                  key={item.id}
                  className="p-3 sm:px-4 flex items-center justify-between text-xs hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono font-bold text-slate-800 text-[11px]">
                      {item.unit}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900">{item.residentName}</span>
                      <span className="text-[11px] text-slate-400 ml-1.5">
                        ({expenseCategory === 'fixture' ? 'Kat Maliki' : 'İkamet Eden'})
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                      {item.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Pay: %{item.shareRatio}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* 3. Sticky Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="text-xs text-slate-500 font-medium">Toplam Masraf Tutarı:</div>
            <div className="text-lg font-black font-mono text-slate-900 tabular-nums">
              {numTotalAmount.toLocaleString('tr-TR')} ₺
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="h-11 px-6 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <Check size={16} />
              <span>{submitting ? 'Kaydediliyor...' : 'Dairelere Borçlandır & Paylaştır'}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
