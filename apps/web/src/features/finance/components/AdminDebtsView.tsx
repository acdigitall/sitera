import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Debt, Period } from '@sitera/shared';
import {
  Receipt,
  DollarSign,
  Search,
  Check,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { AdminModuleCard } from '../../../components/common/AdminModuleCard';
import { CashCollectionModal } from './CashCollectionModal';
import { openReceiptInNewTab, financeApi } from '../finance.api';
import { useAuth } from '../../auth';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export interface AdminDebtsViewProps {
  periods?: Period[];
  groupId?: string;
  onRecordCash: (params: {
    debtId?: string;
    unit: string;
    amount: number;
    residentName?: string;
    notes?: string;
  }) => Promise<any>;
  /** Summary metrics from useFinance (tüm veri üzerinden hesaplanır) */
  totalAccrual?: number;
  totalCollected?: number;
  totalPending?: number;
  totalDebtsCount?: number;
  unpaidCount?: number;
  paidCount?: number;
  overdueCount?: number;
}

export const AdminDebtsView: React.FC<AdminDebtsViewProps> = ({
  periods = [],
  groupId,
  onRecordCash,
  totalAccrual = 0,
  totalCollected = 0,
  totalPending = 0,
  totalDebtsCount = 0,
  unpaidCount = 0,
  paidCount = 0,
  overdueCount = 0,
}) => {
  // Filters
  const [debtStatusFilter, setDebtStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [debtPeriodFilter, setDebtPeriodFilter] = useState<string>('all');
  const [debtCategoryFilter, setDebtCategoryFilter] = useState<'all' | 'dues' | 'fixture'>('all');
  const [debtSearchQuery, setDebtSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Data
  const [debts, setDebts] = useState<Debt[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<{
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  }>({ total: 0, totalPages: 1, page: 1, limit: 25 });
  const [loading, setLoading] = useState(false);

  // Modal state
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [selectedDebtForCash, setSelectedDebtForCash] = useState<Debt | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { user } = useAuth();
  const activeGroupId = groupId || user?.groupId;

  const fetchDebts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await financeApi.getDebtsPaginated({
        groupId: activeGroupId,
        page,
        limit,
        status: debtStatusFilter,
        category: debtCategoryFilter,
        periodId: debtPeriodFilter !== 'all' ? debtPeriodFilter : undefined,
        search: debtSearchQuery || undefined,
      });
      setDebts(result.data);
      setPaginationMeta({
        total: result.total,
        totalPages: result.totalPages,
        page: result.page,
        limit: result.limit,
      });
    } catch (err) {
      console.error('Borç listesi alınamadı:', err);
    } finally {
      setLoading(false);
    }
  }, [activeGroupId, page, limit, debtStatusFilter, debtCategoryFilter, debtPeriodFilter, debtSearchQuery]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  // Filtre değişimlerinde sayfa 1'e reset
  const resetAndFilter = (fn: () => void) => {
    setPage(1);
    fn();
  };

  // Debounced search
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      setDebtSearchQuery(val);
    }, 400);
  };

  const collectionRate = totalAccrual > 0 ? Math.round((totalCollected / totalAccrual) * 100) : 0;

  // Pagination helpers
  const { total, totalPages } = paginationMeta;
  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('ellipsis');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="animate-fade-in">
      <AdminModuleCard
        title="Borç & Tahakkuk Listesi"
        subtitle="Dairelerin geçmiş ve güncel aidat borçları, %5 yasal gecikme faizi ve elden nakit tahsilat"
        icon={Receipt}
        badgeText={`${total || totalDebtsCount} Borç Kaydı (Canlı DB)`}
      >
        <div className="space-y-4">
          {/* 1. Özet İstatistik Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pb-3 border-b border-slate-100">
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Toplam Tahakkuk
              </span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                {totalAccrual.toLocaleString('tr-TR')} ₺
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {totalDebtsCount} bağımsız aidat/demirbaş borç kaydı
              </span>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-lg p-3">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                Tahsil Edilen Aidat
              </span>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">
                {totalCollected.toLocaleString('tr-TR')} ₺
              </div>
              <span className="text-[10px] text-emerald-600 font-medium mt-1 block">
                %{collectionRate} Tahsilat · {paidCount} Daire Borcunu Kapattı
              </span>
            </div>

            <div className="bg-rose-50/60 border border-rose-200/80 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">
                  Kalan Alacak / Gecikme
                </span>
                {overdueCount > 0 && (
                  <span className="text-[10px] bg-rose-200 text-rose-800 font-bold px-1.5 rounded">
                    {overdueCount} Gecikmiş
                  </span>
                )}
              </div>
              <div className="text-xl font-bold font-mono text-rose-700 mt-0.5">
                {totalPending.toLocaleString('tr-TR')} ₺
              </div>
              <span className="text-[10px] text-rose-600 font-medium mt-1 block">
                {unpaidCount} Daire Bekliyor (KMK %5 Faiz Dahil)
              </span>
            </div>
          </div>

          {/* 2. Filtreleme ve Arama Araç Çubuğu */}
          <div className="flex flex-col gap-2.5 bg-slate-50/70 p-2.5 rounded-lg border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {/* Durum Filtre Butonları */}
              <div className="flex items-center bg-white p-0.5 rounded border border-slate-200 text-xs font-semibold flex-wrap">
                <button
                  type="button"
                  onClick={() => resetAndFilter(() => setDebtStatusFilter('all'))}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    debtStatusFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tümü ({totalDebtsCount})
                </button>
                <button
                  type="button"
                  onClick={() => resetAndFilter(() => setDebtStatusFilter('unpaid'))}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    debtStatusFilter === 'unpaid'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bekleyenler ({unpaidCount})
                </button>
                <button
                  type="button"
                  onClick={() => resetAndFilter(() => setDebtStatusFilter('paid'))}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    debtStatusFilter === 'paid'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Ödenenler ({paidCount})
                </button>
              </div>

              {/* Elden Nakit Tahsilat Butonu */}
              <button
                type="button"
                onClick={() => {
                  setSelectedDebtForCash(null);
                  setIsCashModalOpen(true);
                }}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <DollarSign size={13} />
                <span>💵 Elden Nakit Tahsilat Girişi Yap</span>
              </button>
            </div>

            {/* Kategori Filtresi & Dönem & Arama */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
              {/* Kategori Filtresi */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[11px] font-bold text-slate-500 mr-1">Tür:</span>
                <button
                  type="button"
                  onClick={() => resetAndFilter(() => setDebtCategoryFilter('all'))}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                    debtCategoryFilter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  Tümü
                </button>
                <button
                  type="button"
                  onClick={() => resetAndFilter(() => setDebtCategoryFilter('dues'))}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                    debtCategoryFilter === 'dues'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  🏢 Rutin Aidat (Kiracı)
                </button>
                <button
                  type="button"
                  onClick={() => resetAndFilter(() => setDebtCategoryFilter('fixture'))}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                    debtCategoryFilter === 'fixture'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  🛠️ Demirbaş (Ev Sahibi)
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Dönem Filtresi */}
                <select
                  value={debtPeriodFilter}
                  onChange={(e) => resetAndFilter(() => setDebtPeriodFilter(e.target.value))}
                  className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="all">Tüm Dönemler</option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                {/* Arama Input */}
                <div className="relative flex-1 sm:w-48">
                  <Search
                    size={13}
                    className="text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Daire veya sakin ara..."
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded pl-7 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Borç Listesi Tablosu */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            {/* Loading overlay */}
            {loading && (
              <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-xs font-medium">Yükleniyor...</span>
              </div>
            )}
            {!loading && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Daire</th>
                    <th className="py-2.5 px-3">Sakin / Sorumlu</th>
                    <th className="py-2.5 px-3">Dönem &amp; Tür</th>
                    <th className="py-2.5 px-3">Vade Tarihi</th>
                    <th className="py-2.5 px-3">Borç Tutarı (₺)</th>
                    <th className="py-2.5 px-3">Durum &amp; Gecikme</th>
                    <th className="py-2.5 px-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {debts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        Seçilen kriterlere uygun borç kaydı bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    debts.map((d) => {
                      const isPaid = d.status === 'paid';
                      const lateFee = (d as any).lateFee || 0;
                      const overdueDays = (d as any).overdueDays || 0;
                      const totalWithLate = (d as any).totalWithLateFee || Number(d.amount);
                      const payment =
                        (d as any).payments && (d as any).payments.length > 0
                          ? (d as any).payments[0]
                          : null;

                      return (
                        <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                              {d.unit}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">
                              {d.residentName || 'Sakin Atanmadı'}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {d.category === 'fixture' || (d as any).targetRole === 'owner'
                                ? 'Kat Maliki'
                                : 'Kiracı / İkamet'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-800">{d.title}</div>
                            <span
                              className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                d.category === 'fixture'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}
                            >
                              {d.category === 'fixture' ? '🛠️ Demirbaş' : '🏢 Rutin Aidat'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {new Date(d.dueDate).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-mono font-bold text-slate-900 text-sm">
                              {lateFee > 0
                                ? Number(totalWithLate).toLocaleString('tr-TR')
                                : Number(d.amount).toLocaleString('tr-TR')}{' '}
                              ₺
                            </div>
                            {lateFee > 0 && !isPaid && (
                              <div className="text-[10px] text-rose-600 font-bold">
                                Asıl: {Number(d.amount).toLocaleString('tr-TR')} ₺ + %5 Faiz: +{lateFee} ₺
                              </div>
                            )}
                            {isPaid && (
                              <div className="text-[10px] text-emerald-600 font-medium">Ödendi</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {isPaid ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check size={11} /> Ödendi
                                </span>
                                {payment && (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                                        payment.channel === 'credit_card'
                                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                                          : payment.channel === 'bank_transfer'
                                          ? 'bg-teal-50 text-teal-800 border-teal-200'
                                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      }`}
                                    >
                                      {payment.channel === 'credit_card'
                                        ? '💳 Kredi Kartı'
                                        : payment.channel === 'bank_transfer'
                                        ? '🏦 FAST / Havale'
                                        : '💵 Nakit Kasa'}
                                    </span>
                                    {payment.receiptUrl && (
                                      <button
                                        type="button"
                                        onClick={() => openReceiptInNewTab(payment.receiptUrl)}
                                        className="text-[10px] font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer inline-flex items-center gap-0.5"
                                        title="Yüklenen Dekontu Yeni Sekmede Aç"
                                      >
                                        <ExternalLink size={10} />
                                        <span>Dekont</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : lateFee > 0 ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  <AlertCircle size={10} /> {overdueDays} Gün Gecikti
                                </span>
                                <div className="text-[10px] text-rose-600 font-semibold">
                                  +%5 KMK Faizi İşlendi
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock size={11} /> Ödeme Bekliyor
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {!isPaid ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDebtForCash(d);
                                  setIsCashModalOpen(true);
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded transition-colors cursor-pointer shadow-2xs"
                              >
                                💵 Nakit Al
                              </button>
                            ) : (
                              <div className="space-y-0.5 text-right">
                                <span className="text-[11px] text-slate-700 font-medium block font-mono">
                                  {d.paidDate
                                    ? new Date(d.paidDate).toLocaleDateString('tr-TR')
                                    : 'Ödendi'}
                                </span>
                                {payment?.referenceNo && (
                                  <span className="text-[10px] text-slate-400 font-mono block">
                                    {payment.referenceNo}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* 4. Pagination Bar */}
          {!loading && totalPages > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              {/* Sol: Kayıt bilgisi + Sayfa başına göster */}
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="font-medium">
                  {total === 0
                    ? 'Kayıt bulunamadı'
                    : `${startRecord}–${endRecord} / ${total} kayıt`}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Sayfa başına:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                  >
                    {PAGE_SIZE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sağ: Sayfa navigasyon butonları */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  {/* İlk sayfa */}
                  <button
                    type="button"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="İlk Sayfa"
                  >
                    <ChevronLeft size={10} />
                    <ChevronLeft size={10} className="-ml-2" />
                  </button>

                  {/* Önceki sayfa */}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Önceki Sayfa"
                  >
                    <ChevronLeft size={13} />
                  </button>

                  {/* Sayfa numaraları */}
                  {getPageNumbers().map((p, idx) =>
                    p === 'ellipsis' ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-7 h-7 flex items-center justify-center text-slate-400 text-xs"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p as number)}
                        className={`w-7 h-7 flex items-center justify-center rounded text-xs font-semibold border transition-colors cursor-pointer ${
                          page === p
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                  {/* Sonraki sayfa */}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Sonraki Sayfa"
                  >
                    <ChevronRight size={13} />
                  </button>

                  {/* Son sayfa */}
                  <button
                    type="button"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Son Sayfa"
                  >
                    <ChevronRight size={10} />
                    <ChevronRight size={10} className="-ml-2" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </AdminModuleCard>

      {/* Elden Nakit Tahsilat Giriş Modalı */}
      <CashCollectionModal
        isOpen={isCashModalOpen}
        onClose={() => {
          setIsCashModalOpen(false);
          setSelectedDebtForCash(null);
        }}
        selectedDebt={selectedDebtForCash}
        onRecordCash={async (params) => {
          await onRecordCash(params);
          await fetchDebts();
        }}
      />
    </div>
  );
};
