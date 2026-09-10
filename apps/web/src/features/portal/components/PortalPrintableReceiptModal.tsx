import React from 'react';
import { Receipt, X, Printer } from 'lucide-react';

export interface PortalPrintableReceiptModalProps {
  invoice: any;
  userUnit?: string;
  userName?: string;
  onClose: () => void;
}

export const PortalPrintableReceiptModal: React.FC<PortalPrintableReceiptModalProps> = ({
  invoice,
  userUnit,
  userName,
  onClose,
}) => {
  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-up text-slate-900">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
              <Receipt size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Resmi Tahsilat Makbuzu</h3>
              <span className="text-[11px] text-slate-400 font-mono">
                MK-2026-{invoice.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 my-5 text-xs">
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block">
                Tahsilat Yapan
              </span>
              <span className="font-bold text-slate-900 text-xs">Gencosman Apartmanı Yönetimi</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block">
                Bağımsız Bölüm
              </span>
              <span className="font-bold text-slate-900 text-xs">
                {invoice.unit || userUnit} · {userName}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block">
                Tahsilat Tarihi
              </span>
              <span className="font-bold text-slate-900 text-xs font-mono">{invoice.paidDate}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block">
                Ödeme Kanalı
              </span>
              <span className="font-bold text-teal-700 text-xs">Banka / FAST &amp; Kart</span>
            </div>
          </div>

          <div className="p-3.5 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between font-bold text-slate-800 text-xs">
              <span>{invoice.title}</span>
              <span className="font-mono text-slate-900">{invoice.amount}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Dönem / Bütçe Türü</span>
              <span>
                {invoice.category} ({invoice.period})
              </span>
            </div>
            <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-slate-900 text-sm">
              <span>Tahsil Edilen Tutar</span>
              <span className="text-teal-700 font-mono text-base">{invoice.amount}</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-center leading-relaxed">
            Bu belge Kat Mülkiyeti Kanunu m. 32 uyarınca işletme defterine işlenmiş olup geçerli resmi
            tahsilat makbuzudur.
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Printer size={13} />
            <span>Yazdır</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
