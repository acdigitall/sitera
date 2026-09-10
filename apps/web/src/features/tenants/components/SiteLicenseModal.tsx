import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { tenantsApi } from '../services/tenants.api';

export interface SiteLicenseModalProps {
  group: any | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SiteLicenseModal: React.FC<SiteLicenseModalProps> = ({
  group,
  onClose,
  onSuccess,
}) => {
  const [quickUnitFee, setQuickUnitFee] = useState<number>(20);
  const [quickMonthlyFee, setQuickMonthlyFee] = useState<number>(480);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickSuccess, setQuickSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (group) {
      setQuickUnitFee(group.unitFee || 20);
      setQuickMonthlyFee(group.monthlyFee || (group.totalUnits || 24) * 20);
      setQuickSuccess(null);
    }
  }, [group]);

  if (!group) return null;

  const handleQuickSave = async () => {
    setQuickSaving(true);
    try {
      await tenantsApi.update(group.id, {
        unitFee: quickUnitFee,
        monthlyFee: quickMonthlyFee,
      });
      setQuickSuccess('Fiyat tarifesi güncellendi!');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      alert('Ücret güncellenemedi: ' + err.message);
    } finally {
      setQuickSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-5 animate-fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Daire Başı Lisans Ücreti Düzenle
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {group.name} · {group.totalUnits} Bağımsız Bölüm
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
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
                    setQuickMonthlyFee(Math.round((group.totalUnits || 24) * u));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-7 py-2 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-slate-400"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                  ₺
                </span>
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
                    const units = group.totalUnits || 24;
                    setQuickUnitFee(units > 0 ? parseFloat((m / units).toFixed(2)) : 20);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-7 py-2 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-slate-400"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                  ₺
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100 flex items-center justify-between font-mono">
            <span>Tarife Özeti:</span>
            <span>
              {group.totalUnits || 24} daire × ₺{quickUnitFee} ={' '}
              <strong className="text-slate-900">₺{quickMonthlyFee}/ay</strong>
            </span>
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
            onClick={onClose}
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
  );
};
