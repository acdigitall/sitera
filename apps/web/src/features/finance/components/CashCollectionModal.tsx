import React, { useState, useEffect } from 'react';
import { Banknote, Check, X } from 'lucide-react';
import { Debt } from '@sitera/shared';

export interface CashCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDebt: Debt | null;
  onRecordCash: (params: {
    debtId?: string;
    unit: string;
    amount: number;
    residentName?: string;
    notes?: string;
  }) => Promise<any>;
}

export const CashCollectionModal: React.FC<CashCollectionModalProps> = ({
  isOpen,
  onClose,
  selectedDebt,
  onRecordCash,
}) => {
  const [cashUnit, setCashUnit] = useState('');
  const [cashResident, setCashResident] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cashNotes, setCashNotes] = useState('');
  const [isRecordingCash, setIsRecordingCash] = useState(false);

  useEffect(() => {
    if (selectedDebt) {
      const totalWithLate = (selectedDebt as any).totalWithLateFee || Number(selectedDebt.amount);
      setCashUnit(selectedDebt.unit);
      setCashResident(selectedDebt.residentName || '');
      setCashAmount(String(totalWithLate || selectedDebt.amount));
      setCashNotes('Yönetici elden nakit tahsilat');
    } else {
      setCashUnit('');
      setCashResident('');
      setCashAmount('');
      setCashNotes('');
    }
  }, [selectedDebt, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashUnit || !cashAmount) {
      alert('Lütfen daire ve tutar giriniz.');
      return;
    }
    setIsRecordingCash(true);
    try {
      await onRecordCash({
        debtId: selectedDebt?.id,
        unit: cashUnit,
        amount: parseFloat(cashAmount),
        residentName: cashResident || undefined,
        notes: cashNotes || 'Yönetici elden nakit tahsilat',
      });
      onClose();
      alert(`${cashUnit} için ${cashAmount} ₺ nakit tahsilat başarıyla kaydedildi ve nakit kasasına eklendi!`);
    } catch (err: any) {
      alert('Nakit tahsilat hatası: ' + err.message);
    } finally {
      setIsRecordingCash(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Banknote size={18} className="text-emerald-600" />
            Elden Nakit Tahsilat Girişi
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          {selectedDebt ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-900 text-sm">{selectedDebt.title}</div>
              <div className="text-slate-600 flex justify-between">
                <span>
                  Daire: <strong>{selectedDebt.unit}</strong>
                </span>
                <span>
                  Sakin: <strong>{selectedDebt.residentName || 'Belirtilmemiş'}</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Daire No</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Daire 4"
                  value={cashUnit}
                  onChange={(e) => setCashUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:border-indigo-500 outline-none text-slate-900"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ödeyen Sakin</label>
                <input
                  type="text"
                  placeholder="Ad Soyad"
                  value={cashResident}
                  onChange={(e) => setCashResident(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none text-slate-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Tahsil Edilen Tutar (₺)</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:border-emerald-500 outline-none text-slate-900 text-base font-bold"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Makbuz / Tahsilat Notu</label>
            <input
              type="text"
              placeholder="Örn: Elden teslim alındı, makbuz no: 1042"
              value={cashNotes}
              onChange={(e) => setCashNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none text-slate-900"
            />
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] leading-relaxed">
            💵 <strong>Kasa Etkisi:</strong> Bu tahsilat onaylandığı anda ilgili borç kaydı{' '}
            <strong>Ödendi</strong> durumuna getirilecek ve sitenin <strong>&quot;Nakit Kasa&quot;</strong>{' '}
            hesabının bakiyesine doğrudan eklenecektir.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-lg cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isRecordingCash}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>{isRecordingCash ? 'Kaydediliyor...' : 'Tahsilatı Onayla ve Kasaya Ekle'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
