import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, Plus, Wallet, Coins, PiggyBank, Check, Banknote } from '../../../components/common/fontawesome-icons';
import { AccountType, CreateFinanceAccountDto } from '@sitera/shared';
import { financeApi } from '../../finance/finance.api';
import { triggerFinanceUpdate } from '../../finance/useFinance';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId?: string;
  onSuccess?: () => void;
}

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  groupId,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('Ziraat Bankası');
  const [iban, setIban] = useState('');
  const [balance, setBalance] = useState('0');
  const [type, setType] = useState<AccountType>('bank');
  const [isPrimary, setIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Escape key and body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Lütfen hesap adını giriniz.');
      return;
    }
    if (!bankName.trim()) {
      setError('Lütfen banka veya kasa adını giriniz.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const dto: CreateFinanceAccountDto = {
        name: name.trim(),
        bankName: bankName.trim(),
        iban: iban.trim() || undefined,
        initialBalance: parseFloat(balance) || 0,
        type,
        isPrimary,
      };

      await financeApi.createAccount(dto, groupId);
      triggerFinanceUpdate();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Hesap oluşturulurken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
    >
      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl z-10 border border-slate-200 animate-scale-up max-h-[90vh] overflow-y-auto my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Yeni Kasa / Banka Hesabı</h3>
              <p className="text-xs text-slate-500 font-medium">Site veya apartman için finansal hesap tanımlayın</p>
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
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Account Type Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Hesap Türü
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('bank');
                  if (bankName === 'Nakit Kasa') setBankName('Ziraat Bankası');
                }}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  type === 'bank'
                    ? 'border-teal-600 bg-teal-50/70 text-teal-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Banknote size={20} className={type === 'bank' ? 'text-teal-700' : 'text-slate-400'} />
                <span className="text-xs">Vadesiz Cari</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('reserve');
                  if (bankName === 'Nakit Kasa') setBankName('Garanti BBVA');
                }}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  type === 'reserve'
                    ? 'border-violet-600 bg-violet-50/70 text-violet-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <PiggyBank size={20} className={type === 'reserve' ? 'text-violet-600' : 'text-slate-400'} />
                <span className="text-xs">Yedek / Fon</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('cash');
                  setBankName('Nakit Kasa');
                  setIban('Elden Nakit Kasa');
                }}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  type === 'cash'
                    ? 'border-amber-600 bg-amber-50/70 text-amber-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Coins size={20} className={type === 'cash' ? 'text-amber-600' : 'text-slate-400'} />
                <span className="text-xs">Nakit Kasa</span>
              </button>
            </div>
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Hesap Açıklaması / Adı <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Yapı Kredi Aidat Hesabı veya A Blok Nakit Kasası"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-teal-600 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Bank Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Banka / Kurum Adı <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Ziraat Bankası"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full h-10 px-3.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-teal-600 text-slate-900"
              />
            </div>

            {/* Opening Balance */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Açılış / Mevcut Bakiye (₺)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full h-10 px-3.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-teal-600 text-slate-900 font-mono"
              />
            </div>
          </div>

          {/* IBAN */}
          {type !== 'cash' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                IBAN Numarası
              </label>
              <input
                type="text"
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                className="w-full h-10 px-3.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-teal-600 text-slate-900 font-mono"
              />
            </div>
          )}

          {/* Primary Account Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700">
                Bu hesabı sitenin <strong className="text-slate-900 font-bold">Birincil Aidat Hesabı</strong> olarak ayarla
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? 'Kaydediliyor...' : 'Hesabı Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
