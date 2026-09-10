import React, { useState } from 'react';
import { X, Shuffle, RefreshCw, AlertCircle, Check } from '../../../components/common/fontawesome-icons';
import { FinanceAccount, TransferFundsDto } from '@sitera/shared';
import { financeApi } from '../../finance/finance.api';
import { triggerFinanceUpdate } from '../../finance/useFinance';

interface TransferFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: FinanceAccount[];
  groupId?: string;
  onSuccess?: () => void;
}

export const TransferFundsModal: React.FC<TransferFundsModalProps> = ({
  isOpen,
  onClose,
  accounts,
  groupId,
  onSuccess,
}) => {
  const [fromAccountId, setFromAccountId] = useState<string>(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState<string>(accounts[1]?.id || '');
  const [amount, setAmount] = useState('1000');
  const [description, setDescription] = useState('Hesaplar arası bakiye virmanı');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const fromAcc = accounts.find((a) => a.id === fromAccountId);
  const toAcc = accounts.find((a) => a.id === toAccountId);

  const parsedAmount = parseFloat(amount) || 0;
  const isInsufficient = fromAcc ? Number(fromAcc.balance) < parsedAmount : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId) {
      setError('Lütfen kaynak ve hedef hesapları seçiniz.');
      return;
    }
    if (fromAccountId === toAccountId) {
      setError('Kaynak ve hedef hesap aynı olamaz.');
      return;
    }
    if (parsedAmount <= 0) {
      setError('Transfer tutarı 0’dan büyük olmalıdır.');
      return;
    }
    if (isInsufficient) {
      setError(`Kaynak hesapta (${fromAcc?.name}) yeterli bakiye bulunmuyor.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const dto: TransferFundsDto = {
        fromAccountId,
        toAccountId,
        amount: parsedAmount,
        description: description.trim() || undefined,
      };

      await financeApi.transferFunds(dto, groupId);
      triggerFinanceUpdate();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Transfer gerçekleştirilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl z-10 overflow-hidden border border-slate-200 animate-scale-up">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
              <Shuffle size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Hesaplar Arası Virman / Transfer</h3>
              <p className="text-xs text-slate-500 font-medium">Banka hesapları ve nakit kasa arasında para aktarın</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* From Account */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kaynak Hesap (Çıkış) <span className="text-rose-500">*</span>
              </label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full h-10 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-600 text-slate-900 cursor-pointer"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({Number(a.balance).toLocaleString('tr-TR')} ₺)
                  </option>
                ))}
              </select>
              {fromAcc && (
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Mevcut: <strong className="text-slate-900">{Number(fromAcc.balance).toLocaleString('tr-TR')} ₺</strong>
                </div>
              )}
            </div>

            {/* To Account */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Hedef Hesap (Giriş) <span className="text-rose-500">*</span>
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full h-10 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-600 text-slate-900 cursor-pointer"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id} disabled={a.id === fromAccountId}>
                    {a.name} ({Number(a.balance).toLocaleString('tr-TR')} ₺)
                  </option>
                ))}
              </select>
              {toAcc && (
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Mevcut: <strong className="text-slate-900">{Number(toAcc.balance).toLocaleString('tr-TR')} ₺</strong>
                </div>
              )}
            </div>
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Transfer Tutarı (₺) <span className="text-rose-500">*</span>
              </label>
              {isInsufficient && (
                <span className="text-xs font-semibold text-rose-600">Yetersiz bakiye!</span>
              )}
            </div>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full h-11 px-3.5 text-base font-bold bg-white border rounded-lg focus:outline-hidden text-slate-900 font-mono ${
                isInsufficient ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 focus:border-blue-600'
              }`}
            />

            {/* Quick Chips */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-slate-400 font-medium">Hızlı Tutar:</span>
              {[500, 1000, 2500, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className="px-2.5 py-0.5 text-xs font-semibold rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                >
                  +{val.toLocaleString('tr-TR')} ₺
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Transfer Açıklaması
            </label>
            <input
              type="text"
              placeholder="Örn: Kapıcı nakit avansı veya bankadan kasaya çekim"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-10 px-3.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-600 text-slate-900"
            />
          </div>

          {/* Notice Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-600 space-y-1 font-medium">
            <div className="font-bold text-slate-800">💡 Virman Muhasebe Bilgisi:</div>
            <p>
              Bu işlem yalnızca hesaplar arasındaki paranın yerini değiştirir. Sitenin{' '}
              <strong className="text-slate-900">Toplam Konsolide Kasa Likiditesi değişmez</strong>.
              Her iki hesaba da anında karşılıklı çift taraflı dekont kaydı işlenir.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting || isInsufficient}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? 'Aktarılıyor...' : 'Virmanı Tamamla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
