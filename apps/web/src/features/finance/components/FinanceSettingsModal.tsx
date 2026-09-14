import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, X, AlertCircle } from 'lucide-react';

export interface FinanceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: any;
  onUpdateSettings: (settings: {
    defaultDuesAmount: number;
    duesDueDay: number;
    annualBudget: number;
    calculationMode: 'equal' | 'share' | 'unit_type';
    lateFeeEnabled: boolean;
    autoGenerateMonthlyDues: boolean;
  }) => Promise<any>;
}

export const FinanceSettingsModal: React.FC<FinanceSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [settingDuesAmount, setSettingDuesAmount] = useState('0');
  const [settingDueDay, setSettingDueDay] = useState('30');
  const [settingBudget, setSettingBudget] = useState('0');
  const [settingCalcMode, setSettingCalcMode] = useState<'equal' | 'share' | 'unit_type'>('equal');
  const [settingLateFee, setSettingLateFee] = useState(true);
  const [settingAutoGenerate, setSettingAutoGenerate] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
    }
    if (settings) {
      setSettingDuesAmount(
        settings.defaultDuesAmount !== undefined && settings.defaultDuesAmount !== null
          ? String(settings.defaultDuesAmount)
          : '0'
      );
      setSettingDueDay(settings.duesDueDay ? String(settings.duesDueDay) : '30');
      setSettingBudget(
        settings.annualBudget !== undefined && settings.annualBudget !== null
          ? String(settings.annualBudget)
          : '0'
      );
      if (settings.calculationMode) setSettingCalcMode(settings.calculationMode);
      if (settings.lateFeeEnabled !== undefined) setSettingLateFee(settings.lateFeeEnabled);
      if (settings.autoGenerateMonthlyDues !== undefined) setSettingAutoGenerate(settings.autoGenerateMonthlyDues);
    }
  }, [settings, isOpen]);

  // Escape key and body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setErrorMessage(null);
    try {
      await onUpdateSettings({
        defaultDuesAmount: parseFloat(settingDuesAmount) || 0,
        duesDueDay: parseInt(settingDueDay, 10) || 30,
        annualBudget: parseFloat(settingBudget) || 0,
        calculationMode: settingCalcMode,
        lateFeeEnabled: settingLateFee,
        autoGenerateMonthlyDues: settingAutoGenerate,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Ayarlar kaydedilemedi.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-up max-h-[90vh] overflow-y-auto my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Settings size={18} className="text-teal-700" />
            Otomatik Aidat &amp; Yıllık Bütçe Ayarları
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 shadow-2xs">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Varsayılan Aylık Aidat (₺)
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                placeholder="Örn: 1500"
                value={settingDuesAmount}
                onChange={(e) => setSettingDuesAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-slate-900 text-sm font-bold"
              />
              <span className="text-[10px] text-slate-400">Daire başı standart aylık aidat</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Vade Günü (Ayın Kaçı?)
              </label>
              <input
                type="number"
                required
                min="1"
                max="31"
                value={settingDueDay}
                onChange={(e) => setSettingDueDay(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-slate-900 text-sm font-bold"
              />
              <span className="text-[10px] text-slate-400">Örn: 30 (Ayın son günü)</span>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Yıllık Tahmini İşletme Bütçesi (₺)
            </label>
            <input
              type="number"
              required
              min="0"
              step="1000"
              placeholder="Örn: 180000"
              value={settingBudget}
              onChange={(e) => setSettingBudget(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-slate-900 text-sm font-bold"
            />
            <span className="text-[10px] text-slate-400">
              Genel Kurulca onaylanan tahmini yıllık işletme projesi tavanı
            </span>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1.5">
              Standart Aidat Dağıtım Şekli
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSettingCalcMode('equal')}
                className={`py-2 px-2.5 rounded-lg border text-center font-bold text-xs cursor-pointer ${
                  settingCalcMode === 'equal'
                    ? 'border-teal-600 bg-teal-50 text-teal-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Eşit Paylaşım
              </button>
              <button
                type="button"
                onClick={() => setSettingCalcMode('share')}
                className={`py-2 px-2.5 rounded-lg border text-center font-bold text-xs cursor-pointer ${
                  settingCalcMode === 'share'
                    ? 'border-teal-600 bg-teal-50 text-teal-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Arsa Payı (m²)
              </button>
              <button
                type="button"
                onClick={() => setSettingCalcMode('unit_type')}
                className={`py-2 px-2.5 rounded-lg border text-center font-bold text-xs cursor-pointer ${
                  settingCalcMode === 'unit_type'
                    ? 'border-teal-600 bg-teal-50 text-teal-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Daire Tipi (2+1..)
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={settingLateFee}
                onChange={(e) => setSettingLateFee(e.target.checked)}
                className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-600"
              />
              <div>
                <span className="font-bold text-slate-800 block">
                  Yasal Gecikme Zammı (%5 KMK m. 20)
                </span>
                <span className="text-[11px] text-slate-500">
                  Vadesi geçen borçlara günlük oransal yasal faiz hesaplanır ve portala yansıtılır.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={settingAutoGenerate}
                onChange={(e) => setSettingAutoGenerate(e.target.checked)}
                className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-600"
              />
              <div>
                <span className="font-bold text-slate-800 block">
                  Her Ayın 1&apos;inde Otomatik Tahakkuk Üret
                </span>
                <span className="text-[11px] text-slate-500">
                  Admin müdahalesine gerek kalmadan her ay başı rutin aidat borçları otomatik açılır.
                </span>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-lg cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
            >
              {isSavingSettings ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
