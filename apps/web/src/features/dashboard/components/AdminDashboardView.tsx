import React, { useState } from 'react';
import {
  TrendingUp,
  Building2,
  Check,
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
  FileCheck,
  Send,
  Eye,
  X,
  CreditCard,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../../auth';

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
  periods: string;
  daysOverdue: number;
  legalStatus: 'normal' | 'sms_sent';
}

export const AdminDashboardView: React.FC = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('Ağustos 2026');
  const [activeReceiptModal, setActiveReceiptModal] = useState<PendingApproval | null>(null);

  // 1. Kasa & Banka Hesapları
  const [accounts] = useState<BankAccount[]>([
    {
      id: 'acc-1',
      name: 'Ana Aidat Hesabı',
      bankName: 'Ziraat Bankası',
      iban: 'TR42 0001 0090 1234 5678 5001',
      balance: 38450,
      type: 'bank',
      isPrimary: true,
      lastActivity: 'Bugün 14:20 · FAST Girişi',
    },
    {
      id: 'acc-2',
      name: 'Demirbaş & Asansör Fonu',
      bankName: 'Garanti BBVA',
      iban: 'TR18 0006 2000 9876 5432 5002',
      balance: 12800,
      type: 'reserve',
      lastActivity: '15 Ağu · Vadeli Faiz',
    },
    {
      id: 'acc-3',
      name: 'Yönetici Nakit Kasası',
      bankName: 'Nakit Kasa',
      iban: 'Elden Tahsilat & Küçük Cari',
      balance: 2625,
      type: 'cash',
      lastActivity: 'Dün 18:00 · D.9 Nakit Alındı',
    },
  ]);

  const totalLiquidity = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  // 2. Onay Bekleyen Dekontlar / Havaleler
  const [approvals, setApprovals] = useState<PendingApproval[]>([
    {
      id: 'app-1',
      unit: 'A Blok D.7',
      resident: 'Zeynep Çelik',
      amount: 625,
      date: 'Bugün 11:45',
      channel: 'Ziraat FAST',
      referenceNo: 'FST84920192',
      status: 'pending',
    },
    {
      id: 'app-2',
      unit: 'A Blok D.2',
      resident: 'Fatma Demir',
      amount: 1250,
      date: 'Dün 20:10',
      channel: 'İş Bankası Havale',
      referenceNo: 'HAV3391024',
      status: 'pending',
    },
    {
      id: 'app-3',
      unit: 'B Blok D.10',
      resident: 'Onur Yurt',
      amount: 1250,
      date: 'Dün 15:30',
      channel: 'Garanti EFT',
      referenceNo: 'EFT7712034',
      status: 'pending',
    },
  ]);

  // 3. Yaklaşan Bina Giderleri & Faturalar
  const [upcomingExpenses] = useState<UpcomingExpense[]>([
    {
      id: 'exp-1',
      title: 'Asansör Aylık Bakım & Yeşil Etiket',
      vendor: 'KONE Asansör Servisi',
      category: 'Periyodik Bakım',
      amount: 1850,
      dueDate: '25 Ağustos 2026',
      dueDay: '25',
      dueMonth: 'AĞU',
      status: 'unpaid',
    },
    {
      id: 'exp-2',
      title: 'Ortak Alan Elektrik Faturası',
      vendor: 'CK Boğaziçi Elektrik',
      category: 'Abonelik',
      amount: 3420,
      dueDate: '28 Ağustos 2026',
      dueDay: '28',
      dueMonth: 'AĞU',
      status: 'auto',
    },
    {
      id: 'exp-3',
      title: 'Bina Görevlisi Maaş & SGK Primi',
      vendor: 'Personel Gideri',
      category: 'Maaş',
      amount: 6500,
      dueDate: '31 Ağustos 2026',
      dueDay: '31',
      dueMonth: 'AĞU',
      status: 'unpaid',
    },
    {
      id: 'exp-4',
      title: 'Hidrofor & Su Deposu Dezenfeksiyon',
      vendor: 'Arıtma Sistemleri Ltd.',
      category: 'Sıhhi Tesisat',
      amount: 850,
      dueDate: '02 Eylül 2026',
      dueDay: '02',
      dueMonth: 'EYL',
      status: 'unpaid',
    },
  ]);

  // 4. Borçlu Sakinler & Takip Listesi
  const [overdueList, setOverdueList] = useState<OverdueResident[]>([
    {
      id: 'ov-1',
      unit: 'A Blok D.1',
      resident: 'Ahmet Yılmaz',
      type: 'Malik',
      phone: '0532 111 2233',
      totalDebt: 1250,
      periods: 'Ağustos 2026',
      daysOverdue: 16,
      legalStatus: 'normal',
    },
    {
      id: 'ov-2',
      unit: 'A Blok D.4',
      resident: 'Mehmet Kaya',
      type: 'Kiracı',
      phone: '0555 444 5566',
      totalDebt: 1250,
      periods: 'Ağustos 2026',
      daysOverdue: 16,
      legalStatus: 'normal',
    },
    {
      id: 'ov-3',
      unit: 'A Blok D.7',
      resident: 'Zeynep Çelik',
      type: 'Malik',
      phone: '0544 777 8899',
      totalDebt: 625,
      periods: 'Ağustos 2026 (Kısmi Kalan)',
      daysOverdue: 8,
      legalStatus: 'normal',
    },
  ]);

  const handleApprove = (id: string) => {
    setApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'approved' } : item))
    );
  };

  const handleReject = (id: string) => {
    const reason = prompt('Red gerekçesi (sakine SMS bildirimi iletilir):', 'Tutar banka ekstresinde görünmüyor.');
    if (reason) {
      setApprovals((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'rejected' } : item))
      );
    }
  };

  const handleSendReminder = (id: string) => {
    setOverdueList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, legalStatus: 'sms_sent' } : item
      )
    );
    alert('Borç bildirimi sakinin kayıtlı telefonuna SMS olarak iletildi.');
  };

  const totalTahakkuk = 25000;
  const totalTahsilat = 21875;
  const totalGecikme = 3125;
  const collectionRate = 87.5;
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
            {selectedPeriod} · {user?.group?.name || 'Gencosman Apartmanı'} · 16 Bağımsız Bölüm
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
              <option value="Ağustos 2026">Ağustos 2026</option>
              <option value="Temmuz 2026">Temmuz 2026</option>
              <option value="Haziran 2026">Haziran 2026</option>
            </select>
            <Calendar size={15} className="absolute right-3 text-slate-400 pointer-events-none" />
          </div>

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
            onClick={() => alert('Ağustos 2026 Gelir-Gider Tablosu PDF indiriliyor.')}
            className="h-10 inline-flex items-center gap-2 px-4 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <FileText size={15} />
            <span>Mali Mizan (PDF)</span>
          </button>
        </div>
      </div>

      {/* 2. KASA & BANKA VARLIKLARI (Legible, Comfortable Sizing) */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-sm font-bold text-slate-900 tracking-wider uppercase">
            Kasa & Banka Varlıkları
          </div>
          <div className="text-sm text-slate-500 font-medium">
            Toplam Likidite:{' '}
            <span className="font-bold text-slate-900 text-base tabular-nums ml-1">
              {totalLiquidity.toLocaleString('tr-TR')} ₺
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className={`bg-white border rounded-xl p-5 flex flex-col justify-between transition-all shadow-xs hover:border-slate-300 ${
                acc.isPrimary
                  ? 'border-slate-300 border-t-3 border-t-teal-700'
                  : 'border-slate-200/90'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base font-bold text-slate-900 truncate">{acc.bankName}</span>
                    {acc.isPrimary && (
                      <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded shrink-0">
                        Ana Hesap
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-600 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 shrink-0">
                    {acc.type === 'reserve' ? 'Yedek Fon' : acc.type === 'bank' ? 'Vadesiz Cari' : 'Nakit'}
                  </span>
                </div>
                <div className="text-sm text-slate-500 mt-1 truncate font-medium">{acc.name}</div>

                <div className="mt-4">
                  <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                    {acc.balance.toLocaleString('tr-TR')} ₺
                  </div>
                  <div className="text-xs font-mono text-slate-500 mt-1.5 truncate">
                    {acc.iban}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>{acc.lastActivity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. DÖNEM BÜTÇE & TAHSİLAT BANDI */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-base font-bold text-slate-900">Ağustos 2026 Bütçe & Aidat Gerçekleşmesi</div>
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
            <div className="text-xs text-slate-400 mt-0.5">16 Bağımsız Bölüm</div>
          </div>

          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Kasaya Giren Aidat</div>
            <div className="text-xl sm:text-2xl font-bold text-teal-900 mt-1 tabular-nums">
              {totalTahsilat.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-slate-500 mt-0.5">13 daire eksiksiz kapattı</div>
          </div>

          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Kalan Alacak / Gecikme</div>
            <div className="text-xl sm:text-2xl font-bold text-rose-700 mt-1 tabular-nums">
              {totalGecikme.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-slate-500 mt-0.5">3 daire gecikmede</div>
          </div>

          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Beklenen Dönem Gideri</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {totalUpcomingExpenseAmount.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-slate-400 mt-0.5">4 Fatura & periyodik gider</div>
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
                        onClick={() => setActiveReceiptModal(app)}
                        className="text-xs font-medium text-teal-700 hover:text-teal-900 hover:underline cursor-pointer inline-flex items-center gap-1 mt-0.5"
                      >
                        <Eye size={12} /> Dekont Gör
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
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        app.status === 'approved' ? 'text-teal-800 bg-teal-50' : 'text-rose-700 bg-rose-50'
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
              onClick={() => alert('Geçmiş onaylanan dekont arşivine yönlendiriliyorsunuz.')}
              className="font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              Dekont Arşivi →
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
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        exp.status === 'auto' ? 'bg-teal-600' : 'bg-amber-500'
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
              onClick={() => alert('Gider faturası işleme formu')}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
            >
              + Gider Faturası Ekle
            </button>
          </div>
        </div>
      </div>

      {/* 5. BORÇLU SAKİNLER VE İHTAR LİSTESİ (Restrained Enterprise Table) */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-base font-bold text-slate-900">Vadesi Geçen Alacaklar & İhtar Takibi</div>
            <div className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">Ödeme vadesi geçmiş aidat borçluları ve yasal bildirim durumu</div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setOverdueList((prev) =>
                  prev.map((item) => ({ ...item, legalStatus: 'sms_sent' }))
                );
                alert('Tüm borçlu dairelere SMS hatırlatması iletildi.');
              }}
              className="h-9 inline-flex items-center gap-2 px-3.5 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
            >
              <Send size={13} className="text-slate-500" />
              <span>Toplu SMS Gönder</span>
            </button>

            <span className="text-xs sm:text-sm font-bold text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
              3 Daire · {totalGecikme.toLocaleString('tr-TR')} ₺
            </span>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-bold text-xs bg-slate-50/75 uppercase tracking-wider">
                <th className="py-3 px-5">Daire</th>
                <th className="py-3 px-5">Sakin & Telefon</th>
                <th className="py-3 px-5">Dönem</th>
                <th className="py-3 px-5">Gecikme</th>
                <th className="py-3 px-5">Kalan Bakiye</th>
                <th className="py-3 px-5">Durum</th>
                <th className="py-3 px-5 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {overdueList.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/75 transition-colors">
                  <td className="py-3.5 px-5">
                    <span className="font-bold text-slate-900 text-sm sm:text-base bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                      {row.unit}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="font-bold text-slate-900 text-sm sm:text-base">{row.resident}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{row.type} · {row.phone}</div>
                  </td>
                  <td className="py-3.5 px-5 text-sm font-medium text-slate-700">{row.periods}</td>
                  <td className="py-3.5 px-5">
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-md">
                      {row.daysOverdue} gün
                    </span>
                  </td>
                  <td className="py-3.5 px-5 font-bold text-slate-900 text-base sm:text-lg tabular-nums">
                    {row.totalDebt.toLocaleString('tr-TR')} ₺
                  </td>
                  <td className="py-3.5 px-5">
                    {row.legalStatus === 'sms_sent' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded">
                        <Check size={13} className="text-teal-700" /> SMS İletildi
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">1. Hatırlatma</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <a
                        href={`https://wa.me/90${row.phone.replace(/[^0-9]/g, '').slice(-10)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="WhatsApp'tan Yaz"
                      >
                        <MessageSquare size={16} />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleSendReminder(row.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer shadow-xs"
                      >
                        SMS
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. DEKONT ÖNİZLEME MODALI */}
      {activeReceiptModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
          onClick={() => setActiveReceiptModal(null)}
        >
          <div
            className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="font-bold text-base text-slate-900">Banka Dekont Detayı</div>
              <button
                type="button"
                onClick={() => setActiveReceiptModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Daire:</span>
                <span className="font-bold text-slate-900">{activeReceiptModal.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gönderen:</span>
                <span className="font-bold text-slate-900">{activeReceiptModal.resident}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tutar:</span>
                <span className="font-bold text-slate-900 text-lg tabular-nums">{activeReceiptModal.amount.toLocaleString('tr-TR')} ₺</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kanal / Ref:</span>
                <span className="font-mono font-medium text-slate-700">{activeReceiptModal.channel} · {activeReceiptModal.referenceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tarih:</span>
                <span className="text-slate-700 font-medium">{activeReceiptModal.date}</span>
              </div>

              {/* Dekont Görsel Temsili */}
              <div className="mt-4 p-5 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-500 text-xs">
                <Receipt size={28} className="mx-auto mb-2 text-slate-400" />
                <span className="font-medium">Banka Havale/FAST Belgesi Sistemde Kayıtlıdır</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveReceiptModal(null)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Kapat
              </button>
              <button
                type="button"
                onClick={() => {
                  handleApprove(activeReceiptModal.id);
                  setActiveReceiptModal(null);
                }}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs"
              >
                Ödemeyi Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
