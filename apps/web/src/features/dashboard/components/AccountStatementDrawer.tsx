import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Printer,
  Copy,
  Check,
  Building2,
  Wallet,
  Coins,
  PiggyBank,
  Banknote,
  Filter,
} from '../../../components/common/fontawesome-icons';
import { AccountTransaction, FinanceAccount } from '@sitera/shared';
import { financeApi } from '../../finance/finance.api';

interface AccountStatementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  account: FinanceAccount | null; // null means consolidated "Toplam Varlık"
  groupId?: string;
  totalLiquidity?: number;
}

export const AccountStatementDrawer: React.FC<AccountStatementDrawerProps> = ({
  isOpen,
  onClose,
  account,
  groupId,
  totalLiquidity = 0,
}) => {
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [copiedIban, setCopiedIban] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const data = await financeApi.getAccountTransactions(account ? account.id : null, groupId);
        setTransactions(data);
      } catch (err) {
        console.error('Hesap hareketleri yüklenirken hata:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [isOpen, account, groupId]);

  const handleCopyIban = (iban: string) => {
    navigator.clipboard.writeText(iban);
    setCopiedIban(true);
    setTimeout(() => setCopiedIban(false), 2000);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.counterparty && t.counterparty.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.accountName && t.accountName.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesType = true;
      if (selectedType === 'income') matchesType = t.type === 'income';
      if (selectedType === 'expense') matchesType = t.type === 'expense';
      if (selectedType === 'transfer') matchesType = t.type === 'transfer_in' || t.type === 'transfer_out';

      return matchesSearch && matchesType;
    });
  }, [transactions, searchQuery, selectedType]);

  const currentBalance = account ? Number(account.balance) : totalLiquidity;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl z-10 flex flex-col animate-slide-left">
        {/* Header */}
        <div className="p-5 border-b border-slate-200/90 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900">
                {account ? account.name : 'Konsolide Kasa & Varlık Ekstresi'}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                {account
                  ? account.type === 'reserve'
                    ? 'Yedek Fon'
                    : account.type === 'cash'
                    ? 'Nakit Kasa'
                    : 'Banka Cari'
                  : 'Tüm Hesaplar'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {account ? account.bankName : '3 Aktif Hesap & Kasa Konsolide Hareket Dökümü'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
              title="Ekstreyi Yazdır / PDF"
            >
              <Printer size={17} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Balance Card */}
        <div className="p-5 bg-white border-b border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {account ? 'Güncel Hesap Bakiyesi' : 'Toplam Konsolide Likidite'}
              </span>
              <div className="text-3xl font-bold text-slate-900 tabular-nums tracking-tight mt-0.5">
                {currentBalance.toLocaleString('tr-TR')} ₺
              </div>
              {account?.iban && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-mono text-slate-500">{account.iban}</span>
                  <button
                    onClick={() => handleCopyIban(account.iban!)}
                    className="text-xs font-medium text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedIban ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copiedIban ? 'Kopyalandı' : 'Kopyala'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs shrink-0">
              {account?.type === 'reserve' ? (
                <PiggyBank size={24} className="text-violet-600" />
              ) : account?.type === 'cash' ? (
                <Coins size={24} className="text-amber-600" />
              ) : account ? (
                <Banknote size={24} className="text-teal-700" />
              ) : (
                <Wallet size={24} className="text-slate-800" />
              )}
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full">
              <Search size={15} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Açıklama, daire veya firma ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-teal-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0 self-stretch sm:self-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSelectedType('all')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  selectedType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('income')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  selectedType === 'income' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                + Girişler
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('expense')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  selectedType === 'expense' ? 'bg-white text-rose-800 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                - Çıkışlar
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('transfer')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  selectedType === 'transfer' ? 'bg-white text-blue-800 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ⇄ Virman
              </button>
            </div>
          </div>
        </div>

        {/* Transaction History List */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <RefreshCw size={24} className="animate-spin text-teal-600" />
              <span className="text-xs font-medium">Hesap hareketleri yükleniyor...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              Kayıtlı hesap hareketi bulunamadı.
            </div>
          ) : (
            filteredTransactions.map((t) => {
              const isIncome = t.type === 'income' || t.type === 'transfer_in';
              const isTransfer = t.type === 'transfer_in' || t.type === 'transfer_out';

              return (
                <div key={t.id} className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isTransfer
                          ? 'bg-blue-50 border-blue-100 text-blue-700'
                          : isIncome
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          : 'bg-rose-50 border-rose-100 text-rose-700'
                      }`}
                    >
                      {isTransfer ? (
                        <RefreshCw size={15} />
                      ) : isIncome ? (
                        <ArrowDownRight size={16} />
                      ) : (
                        <ArrowUpRight size={16} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {t.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-1.5 font-medium">
                        {t.counterparty && <span>{t.counterparty} ·</span>}
                        <span>
                          {new Date(t.transactionDate || t.createdAt).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {!account && t.accountName && (
                          <span className="text-slate-400">({t.accountName})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-bold tabular-nums ${
                        isIncome ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {Number(t.amount).toLocaleString('tr-TR')} ₺
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Bakiye: {Number(t.balanceAfter).toLocaleString('tr-TR')} ₺
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Toplam {filteredTransactions.length} işlem kaydı listelendi</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
