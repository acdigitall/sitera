import React from 'react';
import { CheckCircle2, Clock, Zap, Building2 } from 'lucide-react';
import { Group, PlatformModuleDefinition } from '@sitera/shared';

export interface ModulePricingCardProps {
  moduleDef: PlatformModuleDefinition;
  activeGroup?: Group | null;
  units: number;
  monthlyPrice: number;
  isActive: boolean;
  isTrial: boolean;
  processing: boolean;
  onSubscribe: (isTrialAction: boolean) => void;
}

export const ModulePricingCard: React.FC<ModulePricingCardProps> = ({
  moduleDef,
  activeGroup,
  units,
  monthlyPrice,
  isActive,
  isTrial,
  processing,
  onSubscribe,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
        Abonelik &amp; Maliyet Özeti
      </div>
      <div className="text-sm font-bold text-slate-900 mb-3">
        {activeGroup?.name || 'Gencosman Apartmanı'} İçin Hesaplama
      </div>

      {/* Mali Döküm Kutusu */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs font-mono mb-4">
        <div className="flex justify-between text-slate-500 font-sans">
          <span>Kayıtlı Daire Sayısı:</span>
          <span className="font-bold text-slate-900">{units} Daire</span>
        </div>
        <div className="flex justify-between text-slate-500 font-sans">
          <span>Daire Başı Tarife:</span>
          <span className="text-slate-700">
            {moduleDef.pricingModel === 'per_unit' ? `₺${moduleDef.defaultPrice} /ay` : 'Sabit Paket'}
          </span>
        </div>
        <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between text-sm font-sans">
          <span className="font-bold text-slate-900">Aylık Toplam Tutar:</span>
          <div className="text-right">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {monthlyPrice.toLocaleString('tr-TR')} ₺
            </span>
            <span className="text-xs text-slate-400 font-normal"> /ay</span>
          </div>
        </div>
      </div>

      {/* Durum & Aksiyon Butonları */}
      <div className="space-y-2.5">
        {isActive ? (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-center space-y-1">
            <div className="font-bold text-xs text-emerald-800 flex items-center justify-center gap-1.5">
              <CheckCircle2 size={15} />
              <span>Bu Modül Sitenizde Aktif</span>
            </div>
            <p className="text-[11px] text-emerald-700">
              Sakinleriniz bu donanım servisini kullanabilir.
            </p>
          </div>
        ) : isTrial ? (
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-center">
              <div className="font-bold text-xs text-purple-800 flex items-center justify-center gap-1.5">
                <Clock size={14} className="animate-pulse" />
                <span>30 Günlük Deneme Devrede</span>
              </div>
              <p className="text-[11px] text-purple-700 mt-0.5">
                Ücretsiz deneme süreciniz aktiftir.
              </p>
            </div>
            <button
              type="button"
              disabled={processing}
              onClick={() => onSubscribe(false)}
              className="w-full h-10 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Tam Lisansa Yükselt
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              disabled={processing}
              onClick={() => onSubscribe(true)}
              className="w-full h-11 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap size={15} className="text-amber-400" />
              <span>{processing ? 'İşleniyor...' : '30 Gün Ücretsiz Deneme Başlat'}</span>
            </button>

            <p className="text-[11px] text-center text-slate-400 font-medium">
              Kredi kartı gerekmez. Deneme süresinde hiçbir ücret kesilmez.
            </p>

            <button
              type="button"
              disabled={processing}
              onClick={() => onSubscribe(false)}
              className="w-full h-10 px-4 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer text-center"
            >
              Hemen Satın Al (₺{monthlyPrice}/ay)
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
        <Building2 size={14} className="text-slate-400 shrink-0" />
        <span>{activeGroup?.name || 'Gencosman Apartmanı'} aidat bütçesine otomatik yansıtılır.</span>
      </div>
    </div>
  );
};
