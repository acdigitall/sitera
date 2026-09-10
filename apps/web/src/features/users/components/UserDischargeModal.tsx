import React, { useState } from 'react';
import { User, Debt } from '@sitera/shared';
import { UserMinus, X, AlertTriangle, Check } from 'lucide-react';

export interface UserDischargeModalProps {
  user: User | null;
  debts: Debt[];
  onClose: () => void;
  onDischarge?: (userId: string, unit: string) => Promise<any>;
}

export const UserDischargeModal: React.FC<UserDischargeModalProps> = ({
  user,
  debts,
  onClose,
  onDischarge,
}) => {
  const [isDischarging, setIsDischarging] = useState(false);

  if (!user) return null;

  const unitStr = user.units?.[0] || 'Daire';
  const userDebts = debts.filter(
    (d) =>
      (d.userId === user.id || (user.units && user.units.includes(d.unit))) &&
      d.status !== 'paid'
  );
  const unpaidTotal = userDebts.reduce(
    (sum, d) => sum + (Number(d.amount) - Number(d.paidAmount)),
    0
  );

  const handleDischargeSubmit = async () => {
    if (!onDischarge) return;
    setIsDischarging(true);
    try {
      await onDischarge(user.id, unitStr);
      onClose();
      alert(`${user.name} kullanıcısının ${unitStr} dairesi ile ilişiği başarıyla kesildi.`);
    } catch (err: any) {
      alert('İlişik kesme hatası: ' + err.message);
    } finally {
      setIsDischarging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <UserMinus size={18} className="text-amber-600" />
            Sakin İlişik Kesme & Daire Tahliyesi
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 mt-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="font-bold text-slate-900 text-sm">{user.name}</div>
            <div className="text-slate-500 font-mono">{user.email}</div>
            <div className="text-indigo-600 font-bold mt-1">Tahliye Edilecek Daire: {unitStr}</div>
          </div>

          {/* Kalan Borç Durumu */}
          <div
            className={`p-3 rounded-xl border ${
              unpaidTotal > 0
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="font-bold text-xs flex items-center gap-1.5">
              {unpaidTotal > 0 ? (
                <AlertTriangle size={14} className="text-rose-600" />
              ) : (
                <Check size={14} className="text-emerald-600" />
              )}
              <span>
                {unpaidTotal > 0
                  ? 'Daireye Ait Ödenmemiş Borç Bulunuyor'
                  : 'Borçsuz Ayrılış (Tüm Borçlar Ödenmiş)'}
              </span>
            </div>
            {unpaidTotal > 0 ? (
              <div className="mt-1 font-mono text-sm font-extrabold text-rose-700">
                Kalan Toplam Borç: {unpaidTotal.toLocaleString('tr-TR')} ₺ ({userDebts.length} adet borç)
              </div>
            ) : (
              <div className="text-[11px] text-emerald-700 mt-0.5">
                Bu sakine ait bekleyen herhangi bir aidat veya demirbaş borcu yoktur.
              </div>
            )}
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
            ℹ️ <strong>İlişik Kesme Kuralı:</strong> Bu işlem onaylandığında sakin bu daireden ayrılacak ve daire sistemde <strong>Boş Daire</strong> statüsüne dönecektir. Varsa ödenmemiş borçlar sakinin adında icra/arşiv kaydı olarak kalacak, daireye yeni atanacak sakine devredilmeyecektir.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isDischarging}
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
            >
              İptal
            </button>
            <button
              type="button"
              disabled={isDischarging}
              onClick={handleDischargeSubmit}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <UserMinus size={13} />
              <span>{isDischarging ? 'İşleniyor...' : 'İlişiği Kes ve Daireyi Boşalt'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
