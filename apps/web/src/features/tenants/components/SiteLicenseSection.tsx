import React from 'react';
import {
  Gift,
  Check,
  AlertCircle,
  Calendar,
  ShieldCheck,
  Download,
  Lock,
  Unlock,
} from 'lucide-react';
import { Group } from '@sitera/shared';

export interface SiteLicenseSectionProps {
  group: Group;
  totalUnits: number;
  monthlyFee: number;
  isTrial: boolean;
  remainingDays: number;
  targetExpiry: Date;
  editingUnitFee: number;
  editingMonthlyFee: number;
  isSavingPricing: boolean;
  pricingSuccess: boolean;
  actionLoading: boolean;
  actionFeedback: { type: 'success' | 'error'; text: string } | null;
  onUnitFeeChange: (val: number) => void;
  onMonthlyFeeChange: (val: number) => void;
  onSavePricing: () => void;
  onApplyTrial: (months: number) => void;
  onExtendLicense: (months?: number) => void;
  onExportData: () => void;
  onToggleFreeze: () => void;
}

export const SiteLicenseSection: React.FC<SiteLicenseSectionProps> = ({
  group,
  totalUnits,
  monthlyFee,
  isTrial,
  remainingDays,
  targetExpiry,
  editingUnitFee,
  editingMonthlyFee,
  isSavingPricing,
  pricingSuccess,
  actionLoading,
  actionFeedback,
  onUnitFeeChange,
  onMonthlyFeeChange,
  onSavePricing,
  onApplyTrial,
  onExtendLicense,
  onExportData,
  onToggleFreeze,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Gift size={16} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              SaaS Lisans, Fatura & Sistemden Çıkış (Offboarding)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Bu apartmanın Sitera abonelik durumu, lansman promosyonu, tahsilat ve yasal çıkış süreçleri
            </p>
          </div>
        </div>

        {actionFeedback && (
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {actionFeedback.type === 'success' ? <Check size={13} /> : <AlertCircle size={13} />}
            <span>{actionFeedback.text}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon: Lisans & Mali Özet ve Daire Başı Ücret Düzenleme */}
        <div className="space-y-3 bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Mevcut Lisans Durumu
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">Aylık SaaS Aidatı:</span>
            <div className="text-right">
              <span className="text-sm font-mono font-bold text-slate-900">
                {isTrial ? (
                  <span className="text-blue-700 font-bold">Lansman Promosyonu (0 ₺)</span>
                ) : (
                  `₺${monthlyFee} / ay`
                )}
              </span>
              <div className="text-[11px] text-slate-400 font-mono">
                ₺{editingUnitFee} / daire ({totalUnits} daire)
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">Lisans Modeli:</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800 uppercase font-mono">
              {group.plan || 'PRO'} PLAN
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">Kalan Lisans Süresi:</span>
            <div className="text-right">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                  group.isFrozen
                    ? 'bg-rose-100 text-rose-800'
                    : remainingDays <= 30
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {group.isFrozen ? 'Donduruldu' : `${remainingDays} Gün Kaldı`}
              </span>
              {!group.isFrozen && (
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {targetExpiry.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">Tahsilat Durumu:</span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded font-mono ${
                group.paymentStatus === 'paid' && !isTrial
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : isTrial || group.paymentStatus === 'free_trial'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {group.paymentStatus === 'paid' && !isTrial
                ? 'Düzenli Ödendi'
                : isTrial || group.paymentStatus === 'free_trial'
                ? 'Ücretsiz Deneme (Lansman)'
                : 'Ödeme Bekliyor'}
            </span>
          </div>

          {/* Daire Başı Ücret & Fiyatlandırma Düzenleme Paneli */}
          <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800">Daire Başı Fiyatlandırma</span>
                <p className="text-[11px] text-slate-400">Süper admin lisans tarifesi</p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                {totalUnits} Daire
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block">Daire Başı (₺)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editingUnitFee}
                    onChange={(e) => onUnitFeeChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-2.5 pr-6 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-slate-400"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">₺</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 mb-1 block">Aylık Toplam (₺)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editingMonthlyFee}
                    onChange={(e) => onMonthlyFeeChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-2.5 pr-6 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-slate-400"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">₺</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 font-mono">
                {totalUnits} × ₺{editingUnitFee} = ₺{editingMonthlyFee}
              </span>
              <button
                type="button"
                disabled={isSavingPricing || actionLoading}
                onClick={onSavePricing}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  pricingSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                } disabled:opacity-50`}
              >
                {pricingSuccess ? (
                  <>
                    <Check size={12} />
                    <span>Kaydedildi</span>
                  </>
                ) : (
                  <span>Fiyatı Kaydet</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Orta Kolon: Lansman & Lisans Süresi Uzatma */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Gift size={14} className="text-purple-700" />
            <span>Lansman & Lisans Aksiyonları</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => onApplyTrial(3)}
              className="p-3 text-left rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 transition-colors cursor-pointer disabled:opacity-50"
            >
              <div className="text-xs font-bold text-purple-900">+3 Ay Lansman</div>
              <div className="text-[11px] text-purple-700 mt-0.5">90 gün ücretsiz hediye et</div>
            </button>

            <button
              type="button"
              disabled={actionLoading}
              onClick={() => onApplyTrial(5)}
              className="p-3 text-left rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 transition-colors cursor-pointer disabled:opacity-50"
            >
              <div className="text-xs font-bold text-amber-900">+5 Ay Lansman</div>
              <div className="text-[11px] text-amber-700 mt-0.5">150 gün ücretsiz hediye et</div>
            </button>
          </div>

          <button
            type="button"
            disabled={actionLoading}
            onClick={() => onExtendLicense(12)}
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Calendar size={14} className="text-teal-700" />
            <span>Lisansı +1 Yıl Uzat ve Ödendi İşaretle</span>
          </button>
        </div>

        {/* Sağ Kolon: Sistemden Çıkış (Offboarding) & Veri İhracı */}
        <div className="space-y-3 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-indigo-700" />
            <span>Sistemden Çıkış (Offboarding)</span>
          </div>

          <button
            type="button"
            disabled={actionLoading}
            onClick={onExportData}
            className="w-full p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-xs font-bold text-indigo-900 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            title="Kat Mülkiyeti Kanunu ve KVKK gereği tüm verileri dışa aktar"
          >
            <Download size={14} />
            <span>Yasal Veri Dökümünü İndir (Data Export)</span>
          </button>

          <button
            type="button"
            disabled={actionLoading}
            onClick={onToggleFreeze}
            className={`w-full p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 ${
              group.isFrozen
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                : 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            {group.isFrozen ? (
              <>
                <Unlock size={14} />
                <span>Dondurmayı Kaldır (Tekrar Aktif Et)</span>
              </>
            ) : (
              <>
                <Lock size={14} />
                <span>Siteyi Dondur (Askıya Al)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Yasal Çıkış Bilgilendirme Notu */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
        <AlertCircle size={14} className="text-slate-400 shrink-0 mt-0.5" />
        <span>
          <strong>Kat Mülkiyeti Kanunu ve KVKK Uyarınca:</strong> Bu apartman sistemden ayrılmak istediğinde, yöneticisine tek tıkla yukarıdaki <em>"Yasal Veri Dökümünü İndir"</em> butonuyla tüm kasa dökümü, bakiye ve sakin kayıtları teslim edilmelidir. Ardından <em>"Siteyi Dondur"</em> işlemiyle sistem askıya alınır; mevzuat gereği mali kayıtlar kanuni zamanaşımı süresi boyunca şifreli arşivde kilitli tutulur.
        </span>
      </div>
    </div>
  );
};
