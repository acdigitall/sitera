import React, { useState, useMemo } from 'react';
import { Debt, Period } from '@sitera/shared';
import {
  Receipt,
  DollarSign,
  Search,
  Check,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { AdminModuleCard } from '../../../components/common/AdminModuleCard';
import { CashCollectionModal } from './CashCollectionModal';
import { openReceiptInNewTab } from '../finance.api';

export interface AdminDebtsViewProps {
  debts: Debt[];
  periods?: Period[];
  onRecordCash: (params: {
    debtId?: string;
    unit: string;
    amount: number;
    residentName?: string;
    notes?: string;
  }) => Promise<any>;
}

export const AdminDebtsView: React.FC<AdminDebtsViewProps> = ({
  debts,
  periods = [],
  onRecordCash,
}) => {
  const [debtSearchQuery, setDebtSearchQuery] = useState('');
  const [debtStatusFilter, setDebtStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [debtPeriodFilter, setDebtPeriodFilter] = useState<string>('all');
  const [debtCategoryFilter, setDebtCategoryFilter] = useState<'all' | 'dues' | 'fixture'>('all');

  // Modal state
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [selectedDebtForCash, setSelectedDebtForCash] = useState<Debt | null>(null);

  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      const matchesSearch =
        d.unit.toLowerCase().includes(debtSearchQuery.toLowerCase()) ||
        (d.residentName && d.residentName.toLowerCase().includes(debtSearchQuery.toLowerCase())) ||
        d.title.toLowerCase().includes(debtSearchQuery.toLowerCase());

      const matchesStatus =
        debtStatusFilter === 'all'
          ? true
          : debtStatusFilter === 'paid'
          ? d.status === 'paid'
          : d.status !== 'paid';

      const matchesPeriod =
        debtPeriodFilter === 'all'
          ? true
          : d.periodId === debtPeriodFilter ||
            d.title.toLowerCase().includes(debtPeriodFilter.toLowerCase());

      const matchesCategory =
        debtCategoryFilter === 'all'
          ? true
          : debtCategoryFilter === 'fixture'
          ? d.category === 'fixture' || (d as any).targetRole === 'owner'
          : d.category === 'dues' || (d as any).targetRole === 'resident' || !d.category;

      return matchesSearch && matchesStatus && matchesPeriod && matchesCategory;
    });
  }, [debts, debtSearchQuery, debtStatusFilter, debtPeriodFilter, debtCategoryFilter]);

  const totalAccrual = debts.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalCollected = debts.reduce((sum, d) => sum + Number(d.paidAmount), 0);
  const totalPending = debts
    .filter((d) => d.status !== 'paid')
    .reduce(
      (sum, d) =>
        sum + (Number((d as any).totalWithLateFee || d.amount) - Number(d.paidAmount)),
      0
    );
  const collectionRate = totalAccrual > 0 ? Math.round((totalCollected / totalAccrual) * 100) : 0;
  const unpaidCount = debts.filter((d) => d.status !== 'paid').length;
  const paidCount = debts.filter((d) => d.status === 'paid').length;
  const overdueCount = debts.filter((d) => (d as any).lateFee > 0 || d.status === 'overdue').length;

  return (
    <div className="animate-fade-in">
      <AdminModuleCard
        title="Borç & Tahakkuk Listesi"
        subtitle="Dairelerin geçmiş ve güncel aidat borçları, %5 yasal gecikme faizi ve elden nakit tahsilat"
        icon={Receipt}
        badgeText={`${debts.length} Borç Kaydı (Canlı DB)`}
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
                {debts.length} bağımsız aidat/demirbaş borç kaydı
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
                  onClick={() => setDebtStatusFilter('all')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    debtStatusFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tümü ({debts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDebtStatusFilter('unpaid')}
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
                  onClick={() => setDebtStatusFilter('paid')}
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
                  onClick={() => setDebtCategoryFilter('all')}
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
                  onClick={() => setDebtCategoryFilter('dues')}
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
                  onClick={() => setDebtCategoryFilter('fixture')}
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
                  onChange={(e) => setDebtPeriodFilter(e.target.value)}
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
                    value={debtSearchQuery}
                    onChange={(e) => setDebtSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded pl-7 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Borç Listesi Tablosu */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
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
                {filteredDebts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      Seçilen kriterlere uygun borç kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredDebts.map((d) => {
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
          </div>
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
        onRecordCash={onRecordCash}
      />
    </div>
  );
};
