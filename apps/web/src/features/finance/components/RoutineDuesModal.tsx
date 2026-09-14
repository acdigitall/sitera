import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Zap,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Receipt,
  Users,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Period, FinanceSettings } from '@sitera/shared';

export interface RoutineDuesModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: FinanceSettings | null;
  totalUnits: number;
  periods?: Period[];
  onGenerate: (force: boolean) => Promise<{ period: Period; createdDebtsCount: number }>;
  onSuccessCreated?: (period: Period) => void;
  onNavigateToDebts?: () => void;
  onOpenSettings?: () => void;
}

export const RoutineDuesModal: React.FC<RoutineDuesModalProps> = ({
  isOpen,
  onClose,
  settings,
  totalUnits,
  periods = [],
  onGenerate,
  onSuccessCreated,
  onNavigateToDebts,
  onOpenSettings,
}) => {
  const [step, setStep] = useState<'preview' | 'success'>('preview');
  const [force, setForce] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{ period: Period; createdDebtsCount: number } | null>(null);

  // Period name and date calculation
  const now = new Date();
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ];
  const currentPeriodName = `${months[now.getMonth()]} ${now.getFullYear()}`;
  const duesAmount = Number(settings?.defaultDuesAmount) || 1250;
  const dueDay = settings?.duesDueDay || 30;
  const totalAccrual = duesAmount * (totalUnits || 1);

  // Check if period exists already
  const existingPeriod = periods.find(
    (p) => p.name.trim().toLowerCase() === currentPeriodName.trim().toLowerCase()
  );

  // Reset state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setStep('preview');
      setForce(false);
      setIsSubmitting(false);
      setErrorMessage(null);
      setResultData(null);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await onGenerate(force);
      setResultData(res);
      setStep('success');
      if (onSuccessCreated) {
        onSuccessCreated(res.period);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Aidat üretimi sırasında bir hata meydana geldi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 animate-scale-up overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* =================================================================== */}
        {/* 1. MODAL HEADER                                                     */}
        {/* =================================================================== */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50 via-white to-amber-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100/80 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-2xs shrink-0">
              <Zap size={20} className="fill-amber-500/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  {step === 'preview' ? 'Rutin Aidat Tahakkuk Sihirbazı' : 'Rutin Aidat Oluşturuldu'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  KMK m. 20
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {step === 'preview'
                  ? `${currentPeriodName} dönemi için toplu aidat tahakkuku`
                  : `${resultData?.period?.name || currentPeriodName} dönemi borçları yansıtıldı`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* =================================================================== */}
        {/* 2. MODAL BODY: PREVIEW / FORM STEP                                  */}
        {/* =================================================================== */}
        {step === 'preview' && (
          <div className="p-6 space-y-5 overflow-y-auto">
            {/* Hata Uyarısı (Varsa) */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 shadow-2xs animate-shake">
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">İşlem Gerçekleştirilemedi</div>
                  <div className="mt-0.5 text-rose-700">{errorMessage}</div>
                </div>
              </div>
            )}

            {/* Bilgilendirme Hero Kutusu */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/70 via-slate-50 to-teal-50/40 border border-amber-200/70">
              <div className="flex items-center justify-between pb-3 border-b border-amber-200/50 text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5 text-amber-900 font-bold">
                  <Sparkles size={14} className="text-amber-600" />
                  Otomatik Tahakkuk Özeti
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  Sistem Ayarlarına Göre
                </span>
              </div>

              {/* 4'lü Temel Metrikler */}
              <div className="grid grid-cols-2 gap-3 mt-3.5">
                <div className="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Aidat Dönemi
                  </span>
                  <div className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                    <Calendar size={14} className="text-teal-700" />
                    <span>{currentPeriodName}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Bu ayın dönemi</span>
                </div>

                <div className="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Daire Başı Aidat
                    </span>
                    {onOpenSettings && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSettings();
                        }}
                        className="text-[10px] font-bold text-teal-700 hover:underline cursor-pointer"
                      >
                        Değiştir
                      </button>
                    )}
                  </div>
                  <div className="text-base font-bold text-teal-700 font-mono mt-0.5">
                    {duesAmount.toLocaleString('tr-TR')} ₺
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Standart pay</span>
                </div>

                <div className="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Kapsam
                  </span>
                  <div className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                    <Building2 size={14} className="text-slate-600" />
                    <span>{totalUnits} Daire</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Aktif bağımsız bölüm</span>
                </div>

                <div className="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Toplam Tahakkuk
                  </span>
                  <div className="text-base font-bold text-amber-900 font-mono mt-0.5">
                    {totalAccrual.toLocaleString('tr-TR')} ₺
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Beklenen gelir</span>
                </div>
              </div>
            </div>

            {/* Yasal & Operasyonel Kurallar */}
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Clock size={13} className="text-slate-400" />
                  Son Ödeme Günü:
                </span>
                <span className="font-bold text-slate-900">
                  Her ayın {dueDay}. günü
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Users size={13} className="text-slate-400" />
                  Yasal Muhatap:
                </span>
                <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/70 text-[11px]">
                  İkamet Eden / Kiracı (İşletme Avansı)
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-slate-400" />
                  Gecikme Zammı:
                </span>
                <span className="font-bold text-slate-700">
                  {settings?.lateFeeEnabled ? '%5 Yasal Faiz (KMK m. 20)' : 'Faizsiz'}
                </span>
              </div>
            </div>

            {/* Mevcut Dönem Uyarısı ve Force Seçeneği */}
            {existingPeriod && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold">Bu ay için aidat zaten oluşturulmuş: </span>
                    Sistemde <strong>"{currentPeriodName}"</strong> adında mevcut bir dönem bulunuyor.
                  </div>
                </div>

                <label className="flex items-center gap-2.5 pt-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={force}
                    onChange={(e) => setForce(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-[11px] font-semibold text-amber-950">
                    Mevcut borçları korumak yerine eksik daireleri yeniden üret ve güncelle (Zorla)
                  </span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* 3. MODAL BODY: SUCCESS STEP                                         */}
        {/* =================================================================== */}
        {step === 'success' && resultData && (
          <div className="p-6 space-y-5 text-center overflow-y-auto animate-scale-up">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
              <CheckCircle2 size={36} className="stroke-[2.5]" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-900">
                Rutin Aidat Başarıyla Oluşturuldu!
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
                <strong>{resultData.period.name}</strong> dönemi aidatları sisteme işlendi ve bağımsız bölümlere borç kaydedildi.
              </p>
            </div>

            {/* Özet Kart */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <span className="text-slate-500 font-medium">Dönem Adı:</span>
                <span className="font-bold text-slate-900">{resultData.period.name}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <span className="text-slate-500 font-medium">Borçlandırılan Daire:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {resultData.createdDebtsCount} Daireye Yansıtıldı
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <span className="text-slate-500 font-medium">Daire Başı Tutar:</span>
                <span className="font-bold font-mono text-slate-900">
                  {Number(resultData.period.amount).toLocaleString('tr-TR')} ₺
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <span className="text-slate-500 font-medium">Toplam Tahakkuk:</span>
                <span className="font-bold font-mono text-teal-800 text-sm">
                  {(Number(resultData.createdDebtsCount) * Number(resultData.period.amount)).toLocaleString('tr-TR')} ₺
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Son Ödeme Tarihi:</span>
                <span className="font-bold text-slate-700 font-mono">
                  {resultData.period.dueDate || `${dueDay} ${currentPeriodName}`}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Kat sakinleri ve kiracılar bu borcu kendi panellerinde görebilir, online veya banka transferi ile ödeyebilir.
            </p>
          </div>
        )}

        {/* =================================================================== */}
        {/* 4. MODAL FOOTER CONTROLS                                            */}
        {/* =================================================================== */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          {step === 'preview' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isSubmitting || totalUnits === 0}
                className="px-5 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 active:scale-[0.99] rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Aidatlar Oluşturuluyor...</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} className="fill-white/20" />
                    <span>Aidatları Oluştur ve Dairelere Yansıt</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Kapat
              </button>

              {onNavigateToDebts && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToDebts();
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Receipt size={14} />
                  <span>Borç Listesini Görüntüle</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
