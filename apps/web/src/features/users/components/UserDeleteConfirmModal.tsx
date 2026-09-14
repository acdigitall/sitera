import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Debt, formatRoleBadge } from '@sitera/shared';
import { Trash2, X, AlertTriangle, Loader2, Building2 } from 'lucide-react';

export interface UserDeleteConfirmModalProps {
  user: User | null;
  debts?: Debt[];
  onClose: () => void;
  onConfirm: (userId: string) => Promise<any> | void;
}

export const UserDeleteConfirmModal: React.FC<UserDeleteConfirmModalProps> = ({
  user,
  debts = [],
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setErrorMessage(null);
    setIsDeleting(false);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [user, onClose]);

  if (!user) return null;

  const isStaff = user.role !== 'member';
  const unitStr = user.units && user.units.length > 0 ? user.units.join(', ') : 'Daire Belirtilmemiş';

  // Check for unpaid debts
  const userDebts = debts.filter((d) => {
    const matchesUser = d.userId && d.userId === user.id;
    const matchesUnit = user.units && user.units.length > 0 && user.units.includes(d.unit);
    return (matchesUser || matchesUnit) && d.status !== 'paid';
  });

  const totalUnpaidAmount = userDebts.reduce((sum, d) => {
    const remaining = Number(d.amount || 0) - Number(d.paidAmount || 0);
    return sum + (remaining > 0 ? remaining : 0);
  }, 0);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await onConfirm(user.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Kullanıcı silinirken beklenmeyen bir hata oluştu.');
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up max-h-[90vh] overflow-y-auto my-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isStaff ? 'Personeli Sil' : 'Daireyi / Sakini Sil'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bu kayıt sistemden kalıcı olarak kaldırılacaktır.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-colors disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 mt-4 text-xs">
          {/* User Info Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">{user.name}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                {formatRoleBadge(user.role).label}
              </span>
            </div>
            <div className="text-slate-500 font-mono text-[11px]">{user.email}</div>
            {user.phone && (
              <div className="text-slate-500 text-[11px]">Tel: {user.phone}</div>
            )}
            {!isStaff && (
              <div className="flex items-center gap-1.5 text-indigo-700 font-semibold bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100 text-[11px] mt-1">
                <Building2 size={13} />
                <span>Bağlı Daire(ler): {unitStr}</span>
              </div>
            )}
          </div>

          {/* Unpaid Debts Warning */}
          {userDebts.length > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-300/80 rounded-xl text-amber-900 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-xs">
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <span>Dikkat: Ödenmemiş Borç Bulunuyor!</span>
              </div>
              <p className="text-[11px]">
                Bu kullanıcıya ait toplam <strong>{totalUnpaidAmount.toLocaleString('tr-TR')} ₺</strong> tutarında <strong>{userDebts.length} adet</strong> açık aidat/gider borcu bulunmaktadır.
              </p>
              <p className="text-[10px] text-amber-800 bg-amber-100/60 p-2 rounded-lg">
                💡 <em>Tavsiye:</em> Sakin yalnızca daireden taşındıysa silmek yerine <strong>"Sakin İlişiğini Kes"</strong> işlemini yapmanız önerilir. Silme işlemi yapılırsa borç geçmişi doğrudan sakinsiz kalabilir.
              </p>
            </div>
          )}

          {/* Destructive Warning */}
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-[11px] leading-relaxed">
            <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong>Geri Alınamaz İşlem:</strong> Bu onay verildiğinde sakin/personel profili ve portal giriş bilgileri veritabanından kalıcı olarak silinecektir.
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 cursor-pointer transition-colors disabled:opacity-50 text-xs"
            >
              Vazgeç
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors text-xs"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Siliniyor...</span>
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  <span>Kalıcı Olarak Sil</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
