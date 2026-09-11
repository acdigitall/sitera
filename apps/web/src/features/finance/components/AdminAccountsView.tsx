import React, { useState, useMemo, useEffect } from 'react';
import {
  Landmark,
  Wallet,
  Coins,
  PiggyBank,
  Banknote,
  Plus,
  Shuffle,
  Search,
  Copy,
  Check,
  Building2,
  ExternalLink,
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Printer,
  X,
  CreditCard,
} from '../../../components/common/fontawesome-icons';
import { useFinance } from '../useFinance';
import { FinanceAccount, AccountTransaction, Group } from '@sitera/shared';
import { financeApi } from '../finance.api';
import { CreateAccountModal } from '../../dashboard/components/CreateAccountModal';
import { TransferFundsModal } from '../../dashboard/components/TransferFundsModal';
import { AccountStatementDrawer } from '../../dashboard/components/AccountStatementDrawer';

interface AdminAccountsViewProps {
  groupId?: string;
  activeGroup?: Group;
}

export const AdminAccountsView: React.FC<AdminAccountsViewProps> = ({
  groupId,
  activeGroup,
}) => {
  const { accounts, summary, refetch } = useFinance(groupId);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedAccountForStatement, setSelectedAccountForStatement] = useState<FinanceAccount | null>(null);
  const [isStatementDrawerOpen, setIsStatementDrawerOpen] = useState(false);
  const [copiedIbanId, setCopiedIbanId] = useState<string | null>(null);

  // Filter & Search states
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | 'bank' | 'cash' | 'reserve'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Transactions list for the bottom ledger section
  const [recentTransactions, setRecentTransactions] = useState<AccountTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const data = await financeApi.getAccountTransactions(undefined, groupId);
      setRecentTransactions(data || []);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [groupId]);

  const handleCopyIban = (iban: string, accountId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(iban.replace(/\s+/g, ''));
    setCopiedIbanId(accountId);
    setTimeout(() => setCopiedIbanId(null), 2000);
  };

  // KPI calculations
  const totalLiquidity = useMemo(() => {
    return accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  }, [accounts]);

  const bankAccounts = useMemo(() => accounts.filter((a) => a.type === 'bank'), [accounts]);
  const cashAccounts = useMemo(() => accounts.filter((a) => a.type === 'cash'), [accounts]);
  const reserveAccounts = useMemo(() => accounts.filter((a) => a.type === 'reserve'), [accounts]);

  const totalBankBalance = useMemo(() => bankAccounts.reduce((s, a) => s + Number(a.balance), 0), [bankAccounts]);
  const totalCashBalance = useMemo(() => cashAccounts.reduce((s, a) => s + Number(a.balance), 0), [cashAccounts]);
  const totalReserveBalance = useMemo(() => reserveAccounts.reduce((s, a) => s + Number(a.balance), 0), [reserveAccounts]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (activeTypeFilter !== 'all' && acc.type !== activeTypeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = acc.name.toLowerCase().includes(q);
        const matchBank = acc.bankName.toLowerCase().includes(q);
        const matchIban = acc.iban?.toLowerCase().includes(q);
        return matchName || matchBank || matchIban;
      }
      return true;
    });
  }, [accounts, activeTypeFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-full animate-fade-in pb-16 font-sans">
      {/* 1. Sayfa Başlığı ve Temel Aksiyonlar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Kasa &amp; Banka Hesapları
            </h1>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-md">
              {accounts.length} Tanımlı Hesap
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {activeGroup?.name || 'Site Yönetimi'} · Vadesiz aidat hesapları, resmi IBAN bilgileri, demirbaş fonları ve nakit kasalar
          </p>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsTransferModalOpen(true)}
            disabled={accounts.length < 2}
            className={`h-10 inline-flex items-center gap-2 px-4 text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer ${
              accounts.length >= 2
                ? 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50'
                : 'text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed'
            }`}
            title={accounts.length < 2 ? 'Virman için en az 2 hesap gereklidir' : 'Hesaplar arası virman yap'}
          >
            <Shuffle size={15} className={accounts.length >= 2 ? 'text-blue-600' : 'text-slate-400'} />
            <span>Virman Yap</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-10 inline-flex items-center gap-2 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>+ Yeni Hesap Ekle</span>
          </button>
        </div>
      </div>

      {/* 2. Kurumsal KPI Varlık Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kart 1: Toplam Likidite */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between border-t-[3px] border-t-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Konsolide Toplam Varlık</span>
            <Wallet size={18} className="text-slate-700" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
              ₺{totalLiquidity.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{accounts.length} Hesap / Kasa Toplamı</span>
            </div>
          </div>
        </div>

        {/* Kart 2: Banka Hesapları */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between border-t-[3px] border-t-teal-600">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Banka Hesapları (Vadesiz)</span>
            <Banknote size={18} className="text-teal-700" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-bold text-teal-900 font-mono tabular-nums">
              ₺{totalBankBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {bankAccounts.length} Adet Vadesiz Cari Hesap
            </div>
          </div>
        </div>

        {/* Kart 3: Demirbaş & Fon Rezervleri */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between border-t-[3px] border-t-violet-600">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Demirbaş &amp; Rezerv Fonu</span>
            <PiggyBank size={18} className="text-violet-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-bold text-violet-900 font-mono tabular-nums">
              ₺{totalReserveBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {reserveAccounts.length} Adet Vadeli / Demirbaş Fonu
            </div>
          </div>
        </div>

        {/* Kart 4: Yönetici Nakit Kasası */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between border-t-[3px] border-t-amber-600">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Nakit Kasa &amp; Elden</span>
            <Coins size={18} className="text-amber-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-bold text-amber-900 font-mono tabular-nums">
              ₺{totalCashBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {cashAccounts.length} Adet Elden Kasa / Küçük Cari
            </div>
          </div>
        </div>
      </div>

      {/* 3. Hesaplar Listesi & Filtreleme Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        {/* Üst Araç Çubuğu */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Landmark size={16} className="text-slate-700" />
              <span>Tanımlı Banka ve Kasa Hesapları</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hesap kartlarına tıklayarak detaylı hesap ekstresini ve para giriş-çıkış hareketlerini inceleyebilirsiniz.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Arama Input */}
            <div className="relative w-full sm:w-56">
              <Search size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Banka, hesap adı veya IBAN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-400 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Segmented Filter */}
            <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTypeFilter('all')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  activeTypeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tümü ({accounts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTypeFilter('bank')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  activeTypeFilter === 'bank'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Banka ({bankAccounts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTypeFilter('reserve')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  activeTypeFilter === 'reserve'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fon ({reserveAccounts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTypeFilter('cash')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  activeTypeFilter === 'cash'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Nakit ({cashAccounts.length})
              </button>
            </div>
          </div>
        </div>

        {/* Hesap Kartları Izgarası */}
        {filteredAccounts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
              <Landmark size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {accounts.length === 0 ? 'Henüz Tanımlı Bir Hesap Bulunmuyor' : 'Arama Kriterine Uygun Hesap Bulunamadı'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mt-1 mb-4 leading-relaxed">
              {accounts.length === 0
                ? 'Sitenizin aidat tahsilatlarını almak ve harcamalarını takip etmek için Ziraat, Vakıfbank veya Nakit Kasa hesaplarınızı ekleyerek başlayabilirsiniz.'
                : 'Farklı bir arama terimi deneyebilir veya filtreyi değiştirebilirsiniz.'}
            </p>
            {accounts.length === 0 && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                <span>+ İlk Hesabı Ekle</span>
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredAccounts.map((acc) => {
              const AccIcon = acc.type === 'reserve' ? PiggyBank : acc.type === 'cash' ? Coins : Banknote;
              const iconColor = acc.type === 'reserve' ? 'text-violet-600' : acc.type === 'cash' ? 'text-amber-600' : 'text-teal-700';
              const iconBg = acc.type === 'reserve' ? 'bg-violet-50 border-violet-100' : acc.type === 'cash' ? 'bg-amber-50 border-amber-100' : 'bg-teal-50 border-teal-100';

              return (
                <div
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountForStatement(acc);
                    setIsStatementDrawerOpen(true);
                  }}
                  className={`bg-white border rounded-xl p-5 flex flex-col justify-between transition-all shadow-xs hover:shadow-md hover:border-slate-400 cursor-pointer group ${
                    acc.isPrimary
                      ? 'border-slate-300 border-t-[3px] border-t-teal-600'
                      : 'border-slate-200/90'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                            {acc.bankName}
                          </span>
                          {acc.isPrimary && (
                            <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200/70 px-2 py-0.5 rounded">
                              Ana Aidat Hesabı
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                          {acc.name}
                        </div>
                      </div>

                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
                        <AccIcon size={18} className={iconColor} />
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="mt-4">
                      <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight tabular-nums">
                        ₺{Number(acc.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>

                      {/* IBAN Row */}
                      {acc.iban && (
                        <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs font-mono text-slate-600">
                          <span className="truncate mr-2 font-medium">{acc.iban}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyIban(acc.iban!, acc.id, e)}
                            className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-slate-500 hover:text-slate-900 shrink-0 cursor-pointer"
                            title="IBAN Kopyala"
                          >
                            {copiedIbanId === acc.id ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600">
                                <Check size={12} /> Kopyalandı
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <Copy size={12} /> Kopyala
                              </span>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="truncate text-[11px] text-slate-400">
                      {acc.lastActivity || 'İşlem kaydı yok'}
                    </span>
                    <span className="text-xs font-semibold text-teal-700 group-hover:underline inline-flex items-center gap-1">
                      Ekstre &amp; Hareketler <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Son Kasa & Banka Hareketleri (Ledger Tablosu) */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Son Kasa ve Banka Hareketleri
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hesaplar üzerinde gerçekleşen en son tahsilat, harcama ve virman işlemleri
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchTransactions}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <RefreshCw size={12} className={loadingTransactions ? 'animate-spin' : ''} />
              <span>Yenile</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-medium text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4 whitespace-nowrap">Tarih</th>
                <th className="py-2.5 px-4 whitespace-nowrap">İlgili Hesap</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Açıklama / Başlık</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Kategori / Muhatap</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Tutar</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">İşlem Sonrası Bakiye</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Henüz gerçekleşmiş bir finansal hareket bulunmuyor.
                  </td>
                </tr>
              ) : (
                recentTransactions.slice(0, 15).map((tx) => {
                  const isIncome = tx.type === 'income' || tx.type === 'transfer_in';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(tx.transactionDate).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {tx.accountName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                        {tx.title}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                        {tx.counterparty || tx.category || '-'}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap ${
                        isIncome ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {isIncome ? '+' : '-'}₺{Number(tx.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                        ₺{Number(tx.balanceAfter).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals & Statement Drawer */}
      <CreateAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        groupId={groupId}
        onSuccess={() => {
          refetch();
          fetchTransactions();
        }}
      />

      <TransferFundsModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        accounts={accounts}
        groupId={groupId}
        onSuccess={() => {
          refetch();
          fetchTransactions();
        }}
      />

      <AccountStatementDrawer
        isOpen={isStatementDrawerOpen}
        onClose={() => {
          setIsStatementDrawerOpen(false);
          setSelectedAccountForStatement(null);
        }}
        account={selectedAccountForStatement}
        groupId={groupId}
        totalLiquidity={totalLiquidity}
      />
    </div>
  );
};
