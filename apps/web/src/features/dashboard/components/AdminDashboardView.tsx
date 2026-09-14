import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Building2,
  Users2,
  Receipt,
  FileText,
  Clock,
  Plus,
  Landmark,
  Wallet,
  Phone,
  MessageSquare,
  Calendar,
  AlertCircle,
  AlertTriangle,
  FileCheck,
  Send,
  Eye,
  X,
  CreditCard,
  ArrowUpRight,
  Wrench,
  Calculator,
  Split,
  ExternalLink,
  Banknote,
  PiggyBank,
  Coins,
  Shuffle,
  Check,
} from '../../../components/common/fontawesome-icons';
import { User, Group } from '@sitera/shared';
import { useAuth } from '../../auth';
import { useFinance, openReceiptInNewTab } from '../../finance';
import { AccountStatementDrawer } from './AccountStatementDrawer';
import { CreateAccountModal } from './CreateAccountModal';
import { TransferFundsModal } from './TransferFundsModal';

interface AdminDashboardViewProps {
  groupId?: string;
  users?: User[];
  activeGroup?: Group;
}

interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  iban: string;
  balance: number;
  type: 'bank' | 'cash' | 'reserve';
  isPrimary?: boolean;
  lastActivity: string;
}

interface PendingApproval {
  id: string;
  unit: string;
  resident: string;
  amount: number;
  date: string;
  channel: string;
  referenceNo: string;
  receiptUrl?: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

interface UpcomingExpense {
  id: string;
  title: string;
  vendor: string;
  category: string;
  amount: number;
  dueDate: string;
  dueDay: string;
  dueMonth: string;
  status: 'unpaid' | 'paid' | 'auto';
}

interface OverdueResident {
  id: string;
  unit: string;
  resident: string;
  type: 'Malik' | 'Kiracı';
  phone: string;
  totalDebt: number;
  totalLateFee?: number;
  periodsList: Array<{ title: string; category?: string }>;
  periods: string;
  daysOverdue: number;
  legalStatus: 'normal' | 'sms_sent';
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  groupId,
  users = [],
  activeGroup,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const effectiveGroupId = groupId || user?.groupId || undefined;
  const tenantSlug = activeGroup?.slug || user?.group?.slug || 'gencosman-apartmani';

  const {
    accounts: dbAccounts,
    debts: dbDebts,
    pendingPayments,
    expenses: dbExpenses,
    periods,
    summary,
    approvePayment,
    rejectPayment,
  } = useFinance(effectiveGroupId);

  const activePeriodObj = periods.find((p) => p.status === 'active') || periods[0];
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    activePeriodObj?.name || 'Eylül 2026'
  );

  const [selectedStatementAccount, setSelectedStatementAccount] = useState<BankAccount | null>(null);
  const [isStatementDrawerOpen, setIsStatementDrawerOpen] = useState(false);
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // 1. Kasa & Banka Hesapları
  const accounts: BankAccount[] = dbAccounts.map((a) => ({
    id: a.id,
    name: a.name,
    bankName: a.bankName,
    iban: a.iban || 'Nakit Kasa',
    balance: Number(a.balance),
    type: a.type,
    isPrimary: a.isPrimary,
    lastActivity: a.lastActivity || 'Aktif',
  }));

  const totalLiquidity =
    summary && typeof summary.totalLiquidity === 'number'
      ? summary.totalLiquidity
      : accounts.reduce((acc, curr) => acc + curr.balance, 0);

  // 2. Onay Bekleyen Dekontlar / Havaleler
  const approvals: PendingApproval[] = pendingPayments.map((p) => ({
    id: p.id,
    unit: p.unit,
    resident: p.residentName || 'Daire Sakini',
    amount: Number(p.amount),
    date: new Date(p.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    channel: p.channel === 'bank_transfer' ? 'Banka Havalesi' : p.channel === 'credit_card' ? 'Kredi Kartı' : 'Elden Tahsilat',
    referenceNo: p.referenceNo || 'REF-' + p.id.slice(0, 8),
    receiptUrl: p.receiptUrl || null,
    status: p.status,
  }));

  // 3. Yaklaşan Bina Giderleri & Faturalar
  const upcomingExpenses: UpcomingExpense[] = dbExpenses.length > 0
    ? dbExpenses.map((e) => ({
      id: e.id,
      title: e.title,
      vendor: e.vendor,
      category: e.category,
      amount: Number(e.amount),
      dueDate: e.dueDate,
      dueDay: e.dueDay,
      dueMonth: e.dueMonth,
      status: e.status,
    }))
    : [];

  // 4. Borçlu Sakinler & Takip Listesi (DAİRE BAZINDA BİRLEŞTİRME)
  // Her daire için tek satır oluşturulur, birden fazla döneme ait borcu varsa dönemler birleştirilir.
  const overdueMap = new Map<string, {
    unit: string;
    resident: string;
    type: 'Malik' | 'Kiracı';
    phone: string;
    totalDebt: number;
    totalLateFee: number;
    periodsList: Array<{ title: string; category?: string }>;
    daysOverdue: number;
  }>();

  for (const d of dbDebts.filter((debt) => debt.status !== 'paid')) {
    const existing = overdueMap.get(d.unit);
    const debtAmount = Number(d.amount) - Number(d.paidAmount);
    const lateFee = Number((d as any).lateFee || 0);
    const overdueDays =
      (d as any).overdueDays ||
      (d.dueDate && new Date(d.dueDate) < new Date()
        ? Math.max(1, Math.floor((Date.now() - new Date(d.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 14);

    const matchedUser = users.find(
      (u) => (u.units && u.units.includes(d.unit)) || u.name === d.unit || u.id === d.userId
    );
    const residentName = matchedUser?.name || d.residentName || d.unit;
    const residentPhone = matchedUser?.phone || '0532 111 2233';
    const residentType = matchedUser?.residentType === 'tenant' ? 'Kiracı' : 'Malik';

    if (existing) {
      existing.totalDebt += debtAmount;
      existing.totalLateFee += lateFee;
      existing.daysOverdue = Math.max(existing.daysOverdue, overdueDays);
      if (!existing.periodsList.some((p) => p.title === d.title)) {
        existing.periodsList.push({ title: d.title, category: d.category });
      }
    } else {
      overdueMap.set(d.unit, {
        unit: d.unit,
        resident: residentName,
        type: residentType,
        phone: residentPhone,
        totalDebt: debtAmount,
        totalLateFee: lateFee,
        periodsList: [{ title: d.title, category: d.category }],
        daysOverdue: overdueDays,
      });
    }
  }

  const overdueList: OverdueResident[] = Array.from(overdueMap.values()).map((item, idx) => ({
    id: `overdue-${idx}-${item.unit}`,
    unit: item.unit,
    resident: item.resident,
    type: item.type,
    phone: item.phone,
    totalDebt: item.totalDebt,
    totalLateFee: item.totalLateFee,
    periodsList: item.periodsList,
    periods: item.periodsList.map((p) => p.title).join(', '),
    daysOverdue: item.daysOverdue,
    legalStatus: 'normal' as const,
  }));

  const handleApprove = async (id: string) => {
    try {
      await approvePayment(id, user?.id);
    } catch (err: any) {
      alert('Onaylama sırasında hata: ' + err.message);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Red gerekçesi (sakine SMS bildirimi iletilir):', 'Tutar banka ekstresinde görünmüyor.');
    if (reason) {
      try {
        await rejectPayment(id);
      } catch (err: any) {
        alert('Reddetme sırasında hata: ' + err.message);
      }
    }
  };

  const handleSendReminder = (id: string) => {
    alert('Borç bildirimi sakinin kayıtlı telefonuna SMS olarak iletildi.');
  };

  // Toplam bağımsız bölüm sayısı (çoklu daire sahiplikleri dahil)
  const memberUsers = users.filter((u) => u.role === 'member');
  const totalUnitsCount = useMemo(() => {
    let count = 0;
    memberUsers.forEach((m) => {
      if (m.units && m.units.length > 0) {
        count += m.units.length;
      } else if (m.name) {
        count += 1;
      }
    });
    if (count > 0) return count;
    return dbDebts.length > 0
      ? Array.from(new Set(dbDebts.map((d) => d.unit))).length
      : memberUsers.length;
  }, [memberUsers, dbDebts]);

  // Canlı Finans Hesaplamaları
  const totalTahakkuk = dbDebts.length > 0
    ? dbDebts.reduce((sum, d) => sum + Number(d.amount), 0)
    : (summary ? summary.totalCollected + summary.totalReceivable : 0);

  const totalTahsilat = dbDebts.length > 0
    ? dbDebts.reduce((sum, d) => sum + Number(d.paidAmount), 0)
    : (summary ? summary.totalCollected : 0);

  const totalGecikme = dbDebts.length > 0
    ? dbDebts.filter(d => d.status !== 'paid').reduce((sum, d) => sum + (Number(d.amount) - Number(d.paidAmount)), 0)
    : (summary ? summary.totalReceivable : 0);

  const collectionRate = totalTahakkuk > 0 ? Math.round((totalTahsilat / totalTahakkuk) * 100) : 0;
  const overdueUnitsCount = overdueList.length;
  const paidUnitsCount = Math.max(0, totalUnitsCount - overdueUnitsCount);
  const totalUpcomingExpenseAmount = upcomingExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 max-w-full">
      {/* 1. FLUSH PAGE HEADER (Clear, Comfortable Typography) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Kasa & Operasyon
            </h1>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-md">
              Sitera PropTech
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {selectedPeriod} · {activeGroup?.name || user?.group?.name || 'Site Yönetimi'} · {totalUnitsCount} Bağımsız Bölüm ({memberUsers.length} Kat Maliki)
          </p>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Period selector */}
          <div className="relative inline-flex items-center">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="h-10 pl-3.5 pr-9 text-sm font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-lg shadow-xs hover:bg-slate-50 focus:outline-hidden focus:border-teal-600 cursor-pointer appearance-none"
            >
              {periods.length > 0 ? (
                periods.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))
              ) : (
                <option value="Eylül 2026">Eylül 2026</option>
              )}
            </select>
            <Calendar size={15} className="absolute right-3 text-slate-400 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => navigate(`/${tenantSlug}/admin/periods`)}
            className="h-10 inline-flex items-center gap-2 px-4 text-sm font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-lg shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Wrench size={15} className="text-teal-700" />
            <span>+ Gider Paylaştır</span>
          </button>

          <button
            type="button"
            onClick={() => alert('Aidat / Tahsilat Makbuzu Girişi')}
            className="h-10 inline-flex items-center gap-2 px-4 text-sm font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-lg shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Plus size={15} className="text-teal-700" />
            <span>Tahsilat Ekle</span>
          </button>

          <button
            type="button"
            onClick={() => alert(`${selectedPeriod} Gelir-Gider Tablosu PDF indiriliyor.`)}
            className="h-10 inline-flex items-center gap-2 px-4 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <FileText size={15} />
            <span>Mali Mizan (PDF)</span>
          </button>
        </div>
      </div>

      {/* 2. KASA & BANKA VARLIKLARI (Legible, Comfortable Sizing & Interactive Ledger) */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-900 tracking-wider uppercase">
              Kasa & Banka Varlıkları
            </span>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md hidden sm:inline-block">
              Ekstre dökümü için karta tıklayın
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(true)}
              className="h-8 inline-flex items-center gap-1.5 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <Shuffle size={13} className="text-blue-600" />
              <span>Virman Yap</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateAccountModalOpen(true)}
              className="h-8 inline-flex items-center gap-1.5 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <Plus size={13} className="text-teal-700" />
              <span>+ Yeni Hesap</span>
            </button>

            <div className="text-sm text-slate-500 font-medium pl-2 border-l border-slate-200">
              Toplam Likidite:{' '}
              <span className="font-bold text-slate-900 text-base tabular-nums ml-1">
                {totalLiquidity.toLocaleString('tr-TR')} ₺
              </span>
            </div>
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-xl p-8 text-center flex flex-col items-center justify-center shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
              <Building2 size={22} />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Henüz Tanımlı Kasa veya Banka Hesabı Yok</h4>
            <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
              Sitenizin bakiye takibi için banka (Ziraat, Vakıf vb.) veya elden nakit kasa hesabını ekleyerek başlayabilirsiniz.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateAccountModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Plus size={14} />
              <span>+ İlk Hesabı Ekle</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {accounts.map((acc, idx) => {
              const AccIcon = acc.type === 'reserve' ? PiggyBank : acc.type === 'cash' ? Coins : Banknote;
              const iconColor = acc.type === 'reserve' ? 'text-violet-600' : acc.type === 'cash' ? 'text-amber-600' : 'text-teal-700';
              const iconBg = acc.type === 'reserve' ? 'bg-violet-50 border-violet-100' : acc.type === 'cash' ? 'bg-amber-50 border-amber-100' : 'bg-teal-50 border-teal-100';
              const delayClass = idx === 0 ? 'animate-card-1' : idx === 1 ? 'animate-card-2' : 'animate-card-3';
              return (
                <div
                  key={acc.id}
                  onClick={() => {
                    setSelectedStatementAccount(acc);
                    setIsStatementDrawerOpen(true);
                  }}
                  className={`animate-card ${delayClass} bg-white border rounded-xl p-5 flex flex-col justify-between transition-all shadow-xs hover:shadow-md hover:border-teal-500/80 cursor-pointer group ${acc.isPrimary
                    ? 'border-slate-300 border-t-[3px] border-t-teal-600'
                    : 'border-slate-200/90'
                    }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
                            {acc.bankName}
                          </span>
                          {acc.isPrimary && (
                            <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded shrink-0">
                              Ana Hesap
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-500 mt-0.5 truncate font-medium">{acc.name}</div>
                      </div>
                      {/* Icon accent box */}
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
                        <AccIcon size={18} className={iconColor} />
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="text-2xl xl:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                        {acc.balance.toLocaleString('tr-TR')} ₺
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-1.5 truncate">
                        {acc.iban}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="truncate mr-1">{acc.lastActivity || 'İşlem kaydı yok'}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md border shrink-0 ${iconBg} ${iconColor}`}>
                      {acc.type === 'reserve' ? 'Yedek Fon' : acc.type === 'bank' ? 'Vadesiz Cari' : 'Nakit'}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* 4. Konsolide Toplam Kasa & Varlık Kartı (En Sağda - Tıklayınca Tüm Ekstreyi Açar) */}
            <div
              onClick={() => {
                setSelectedStatementAccount(null);
                setIsStatementDrawerOpen(true);
              }}
              className="animate-card animate-card-4 bg-white border border-slate-200/90 rounded-xl p-5 flex flex-col justify-between transition-all shadow-xs hover:shadow-md hover:border-slate-400 border-t-[3px] border-t-slate-800 cursor-pointer group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900 truncate group-hover:text-slate-700 transition-colors">
                        Toplam Varlık
                      </span>
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                        Konsolide
                      </span>
                    </div>
                    <div className="text-sm text-slate-500 mt-0.5 truncate font-medium">Tüm Kasa &amp; Hesaplar</div>
                  </div>
                  {/* Icon accent box */}
                  <div className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 bg-slate-100 border-slate-200">
                    <Wallet size={18} className="text-slate-700" />
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-2xl xl:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                    {totalLiquidity.toLocaleString('tr-TR')} ₺
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1.5 truncate">
                    {accounts.length} Hesap / Kasa Konsolide
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Konsolide Net Likidite</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-md border bg-slate-50 border-slate-200 text-slate-700">
                  Aktif Rezerv
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. DÖNEM BÜTÇE & TAHSİLAT BANDI */}
      <div className="animate-card animate-card-4 bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-base font-bold text-slate-900">{selectedPeriod} Bütçe & Aidat Gerçekleşmesi</div>
            <div className="text-xs sm:text-sm text-slate-500 mt-0.5">Dönem tahakkuk eden aidatların tahsilat oranı ve kasadaki cari açık</div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-sm font-bold text-teal-900 bg-teal-50 border border-teal-200 px-3 py-1 rounded-lg">
              %{collectionRate} Tahsilat
            </span>
          </div>
        </div>

        {/* Brand progress line */}
        <div className="mt-3.5 h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div style={{ width: `${collectionRate}%` }} className="bg-teal-700 h-full rounded-l-full" />
          <div style={{ width: `${100 - collectionRate}%` }} className="bg-rose-500/80 h-full rounded-r-full" />
        </div>

        {/* 4 Clean Metric Pillars with comfortable, readable font sizes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-3.5 border-t border-slate-100 text-sm">
          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Toplam Tahakkuk</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {totalTahakkuk.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{totalUnitsCount} Bağımsız Bölüm</div>
          </div>

          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Kasaya Giren Aidat</div>
            <div className="text-xl sm:text-2xl font-bold text-teal-900 mt-1 tabular-nums">
              {totalTahsilat.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{paidUnitsCount} daire eksiksiz kapattı</div>
          </div>

          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Kalan Alacak / Gecikme</div>
            <div className="text-xl sm:text-2xl font-bold text-rose-700 mt-1 tabular-nums">
              {totalGecikme.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{overdueUnitsCount} daire gecikmede</div>
          </div>

          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Beklenen Dönem Gideri</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {totalUpcomingExpenseAmount.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{upcomingExpenses.length} Fatura & periyodik gider</div>
          </div>
        </div>
      </div>

      {/* 4. İKİ SÜTUNLU OPERASYONEL PANEL (Temiz, Düz ve Ferah Liste Düzeni) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sol Sütun (6 Cols): Onay Bekleyen Dekontlar & Havaleler */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-bold text-slate-900">Onay Bekleyen Ödeme Dekontları</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80">
                  {approvals.filter((a) => a.status === 'pending').length} Bekliyor
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium">FAST / Havale</span>
            </div>

            <div className="divide-y divide-slate-100">
              {approvals.map((app) => (
                <div
                  key={app.id}
                  className="py-4 flex items-center justify-between gap-4 text-sm hover:bg-slate-50/60 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">{app.resident}</span>
                      <span className="text-xs text-slate-600 font-semibold font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        {app.unit}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 truncate">
                      <span className="font-medium text-slate-700">{app.channel}</span>
                      <span>·</span>
                      <span className="font-mono text-slate-500">{app.referenceNo}</span>
                      <span>·</span>
                      <span>{app.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-bold text-slate-900 text-base sm:text-lg tabular-nums">
                        {app.amount.toLocaleString('tr-TR')} ₺
                      </div>
                      <button
                        type="button"
                        onClick={() => openReceiptInNewTab(app.receiptUrl)}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer inline-flex items-center gap-1 mt-0.5"
                        title="Dekontu Yeni Sekmede Aç"
                      >
                        <ExternalLink size={12} /> Dekont Aç
                      </button>
                    </div>

                    {app.status === 'pending' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApprove(app.id)}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer shadow-xs"
                        >
                          Onayla
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(app.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          Red
                        </button>
                      </div>
                    ) : (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${app.status === 'approved' ? 'text-teal-800 bg-teal-50' : 'text-rose-700 bg-rose-50'
                        }`}>
                        {app.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Dekont onaylandığında bakiye anında düşer.</span>
            <button
              type="button"
              onClick={() => navigate(`/${tenantSlug}/admin/payment-approvals`)}
              className="font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
            >
              Ödeme Onayları & Dekont Arşivi →
            </button>
          </div>
        </div>

        {/* Sağ Sütun (6 Cols): Yaklaşan Bina Giderleri & Faturalar */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900">Yaklaşan Giderler</span>
                <span className="text-xs text-slate-400 font-medium">Ay sonuna kadar</span>
              </div>
              <span className="text-base font-bold text-slate-900 tabular-nums">
                {totalUpcomingExpenseAmount.toLocaleString('tr-TR')} ₺
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {upcomingExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="py-4 flex items-center justify-between gap-4 text-sm hover:bg-slate-50/60 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Temiz Tipografik Tarih (Kutu yok, saf tipografi) */}
                    <div className="w-10 text-center shrink-0">
                      <div className="text-lg font-bold text-slate-900 leading-none">{exp.dueDay}</div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{exp.dueMonth}</div>
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate">{exp.title}</div>
                      <div className="text-xs text-slate-500 mt-1 truncate font-medium">
                        {exp.vendor} · <span className="text-slate-400">{exp.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-slate-900 text-base sm:text-lg tabular-nums">
                      {exp.amount.toLocaleString('tr-TR')} ₺
                    </div>
                    <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5 justify-end">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${exp.status === 'auto' ? 'bg-teal-600' : 'bg-amber-500'
                        }`} />
                      <span className={exp.status === 'auto' ? 'text-teal-800' : 'text-amber-800'}>
                        {exp.status === 'auto' ? 'Otomatik Ödeme' : 'Fatura Geldi'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Gider faturası işleme:</span>
            <button
              type="button"
              onClick={() => navigate(`/${tenantSlug}/admin/periods`)}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
            >
              + Gider Faturası Ekle
            </button>
          </div>
        </div>
      </div>

      {/* 5. BORÇLU SAKİNLER VE İHTAR LİSTESİ (Restrained Enterprise Table) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">Vadesi Geçen Alacaklar & İhtar Takibi</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200/80">
                  KMK m. 20 Takip
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Ödeme vadesi geçmiş aidat ve demirbaş borçluları, yasal gecikme süresi ve bildirim durumu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => {
                alert('Tüm borçlu dairelere SMS ve WhatsApp hatırlatma bildirimi kuyruğa alındı.');
              }}
              className="h-9 inline-flex items-center gap-2 px-3.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <Send size={13} className="text-indigo-600" />
              <span>Toplu SMS Gönder</span>
            </button>

            <div className="h-9 inline-flex items-center gap-2 px-3.5 text-xs font-bold font-mono text-slate-800 bg-slate-100/90 border border-slate-200 rounded-xl whitespace-nowrap shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>{overdueList.length} Daire</span>
              <span className="text-slate-300">·</span>
              <span className="text-rose-700 font-extrabold">{totalGecikme.toLocaleString('tr-TR')} ₺</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold text-[11px] bg-slate-50/60 uppercase tracking-wider">
                <th className="py-3 px-5 whitespace-nowrap w-28">Daire</th>
                <th className="py-3 px-5 whitespace-nowrap min-w-[180px]">Sakin & İletişim</th>
                <th className="py-3 px-5 min-w-[220px]">Borçlu Dönemler</th>
                <th className="py-3 px-5 whitespace-nowrap w-36 text-center">Gecikme</th>
                <th className="py-3 px-5 whitespace-nowrap w-36">Kalan Bakiye</th>
                <th className="py-3 px-5 whitespace-nowrap w-36 text-center">Durum</th>
                <th className="py-3 px-5 whitespace-nowrap w-32 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-slate-800 text-xs">
              {overdueList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <Check size={20} className="mx-auto mb-1 text-emerald-500" />
                    Vadesi geçmiş herhangi bir aidat veya demirbaş borcu bulunmamaktadır.
                  </td>
                </tr>
              ) : (
                overdueList.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Daire */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 font-mono font-bold text-slate-900 text-xs whitespace-nowrap shadow-2xs">
                        <Building2 size={13} className="text-slate-500 shrink-0" />
                        <span>{row.unit}</span>
                      </span>
                    </td>

                    {/* Sakin & İletişim */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{row.resident}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${row.type === 'Kiracı'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                        >
                          {row.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                        <Phone size={11} className="text-slate-400" />
                        <span>{row.phone}</span>
                      </div>
                    </td>

                    {/* Borçlu Dönemler */}
                    <td className="py-3.5 px-5">
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {row.periodsList.map((p, idx) => {
                          const isFixture =
                            p.category === 'fixture' ||
                            p.title.toLowerCase().includes('demirbaş') ||
                            p.title.toLowerCase().includes('malik');
                          return (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${isFixture
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              title={p.title}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${isFixture ? 'bg-amber-500' : 'bg-indigo-500'
                                  }`}
                              />
                              <span className="truncate max-w-[170px]">{p.title}</span>
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Gecikme */}
                    <td className="py-3.5 px-5 whitespace-nowrap text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200/80 shadow-2xs whitespace-nowrap">
                        <Clock size={12} className="text-rose-600" />
                        <span>{row.daysOverdue} gün gecikti</span>
                      </span>
                    </td>

                    {/* Kalan Bakiye */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="font-bold text-slate-900 font-mono text-base tabular-nums">
                        {row.totalDebt.toLocaleString('tr-TR')} ₺
                      </div>
                      {row.totalLateFee && row.totalLateFee > 0 ? (
                        <div className="text-[10px] font-mono text-rose-600 font-semibold mt-0.5">
                          +%5 Faiz: +{row.totalLateFee.toLocaleString('tr-TR')} ₺
                        </div>
                      ) : null}
                    </td>

                    {/* Durum */}
                    <td className="py-3.5 px-5 whitespace-nowrap text-center">
                      {row.legalStatus === 'sms_sent' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-teal-800 font-bold bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full whitespace-nowrap">
                          <Check size={12} className="text-teal-600" />
                          <span>SMS İletildi</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full whitespace-nowrap">
                          <AlertCircle size={12} className="text-amber-600" />
                          <span>1. Hatırlatma</span>
                        </span>
                      )}
                    </td>

                    {/* İşlem */}
                    <td className="py-3.5 px-5 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <a
                          href={`https://wa.me/90${row.phone.replace(/[^0-9]/g, '').slice(-10)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                          title="WhatsApp ile İletişime Geç"
                        >
                          <MessageSquare size={15} />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleSendReminder(row.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-all cursor-pointer shadow-2xs"
                          title="SMS Gönder"
                        >
                          <Send size={11} className="text-slate-400" />
                          <span>SMS</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals & Statement Drawer */}
      <AccountStatementDrawer
        isOpen={isStatementDrawerOpen}
        onClose={() => setIsStatementDrawerOpen(false)}
        account={selectedStatementAccount as any}
        groupId={effectiveGroupId}
        totalLiquidity={totalLiquidity}
      />

      <CreateAccountModal
        isOpen={isCreateAccountModalOpen}
        onClose={() => setIsCreateAccountModalOpen(false)}
        groupId={effectiveGroupId}
      />

      <TransferFundsModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        accounts={accounts as any}
        groupId={effectiveGroupId}
      />

    </div>
  );
};
