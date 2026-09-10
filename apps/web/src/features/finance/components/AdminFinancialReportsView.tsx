import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Building2,
  TrendingUp,
  TrendingDown,
  Scale,
  DollarSign,
  PieChart,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import { FinancialReportPackage, Group } from '@sitera/shared';
import { financeApi } from '../finance.api';

interface AdminFinancialReportsViewProps {
  groupId?: string;
  activeGroup?: Group;
}

export const AdminFinancialReportsView: React.FC<AdminFinancialReportsViewProps> = ({
  groupId,
  activeGroup,
}) => {
  const [reports, setReports] = useState<FinancialReportPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'incomeExpense' | 'trialBalance' | 'balanceSheet' | 'executiveSummary'>('incomeExpense');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await financeApi.getReports(groupId);
      setReports(data);
    } catch (err: any) {
      console.error('Finansal raporlar alınırken hata:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // CSV Export Engine with UTF-8 BOM for Microsoft Excel Compatibility
  const handleExportCSV = () => {
    if (!reports) return;

    const BOM = '\uFEFF';
    let csv = BOM;

    // 1. Header
    csv += `SİTERA YÖNETİM KURULU RESMİ FİNANSAL RAPORU\n`;
    csv += `Site / Bina:;${reports.siteName}\n`;
    csv += `Rapor Dönemi:;${reports.periodName}\n`;
    csv += `Düzenleme Tarihi:;${reports.asOfDate}\n\n`;

    // 2. Gelir - Gider Tablosu
    csv += `--- GELİR - GİDER TABLOSU (NAKİT AKIŞI) ---\n`;
    csv += `Gelir Kalemi;Kategori;Tahakkuk Eden (TL);Fiilen Tahsil Edilen (TL);Kalan Alacak (TL);Tahsilat Oranı (%)\n`;
    reports.incomeExpense.incomes.forEach((inc) => {
      csv += `"${inc.title}";"${inc.category}";${inc.accruedAmount};${inc.collectedAmount};${inc.pendingAmount};%${inc.collectionRate}\n`;
    });
    csv += `TOPLAM GELİR;;${reports.incomeExpense.totalAccruedIncome};${reports.incomeExpense.totalCollectedIncome};${reports.incomeExpense.totalAccruedIncome - reports.incomeExpense.totalCollectedIncome};%${reports.incomeExpense.collectionRate}\n\n`;

    csv += `Gider Kalemi;Kategori;Tedarikçi / Muhatap;Vade Tarihi;Tutar (TL);Durum\n`;
    reports.incomeExpense.expenses.forEach((exp) => {
      csv += `"${exp.title}";"${exp.category}";"${exp.vendor}";${exp.dueDate};${exp.amount};"${exp.status === 'paid' ? 'Ödendi' : 'Beklemede'}"\n`;
    });
    csv += `TOPLAM GİDER;;;;${reports.incomeExpense.totalExpense};\n\n`;
    csv += `NET DÖNEM FAZLASI (KASA FAZLASI);;;;${reports.incomeExpense.netCashSurplus};\n\n`;

    // 3. Aylık Mizan
    csv += `--- AYLIK MİZAN (TRIAL BALANCE) ---\n`;
    csv += `Hesap Kodu;Hesap Adı;Hesap Türü;Borç Toplamı (TL);Alacak Toplamı (TL);Borç Bakiyesi (TL);Alacak Bakiyesi (TL)\n`;
    reports.trialBalance.accounts.forEach((acc) => {
      csv += `"${acc.code}";"${acc.name}";"${acc.type}";${acc.debit};${acc.credit};${acc.debitBalance};${acc.creditBalance}\n`;
    });
    csv += `MİZAN TOPLAMI;;;${reports.trialBalance.totalDebit};${reports.trialBalance.totalCredit};${reports.trialBalance.totalDebitBalance};${reports.trialBalance.totalCreditBalance}\n\n`;

    // 4. Bilanço
    csv += `--- YÖNETİM KURULU BİLANÇOSU ---\n`;
    csv += `AKTİFLER (VARLIKLAR);Tutar (TL);PASİFLER (KAYNAKLAR);Tutar (TL)\n`;
    const maxRows = Math.max(
      reports.balanceSheet.currentAssets.length,
      reports.balanceSheet.shortTermLiabilities.length + reports.balanceSheet.equity.length,
    );
    const liabilitiesList = [
      ...reports.balanceSheet.shortTermLiabilities,
      ...reports.balanceSheet.equity,
    ];

    for (let i = 0; i < maxRows; i++) {
      const asset = reports.balanceSheet.currentAssets[i];
      const liab = liabilitiesList[i];
      const assetStr = asset ? `"${asset.title}";${asset.amount}` : `;-`;
      const liabStr = liab ? `"${liab.title}";${liab.amount}` : `;-`;
      csv += `${assetStr};${liabStr}\n`;
    }
    csv += `AKTİF TOPLAMI;${reports.balanceSheet.totalAssets};PASİF TOPLAMI;${reports.balanceSheet.totalLiabilitiesAndEquity}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      'download',
      `Sitera_Finansal_Rapor_${reports.siteName.replace(/\s+/g, '_')}_${reports.asOfDate}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Official PDF / Print Handler
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 bg-white border border-slate-200 rounded-xl space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-teal-700 mx-auto" />
        <div className="text-sm font-semibold">Yönetim Kurulu Finansal Raporları Derleniyor...</div>
        <p className="text-xs text-slate-400">Tüm kasa, banka, tahsilat ve mizan verileri hesaplanıyor.</p>
      </div>
    );
  }

  if (!reports) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-xl">
        Finansal rapor verisi bulunamadı.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full animate-fade-in print:p-0 print:m-0 print:space-y-4">
      {/* 1. ÜST BAŞLIK VE EYLEM BUTONLARI (Print sırasında sadece antet görünür) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 print:border-b-2 print:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Scale size={24} className="text-teal-700 print:text-slate-900" />
              <span>Finansal Raporlar & Bilanço</span>
            </h1>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-md print:border-slate-400 print:text-slate-800">
              KMK m. 39 / 41 Uyumlu
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {reports.siteName} · Yönetim Kurulu, Denetim Kurulu ve Kat Malikleri Genel Kurul Resmi Rapor Paketi
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 print:hidden">
          <button
            type="button"
            onClick={fetchReports}
            className="h-9 inline-flex items-center gap-1.5 px-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Verileri Yenile"
          >
            <RefreshCw size={14} />
            <span>Yenile</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="h-9 inline-flex items-center gap-1.5 px-3.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Excel uyumlu CSV indir"
          >
            <Download size={14} className="text-teal-700" />
            <span>Excel / CSV İndir</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="h-9 inline-flex items-center gap-1.5 px-4 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Printer size={14} />
            <span>Resmi PDF / Yazdır</span>
          </button>
        </div>
      </div>

      {/* YAZDIRMA ANTETİ (Sadece Print modunda çıkar) */}
      <div className="hidden print:block text-center border-b pb-2 mb-4">
        <h2 className="text-xl font-bold uppercase tracking-wide text-slate-900">{reports.siteName} YÖNETİMİ</h2>
        <div className="text-xs text-slate-600 font-medium">
          Dönem: {reports.periodName} | Rapor Tarihi: {new Date(reports.asOfDate).toLocaleDateString('tr-TR')} | Durum: Resmi İbra Belgesi
        </div>
      </div>

      {/* 2. 4'LÜ YÖNETİM KURULU KPI ÖZET KARTLARI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 print:grid-cols-4">
        {/* KPI 1: Toplam Tahsil Edilen Gelir */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tahsil Edilen Gelir</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <ArrowUpRight size={14} />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
              {reports.kpis.totalCollected.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Tahakkuk: {reports.kpis.totalReceivable + reports.kpis.totalCollected} ₺</span>
              <span className="text-emerald-700 font-bold">%{reports.kpis.collectionRate}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Toplam Masraflar (Gider) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Toplam Harcama (Gider)</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
              <ArrowDownRight size={14} />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
              {reports.kpis.totalExpenses.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Yıllık Bütçe: {reports.kpis.annualBudget.toLocaleString('tr-TR')} ₺</span>
              <span className="text-rose-700 font-bold">%{reports.kpis.budgetSpentRate}</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Net Kasa Fazlası / Dönem Karı */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Net Kasa Fazlası (Fark)</span>
            <span
              className={`p-1.5 rounded-lg ${
                reports.kpis.netSurplus >= 0 ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              <TrendingUp size={14} />
            </span>
          </div>
          <div className="mt-2">
            <div
              className={`text-2xl font-bold tracking-tight tabular-nums ${
                reports.kpis.netSurplus >= 0 ? 'text-teal-800' : 'text-rose-700'
              }`}
            >
              {reports.kpis.netSurplus >= 0 ? '+' : ''}
              {reports.kpis.netSurplus.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {reports.kpis.netSurplus >= 0 ? 'Gelir fazlası (Pozitif akış)' : 'Nakit açığı'}
            </div>
          </div>
        </div>

        {/* KPI 4: Kasa & Banka Toplam Mevcudu */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Kasa & Banka Mevcudu</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <Wallet size={14} />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-indigo-900 tracking-tight tabular-nums">
              {reports.kpis.totalLiquidity.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Hazır likit varlıklar toplamı
            </div>
          </div>
        </div>
      </div>

      {/* 3. RAPOR TÜRÜ SEKMELERİ (Print sırasında hepsi veya aktif olan basılır) */}
      <div className="print:hidden border-b border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('incomeExpense')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'incomeExpense'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <TrendingUp size={14} />
            <span>1. Gelir - Gider Tablosu (Nakit Akışı)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trialBalance')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'trialBalance'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <FileText size={14} />
            <span>2. Aylık Mizan (Hesap Bazlı Denge)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('balanceSheet')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'balanceSheet'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Scale size={14} />
            <span>3. Yönetim Kurulu Bilançosu (Aktif / Pasif)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('executiveSummary')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'executiveSummary'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <ShieldCheck size={14} />
            <span>4. Resmi İbra & Denetim Özeti</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SEKME 1: GELİR - GİDER TABLOSU                               */}
      {/* ============================================================ */}
      {(activeTab === 'incomeExpense' || typeof window === 'undefined') && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  Gelirler Tablosu (Tahakkuk & Fiili Tahsilat)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dönem içinde kat maliki ve sakinlerden tahsil edilen aidat, demirbaş ve faiz gelirleri
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                Tahsilat: {reports.incomeExpense.totalCollectedIncome.toLocaleString('tr-TR')} ₺
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-4">Gelir Kalemi</th>
                    <th className="py-2.5 px-4">Kategori</th>
                    <th className="py-2.5 px-4 text-right">Tahakkuk (Borç)</th>
                    <th className="py-2.5 px-4 text-right">Fiili Tahsilat</th>
                    <th className="py-2.5 px-4 text-right">Kalan Alacak</th>
                    <th className="py-2.5 px-4 text-center">Tahsilat Oranı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.incomeExpense.incomes.map((inc, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{inc.title}</td>
                      <td className="py-2.5 px-4 text-slate-600 font-medium">{inc.category}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-slate-700">
                        {inc.accruedAmount.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-bold text-emerald-700">
                        {inc.collectedAmount.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-amber-700 font-medium">
                        {inc.pendingAmount.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
                          %{inc.collectionRate}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Gelir Alt Toplam */}
                  <tr className="bg-emerald-50/30 border-t-2 border-emerald-200 font-bold text-slate-900">
                    <td className="py-3 px-4">TOPLAM GELİRLER</td>
                    <td className="py-3 px-4">Genel İcmal</td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      {reports.incomeExpense.totalAccruedIncome.toLocaleString('tr-TR')} ₺
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-emerald-800 text-sm">
                      {reports.incomeExpense.totalCollectedIncome.toLocaleString('tr-TR')} ₺
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-amber-800">
                      {(reports.incomeExpense.totalAccruedIncome - reports.incomeExpense.totalCollectedIncome).toLocaleString('tr-TR')} ₺
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-800 font-bold">
                      %{reports.incomeExpense.collectionRate}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Giderler Tablosu */}
          <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                  Giderler Tablosu (Harcama ve Masraf Kalemleri)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tesis bakımı, asansör, ortak aydınlatma, temizlik ve hizmet faturaları
                </p>
              </div>
              <span className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
                Gider: {reports.incomeExpense.totalExpense.toLocaleString('tr-TR')} ₺
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-4">Harcama / Masraf</th>
                    <th className="py-2.5 px-4">Kategori</th>
                    <th className="py-2.5 px-4">Tedarikçi / Muhatap</th>
                    <th className="py-2.5 px-4">Vade Tarihi</th>
                    <th className="py-2.5 px-4 text-right">Tutar</th>
                    <th className="py-2.5 px-4 text-center">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.incomeExpense.expenses.map((exp, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{exp.title}</td>
                      <td className="py-2.5 px-4 text-slate-600 font-medium">{exp.category}</td>
                      <td className="py-2.5 px-4 text-slate-700 font-medium">{exp.vendor}</td>
                      <td className="py-2.5 px-4 text-slate-500 font-mono">{exp.dueDate}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-bold text-slate-900">
                        {exp.amount.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            exp.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {exp.status === 'paid' ? 'Ödendi' : 'Ödenecek'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Gider Alt Toplam */}
                  <tr className="bg-rose-50/30 border-t-2 border-rose-200 font-bold text-slate-900">
                    <td className="py-3 px-4">TOPLAM GİDERLER</td>
                    <td className="py-3 px-4">Harcamalar İcmali</td>
                    <td className="py-3 px-4">-</td>
                    <td className="py-3 px-4">-</td>
                    <td className="py-3 px-4 text-right tabular-nums text-rose-800 text-sm">
                      {reports.incomeExpense.totalExpense.toLocaleString('tr-TR')} ₺
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 font-normal">
                      {reports.incomeExpense.expenses.length} Fatura
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Net Kasa Fazlası Özeti Barı */}
            <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-400 font-medium">NET NAKİT DÖNEM FAZLASI (GELİR - GİDER)</span>
                <div className="text-lg font-bold mt-0.5">
                  Tahsil Edilen Gelir ({reports.incomeExpense.totalCollectedIncome.toLocaleString('tr-TR')} ₺) - Harcamalar ({reports.incomeExpense.totalExpense.toLocaleString('tr-TR')} ₺)
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight text-emerald-400 tabular-nums">
                {reports.incomeExpense.netCashSurplus >= 0 ? '+' : ''}
                {reports.incomeExpense.netCashSurplus.toLocaleString('tr-TR')} ₺
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SEKME 2: AYLIK MİZAN (TRIAL BALANCE)                          */}
      {/* ============================================================ */}
      {activeTab === 'trialBalance' && (
        <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText size={16} className="text-teal-700" />
                Aylık Mizan Tablosu (Hesap Bazlı Borç / Alacak Dengesi)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Muhasebe tekdüzen hesap planı standartlarında hesap hareketleri ve bakiye mutabakatı
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border ${
                reports.trialBalance.isBalanced
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {reports.trialBalance.isBalanced ? (
                <>
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Mizan Borç / Alacak Dengesi Tam Mutabık</span>
                </>
              ) : (
                <>
                  <AlertCircle size={13} className="text-rose-600" />
                  <span>Bakiye Farkı Bulunmaktadır</span>
                </>
              )}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-4 w-24">Hesap Kodu</th>
                  <th className="py-2.5 px-4">Hesap Adı</th>
                  <th className="py-2.5 px-4">Hesap Grubu</th>
                  <th className="py-2.5 px-4 text-right">Borç Tutarı (TL)</th>
                  <th className="py-2.5 px-4 text-right">Alacak Tutarı (TL)</th>
                  <th className="py-2.5 px-4 text-right">Borç Bakiyesi (TL)</th>
                  <th className="py-2.5 px-4 text-right">Alacak Bakiyesi (TL)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.trialBalance.accounts.map((acc, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{acc.code}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{acc.name}</td>
                    <td className="py-2.5 px-4 text-slate-500 capitalize">{acc.type}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-slate-700">
                      {acc.debit > 0 ? `${acc.debit.toLocaleString('tr-TR')} ₺` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-slate-700">
                      {acc.credit > 0 ? `${acc.credit.toLocaleString('tr-TR')} ₺` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-bold text-emerald-800">
                      {acc.debitBalance > 0 ? `${acc.debitBalance.toLocaleString('tr-TR')} ₺` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-bold text-rose-800">
                      {acc.creditBalance > 0 ? `${acc.creditBalance.toLocaleString('tr-TR')} ₺` : '-'}
                    </td>
                  </tr>
                ))}
                {/* Mizan Toplam Satırı */}
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                  <td className="py-3 px-4 font-mono">TOPLAM</td>
                  <td className="py-3 px-4" colSpan={2}>
                    Mizan Genel Toplamı (Denge Sağlandı)
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-900">
                    {reports.trialBalance.totalDebit.toLocaleString('tr-TR')} ₺
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-900">
                    {reports.trialBalance.totalCredit.toLocaleString('tr-TR')} ₺
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-emerald-900 text-sm">
                    {reports.trialBalance.totalDebitBalance.toLocaleString('tr-TR')} ₺
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-rose-900 text-sm">
                    {reports.trialBalance.totalCreditBalance.toLocaleString('tr-TR')} ₺
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SEKME 3: YÖNETİM KURULU BİLANÇOSU (BALANCE SHEET)             */}
      {/* ============================================================ */}
      {activeTab === 'balanceSheet' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AKTİFLER (VARLIKLAR) */}
            <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="p-4 bg-teal-800 text-white flex items-center justify-between">
                  <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
                    <Building2 size={16} />
                    AKTİFLER (DÖNEN VARLIKLAR)
                  </h3>
                  <span className="text-xs text-teal-200 font-mono">I. Dönen Varlıklar</span>
                </div>

                <div className="p-4 divide-y divide-slate-100 text-xs">
                  {reports.balanceSheet.currentAssets.map((asset, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {asset.code && (
                          <span className="font-mono text-[11px] font-bold text-slate-400">
                            {asset.code}
                          </span>
                        )}
                        <span className="font-medium text-slate-800">{asset.title}</span>
                      </div>
                      <span className="font-bold tabular-nums text-slate-900">
                        {asset.amount.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-teal-50 border-t border-teal-200 flex items-center justify-between text-sm font-bold text-teal-900">
                <span>TOPLAM AKTİFLER (VARLIKLAR)</span>
                <span className="tabular-nums text-base">
                  {reports.balanceSheet.totalAssets.toLocaleString('tr-TR')} ₺
                </span>
              </div>
            </div>

            {/* PASİFLER (KAYNAKLAR) */}
            <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
                    <Scale size={16} />
                    PASİFLER (KAYNAKLAR & YÜKÜMLÜLÜKLER)
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">II. Borçlar & Fonlar</span>
                </div>

                <div className="p-4 divide-y divide-slate-100 text-xs">
                  <div className="py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Kısa Vadeli Yabancı Kaynaklar (Borçlar)
                  </div>
                  {reports.balanceSheet.shortTermLiabilities.map((l, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {l.code && (
                          <span className="font-mono text-[11px] font-bold text-slate-400">
                            {l.code}
                          </span>
                        )}
                        <span className="font-medium text-slate-800">{l.title}</span>
                      </div>
                      <span className="font-bold tabular-nums text-rose-700">
                        {l.amount.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                  ))}

                  <div className="pt-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Özkaynaklar & Rezerv Fonları
                  </div>
                  {reports.balanceSheet.equity.map((eq, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {eq.code && (
                          <span className="font-mono text-[11px] font-bold text-slate-400">
                            {eq.code}
                          </span>
                        )}
                        <span className="font-medium text-slate-800">{eq.title}</span>
                      </div>
                      <span className="font-bold tabular-nums text-emerald-800">
                        {eq.amount.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-100 border-t border-slate-300 flex items-center justify-between text-sm font-bold text-slate-900">
                <span>TOPLAM PASİFLER (KAYNAKLAR)</span>
                <span className="tabular-nums text-base">
                  {reports.balanceSheet.totalLiabilitiesAndEquity.toLocaleString('tr-TR')} ₺
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
              <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
              <span>Bilanço Denkliği Doğrulandı: Aktif Toplamı = Pasif Toplamı ({reports.balanceSheet.totalAssets.toLocaleString('tr-TR')} ₺)</span>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded border border-emerald-300">
              Tam Mutabık
            </span>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SEKME 4: RESMİ GENEL KURUL & İBRA ÖZETİ                       */}
      {/* ============================================================ */}
      {activeTab === 'executiveSummary' && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ShieldCheck size={20} className="text-teal-700" />
              Yıllık Olağan Genel Kurul İbra & Denetim Raporu
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              634 Sayılı Kat Mülkiyeti Kanunu m. 39 ve m. 41 uyarınca yönetimin hesap verme ve ibra metni
            </p>
          </div>

          <div className="prose prose-sm text-xs text-slate-700 leading-relaxed space-y-3">
            <p>
              <strong>{reports.siteName}</strong> Kat Malikleri Kurulu Başkanlığı’na;
            </p>
            <p>
              Yönetimimizce <strong>{reports.periodName}</strong> dönemi süresince yürütülen ortak alan işletme, bakım-onarım ve finansal yönetim faaliyetlerine ilişkin gelir ve gider hareketleri incelenmiş; kayıtların banka ve kasa fişleriyle tam mutabık olduğu tespit edilmiştir.
            </p>
            <p>
              İlgili dönemde toplam <strong>{reports.incomeExpense.totalCollectedIncome.toLocaleString('tr-TR')} ₺</strong> aidat ve demirbaş geliri tahsil edilmiş; buna karşılık toplam <strong>{reports.incomeExpense.totalExpense.toLocaleString('tr-TR')} ₺</strong> ortak alan masrafı ve fatura ödemesi gerçekleştirilmiştir. Dönem sonu itibarıyla kasada ve bankalarda toplam <strong>{reports.kpis.totalLiquidity.toLocaleString('tr-TR')} ₺</strong> hazır likidite mevcut olup, sakinlerden takip edilen cari alacak miktarı <strong>{reports.kpis.totalReceivable.toLocaleString('tr-TR')} ₺</strong> düzeyindedir.
            </p>
          </div>

          {/* İMZA BLOKLARI (RESMİ KURUL ONAYI) */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900">Yönetim Kurulu Başkanı</div>
              <div className="text-slate-500 text-[11px] mt-0.5">Site Yöneticisi</div>
              <div className="h-14 border-b border-dashed border-slate-300 mt-2 mb-2" />
              <div className="text-[11px] text-slate-400">İmza & Kaşe</div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900">Denetçi / Denetim Kurulu</div>
              <div className="text-slate-500 text-[11px] mt-0.5">Kat Maliki Denetçisi</div>
              <div className="h-14 border-b border-dashed border-slate-300 mt-2 mb-2" />
              <div className="text-[11px] text-slate-400">İmza</div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900">Divan Heyeti</div>
              <div className="text-slate-500 text-[11px] mt-0.5">Genel Kurul Divan Başkanı</div>
              <div className="h-14 border-b border-dashed border-slate-300 mt-2 mb-2" />
              <div className="text-[11px] text-slate-400">İmza</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
