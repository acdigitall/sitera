import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, X } from 'lucide-react';

export interface CreatePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  effectiveUnitsCount: number;
  onCreatePeriod: (params: {
    name: string;
    amount: number;
    totalAmount?: number;
    calculationMode: 'per_unit' | 'equal_split' | 'share' | 'unit_type';
    category: 'dues' | 'fixture';
    targetRole: 'owner' | 'resident';
    dueDate: string;
    generateDebtsForUnits: boolean;
  }) => Promise<any>;
}

export const CreatePeriodModal: React.FC<CreatePeriodModalProps> = ({
  isOpen,
  onClose,
  effectiveUnitsCount,
  onCreatePeriod,
}) => {
  const [calculationMode, setCalculationMode] = useState<'per_unit' | 'equal_split' | 'share' | 'unit_type'>('per_unit');
  const [periodCategory, setPeriodCategory] = useState<'dues' | 'fixture'>('dues');
  const [newPeriodName, setNewPeriodName] = useState('Ekim 2026');
  const [newPeriodAmount, setNewPeriodAmount] = useState('1250');
  const [totalExpenseAmount, setTotalExpenseAmount] = useState('20000');
  const [newPeriodDueDate, setNewPeriodDueDate] = useState('2026-10-15');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const calculatedSplitAmount =
    Math.round((parseFloat(totalExpenseAmount || '0') / (effectiveUnitsCount || 1)) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriodName) return;
    setIsSubmitting(true);
    try {
      const finalAmount =
        calculationMode === 'equal_split'
          ? calculatedSplitAmount
          : parseFloat(newPeriodAmount) || 1250;

      await onCreatePeriod({
        name: newPeriodName,
        amount: finalAmount,
        totalAmount:
          calculationMode === 'equal_split' || calculationMode === 'share'
            ? parseFloat(totalExpenseAmount)
            : undefined,
        calculationMode,
        category: periodCategory,
        targetRole: periodCategory === 'fixture' ? 'owner' : 'resident',
        dueDate: newPeriodDueDate,
        generateDebtsForUnits: true,
      });
      onClose();
      setNewPeriodName('');
    } catch (err: any) {
      alert('Tahakkuk oluşturulamadı: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up max-h-[90vh] overflow-y-auto my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Calendar size={18} className="text-indigo-600" />
            Özel Tahakkuk & Masraf Dağıtımı
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          {/* 1. Kategori Seçimi */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Masraf / Tahakkuk Türü (KMK m. 20)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPeriodCategory('dues')}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                  periodCategory === 'dues'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-indigo-900">🏢 Rutin Aidat</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Kiracı / İkamet Eden Öder (Kapıcı, temizlik, rutin)
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPeriodCategory('fixture')}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                  periodCategory === 'fixture'
                    ? 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-amber-900">🛠️ Demirbaş / Yatırım</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Ev Sahibi (Kat Maliki) Öder (Asansör, çatı, mantolama)
                </div>
              </button>
            </div>
          </div>

          {/* 2. Dönem Adı */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Dönem / Masraf Başlığı</label>
            <input
              type="text"
              required
              placeholder="Örn: Ekim 2026 Aidatı veya Asansör Revizyonu"
              value={newPeriodName}
              onChange={(e) => setNewPeriodName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 outline-none text-slate-900 font-medium"
            />
          </div>

          {/* 3. Hesaplama & Dağıtım Yöntemi */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5">Gider Dağıtım Şekli</label>
            <div className="p-1 bg-slate-100 rounded-lg flex gap-1 border border-slate-200/60 text-xs">
              <button
                type="button"
                onClick={() => setCalculationMode('per_unit')}
                className={`flex-1 py-1.5 px-2 rounded-md font-semibold transition-all cursor-pointer ${
                  calculationMode === 'per_unit'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sabit Aidat Tutarı
              </button>
              <button
                type="button"
                onClick={() => setCalculationMode('equal_split')}
                className={`flex-1 py-1.5 px-2 rounded-md font-semibold transition-all cursor-pointer ${
                  calculationMode === 'equal_split'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Masrafı Eşit Böl
              </button>
              <button
                type="button"
                onClick={() => setCalculationMode('share')}
                className={`flex-1 py-1.5 px-2 rounded-md font-semibold transition-all cursor-pointer ${
                  calculationMode === 'share'
                    ? 'bg-white text-amber-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Arsa Payı (m²)
              </button>
            </div>
          </div>

          {/* 4. Tutar Girişleri */}
          {calculationMode === 'per_unit' ? (
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Daire Başına Sabit Tutar (₺)
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={newPeriodAmount}
                onChange={(e) => setNewPeriodAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 outline-none text-slate-900 font-mono"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                💡 <strong>{effectiveUnitsCount} Daire</strong> × {newPeriodAmount} ₺ = Toplam{' '}
                {(effectiveUnitsCount * parseFloat(newPeriodAmount || '0')).toLocaleString('tr-TR')}{' '}
                ₺ tahakkuk yansıtılacak.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Dağıtılacak Toplam Fatura / Masraf Tutarı (₺)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={totalExpenseAmount}
                  onChange={(e) => setTotalExpenseAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 outline-none text-slate-900 font-mono font-bold text-sm"
                />
              </div>

              {calculationMode === 'equal_split' && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-indigo-900 font-bold">
                    <span>Daire Başına Düşen Pay:</span>
                    <span className="text-sm font-mono">{calculatedSplitAmount.toLocaleString('tr-TR')} ₺</span>
                  </div>
                  <p className="text-[10px] text-indigo-700">
                    Toplam {parseFloat(totalExpenseAmount || '0').toLocaleString('tr-TR')} ₺ gider,{' '}
                    {effectiveUnitsCount} daireye eşit olarak paylaştırılacaktır.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 5. Vade Tarihi */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Son Ödeme (Vade) Tarihi</label>
            <input
              type="date"
              required
              value={newPeriodDueDate}
              onChange={(e) => setNewPeriodDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 outline-none text-slate-900"
            />
            <p className="mt-1 text-[10px] text-slate-400">
              Bu tarihten sonra yapılan ödemelerde kanuni %5 aylık gecikme zammı işletilecektir.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Oluşturuluyor...' : 'Tahakkuku Oluştur & Borçları Yansıt'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
