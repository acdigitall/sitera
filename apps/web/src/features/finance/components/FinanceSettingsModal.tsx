import React, { useState, useEffect } from 'react';
import { Settings, X } from 'lucide-react';

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
  const [settingDuesAmount, setSettingDuesAmount] = useState('1250');
  const [settingDueDay, setSettingDueDay] = useState('30');
  const [settingBudget, setSettingBudget] = useState('180000');
  const [settingCalcMode, setSettingCalcMode] = useState<'equal' | 'share' | 'unit_type'>('equal');
  const [settingLateFee, setSettingLateFee] = useState(true);
  const [settingAutoGenerate, setSettingAutoGenerate] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (settings) {
      if (settings.defaultDuesAmount !== undefined) setSettingDuesAmount(String(settings.defaultDuesAmount));
      if (settings.duesDueDay !== undefined) setSettingDueDay(String(settings.duesDueDay));
      if (settings.annualBudget !== undefined) setSettingBudget(String(settings.annualBudget));
      if (settings.calculationMode) setSettingCalcMode(settings.calculationMode);
      if (settings.lateFeeEnabled !== undefined) setSettingLateFee(settings.lateFeeEnabled);
      if (settings.autoGenerateMonthlyDues !== undefined) setSettingAutoGenerate(settings.autoGenerateMonthlyDues);
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await onUpdateSettings({
        defaultDuesAmount: parseFloat(settingDuesAmount) || 1250,
        duesDueDay: parseInt(settingDueDay, 10) || 30,
        annualBudget: parseFloat(settingBudget) || 180000,
        calculationMode: settingCalcMode,
        lateFeeEnabled: settingLateFee,
        autoGenerateMonthlyDues: settingAutoGenerate,
      });
      onClose();
      alert('Aidat ve bütçe ayarları başarıyla kaydedildi!');
    } catch (err: any) {
      alert('Ayarlar kaydedilemedi: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Settings size={18} className="text-slate-700" />
            Otomatik Aidat & Yıllık Bütçe Ayarları
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Varsayılan Aylık Aidat (₺)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={settingDuesAmount}
                onChange={(e) => setSettingDuesAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:border-indigo-500 outline-none text-slate-900"
              />
              <span className="text-[10px] text-slate-400">Her ay başında bu tutar üretilir</span>
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
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:border-indigo-500 outline-none text-slate-900"
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
              value={settingBudget}
              onChange={(e) => setSettingBudget(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:border-indigo-500 outline-none text-slate-900 text-sm font-bold"
            />
            <span className="text-[10px] text-slate-400">
              Genel Kurulca kabul edilen tahmini yıllık işletme projesi hedefi
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
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
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
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
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
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Daire Tipi (2+1..)
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settingLateFee}
                onChange={(e) => setSettingLateFee(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300"
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

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={settingAutoGenerate}
                onChange={(e) => setSettingAutoGenerate(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300"
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
              Kapat
            </button>
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSavingSettings ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
