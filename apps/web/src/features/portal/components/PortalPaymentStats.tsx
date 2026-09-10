import React from 'react';
import { Copy } from 'lucide-react';

export interface PortalPaymentStatsProps {
  pendingTotal: number;
  payableCount: number;
  paidTotal: number;
  paidCount: number;
  ibanCopied: boolean;
  onCopyIban: (iban: string) => void;
}

export const PortalPaymentStats: React.FC<PortalPaymentStatsProps> = ({
  pendingTotal,
  payableCount,
  paidTotal,
  paidCount,
  ibanCopied,
  onCopyIban,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Kart 1: Toplam Bekleyen Borç (Top Border Teal) */}
      <div className="bg-white border border-slate-300 border-t-3 border-t-teal-700 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-slate-900">Toplam Bekleyen Borç</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                pendingTotal > 0 ? 'text-rose-800 bg-rose-50' : 'text-teal-800 bg-teal-50'
              }`}
            >
              {payableCount} Fatura
            </span>
          </div>
          <div className="text-sm text-slate-500 mt-1 font-medium">
            Ödenmesi gereken cari aidat/demirbaş
          </div>

          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
              {pendingTotal.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-slate-500 mt-1.5">
              {payableCount > 0
                ? `${payableCount} adet faturayı aynı anda topluca ödeyebilirsiniz`
                : 'Ödenmemiş borç bulunmamaktadır'}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Ödeme Yöntemleri: 2 Seçenek</span>
          <span className="text-teal-700 font-bold">Havale (0 ₺) &amp; Kart (%5)</span>
        </div>
      </div>

      {/* Kart 2: 2026 Ödenen Aidatlar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-slate-900">2026 Ödenen Aidatlar</span>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
              Makbuzlu
            </span>
          </div>
          <div className="text-sm text-slate-500 mt-1 font-medium">
            Bankaya intikal eden cari tahsilatlar
          </div>

          <div className="mt-4">
            <div className="text-3xl font-bold text-teal-900 tracking-tight tabular-nums">
              {paidTotal.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-slate-500 mt-1.5">
              Düzenli ödenen toplam aidat bedeli
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Resmi işletme defteri kayıtlı</span>
          <span className="text-teal-700 font-semibold">{paidCount} Adet Tahsilat</span>
        </div>
      </div>

      {/* Kart 3: Site Yönetimi Ana Aidat Hesabı */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-slate-900">Site Aidat Hesabı</span>
            <span className="text-xs font-semibold text-slate-600 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
              Ziraat Bankası
            </span>
          </div>
          <div className="text-sm text-slate-500 mt-1 font-medium">
            Gencosman Apartmanı Yönetimi
          </div>

          <div className="mt-4">
            <div className="text-xs font-mono font-bold text-slate-900 select-all truncate">
              TR42 0001 0090 1234 5678 5001
            </div>
            <div className="text-xs text-slate-500 mt-1.5">
              Banka FAST / Havale ile komisyonsuz (0 ₺ masraf)
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>İşletme Hesabı (TL)</span>
          <button
            type="button"
            onClick={() => onCopyIban('TR42 0001 0090 1234 5678 5001')}
            className="text-teal-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            <Copy size={12} />
            <span>{ibanCopied ? 'Kopyalandı' : 'IBAN Kopyala'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
