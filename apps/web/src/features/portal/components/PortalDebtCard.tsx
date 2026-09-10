import React from 'react';
import { Clock, FileText } from 'lucide-react';
import { openReceiptInNewTab } from '../../finance';

export interface PortalDebtCardProps {
  payment: {
    id: string;
    title: string;
    period: string;
    category: string;
    amount: string;
    rawAmount: number;
    rawTotalAmount: number;
    totalWithLateFee: string;
    dueDate: string;
    status: string;
    isPendingApproval: boolean;
    pendingReceiptUrl?: string | null;
    isOverdue: boolean;
    overdueDays: number;
    lateFee: number;
    isFixture: boolean;
    paidDate?: string;
    unit?: string;
  };
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenReceipt: (payment: any) => void;
}

export const PortalDebtCard: React.FC<PortalDebtCardProps> = ({
  payment: p,
  isSelected,
  onToggleSelect,
  onOpenReceipt,
}) => {
  const isPaid = p.status === 'paid';

  return (
    <div
      onClick={() => !isPaid && !p.isPendingApproval && onToggleSelect(p.id)}
      className={`py-4 flex items-center justify-between gap-3 text-sm -mx-2 px-3 rounded-lg transition-colors ${
        p.isPendingApproval
          ? 'bg-amber-50/40 border border-amber-200/80 cursor-default'
          : isSelected && !isPaid
          ? 'bg-teal-50/70 border border-teal-200 cursor-pointer'
          : isPaid
          ? 'cursor-default'
          : 'hover:bg-slate-50/70 cursor-pointer'
      }`}
    >
      {/* Checkbox or Pending Icon */}
      {p.isPendingApproval ? (
        <div
          className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0"
          title="Dekont yüklendi, yönetici onayı bekleniyor"
        >
          <Clock size={12} />
        </div>
      ) : !isPaid ? (
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(p.id)}
            className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600 cursor-pointer"
          />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          {p.unit && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
              {p.unit}
            </span>
          )}
          <span className="font-bold text-slate-900 text-sm">{p.title}</span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${
              p.isFixture
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {p.category}
          </span>
          {p.isPendingApproval && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
              <Clock size={11} />
              Yönetici Onayı Bekliyor
            </span>
          )}
        </div>

        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 truncate font-medium">
          <span>Dönem: {p.period}</span>
          <span>·</span>
          <span>{isPaid ? `Ödendi: ${p.paidDate}` : `Son Ödeme: ${p.dueDate}`}</span>
          {p.isOverdue && !isPaid && !p.isPendingApproval && p.lateFee > 0 && (
            <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded text-[11px]">
              {p.overdueDays} gün gecikme (+%{5} KMK faizi: +{p.lateFee} ₺)
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <div className="font-bold text-slate-900 text-base tabular-nums">
            {p.isOverdue && !p.isPendingApproval && p.lateFee > 0 ? p.totalWithLateFee : p.amount}
          </div>
          <div className="text-xs font-medium">
            {isPaid ? (
              <span className="text-teal-700 font-bold">Ödendi</span>
            ) : p.isPendingApproval ? (
              <span className="text-amber-700 font-bold">Onay Bekliyor</span>
            ) : p.isOverdue ? (
              <span className="text-rose-600 font-bold">Gecikmiş</span>
            ) : (
              <span className="text-slate-600 font-bold">Ödenmedi</span>
            )}
          </div>
        </div>

        <div>
          {isPaid ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenReceipt(p);
              }}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
            >
              <FileText size={13} className="text-slate-500" />
              <span>Makbuz</span>
            </button>
          ) : p.isPendingApproval ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openReceiptInNewTab(p.pendingReceiptUrl);
              }}
              className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
              title="Dekontu Yeni Sekmede Aç"
            >
              <FileText size={13} className="text-amber-700" />
              <span>Dekont Aç</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(p.id);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs ${
                isSelected
                  ? 'bg-teal-700 text-white'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              {isSelected ? 'Seçildi ✓' : 'Seç'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
