import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  FileText,
  ExternalLink,
  Eye,
  Building2,
  Calendar,
  AlertTriangle,
  Landmark,
  Check,
  X,
  Download,
  Receipt,
  User,
  ShieldCheck,
  RefreshCw,
  Maximize2,
} from 'lucide-react';
import { Payment } from '@sitera/shared';
import { useAuth } from '../../auth';
import { useFinance } from '../useFinance';
import { openReceiptInNewTab } from '../finance.api';

interface AdminPaymentApprovalsViewProps {
  groupId?: string;
}

export const AdminPaymentApprovalsView: React.FC<AdminPaymentApprovalsViewProps> = ({ groupId }) => {
  const { user } = useAuth();
  const effectiveGroupId = groupId || user?.groupId;
  const { accounts = [], pendingPayments, approvePayment, rejectPayment, loading, refetch } = useFinance(effectiveGroupId);
  const primaryAccount = accounts.find((a) => a.isPrimary) || accounts[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'with_receipt' | 'without_receipt'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filter pending payments
  const filteredPayments = useMemo(() => {
    return pendingPayments.filter((p) => {
      // Filter mode
      if (filterMode === 'with_receipt' && !p.receiptUrl) return false;
      if (filterMode === 'without_receipt' && p.receiptUrl) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchUnit = p.unit?.toLowerCase().includes(q);
      const matchName = p.residentName?.toLowerCase().includes(q);
      const matchRef = p.referenceNo?.toLowerCase().includes(q);
      const matchNotes = p.notes?.toLowerCase().includes(q);
      return matchUnit || matchName || matchRef || matchNotes;
    });
  }, [pendingPayments, searchQuery, filterMode]);

  const totalPendingAmount = useMemo(() => {
    return pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  }, [pendingPayments]);

  const withReceiptCount = useMemo(() => {
    return pendingPayments.filter((p) => !!p.receiptUrl).length;
  }, [pendingPayments]);

  const handleApprove = async (paymentId: string) => {
    setActionLoadingId(paymentId);
    try {
      await approvePayment(paymentId, user?.id);
    } catch (err: any) {
      alert('Onaylama sırasında hata oluştu: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    if (!confirm('Bu ödeme bildirimini reddetmek istediğinize emin misiniz?')) return;
    setActionLoadingId(paymentId);
    try {
      await rejectPayment(paymentId);
    } catch (err: any) {
      alert('Reddetme sırasında hata oluştu: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };


  return (
    <div className="space-y-6 max-w-full animate-fade-in pb-12">
      {/* 1. FLUSH PAGE HEADER (Admin Dashboard Standart Başlığı) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Ödeme & Dekont Onayları
            </h1>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-md">
              {pendingPayments.length} Bekleyen Bildirim
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {user?.group?.name || 'Site Yönetimi'} · Sakinler tarafından sisteme yüklenen banka dekontları ve onay kuyruğu
          </p>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={loading}
            className="h-10 inline-flex items-center gap-2 px-4 text-sm font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-lg shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw size={15} className={`text-teal-700 ${loading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* 2. 3'LÜ KPI VARLIK KARTLARI (Admin Dashboard ile Birebir) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Kart 1: Onay Bekleyen Tutar (Top Teal Border) */}
        <div className="bg-white border border-slate-300 border-t-3 border-t-teal-700 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900">Bekleyen Tahsilat Tutarı</span>
              <span className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                Onay Kuyruğu
              </span>
            </div>
            <div className="text-sm text-slate-500 mt-1 font-medium">
              Sakinlerin bildirdiği toplam havale / FAST tutarı
            </div>

            <div className="mt-4">
              <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                {totalPendingAmount.toLocaleString('tr-TR')} ₺
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                {pendingPayments.length} adet bildirim banka kontrolü bekliyor
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Yüklü Dekont Adedi:</span>
            <span className="text-teal-700 font-bold">{withReceiptCount} Adet PDF / Dosya</span>
          </div>
        </div>

        {/* Kart 2: Banka FAST & Otomasyon */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900">Doğrulama Kanalı</span>
              <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                7/24 FAST
              </span>
            </div>
            <div className="text-sm text-slate-500 mt-1 font-medium">
              Doğrudan apartman vadesiz hesabına intikal edenler
            </div>

            <div className="mt-4">
              <div className="text-3xl font-bold text-teal-900 tracking-tight">
                Banka Havalesi
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                Komisyonsuz (0 ₺ masraflı) sakin transferleri
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>İşletme Defteri:</span>
            <span className="text-teal-700 font-semibold">Onay anında otomatik işlenir</span>
          </div>
        </div>

        {/* Kart 3: Apartman Banka Hesabı */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900">
                {primaryAccount ? primaryAccount.name : 'Banka Hesabı'}
              </span>
              <span className="text-xs font-semibold text-slate-600 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                {primaryAccount ? primaryAccount.bankName : 'Tanımlı Değil'}
              </span>
            </div>
            <div className="text-sm text-slate-500 mt-1 font-medium">
              {user?.group?.name || 'Site Yönetimi'}
            </div>

            <div className="mt-4">
              <div className="text-xs font-mono font-bold text-slate-900 select-all truncate">
                {primaryAccount ? primaryAccount.iban || 'Nakit Kasa' : 'Hesap tanımlanmadı'}
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                Dekonttaki alıcı hesap ile ekstrenizi karşılaştırınız
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Ekstre Kontrolü</span>
            <span className="text-teal-700 font-bold">Tek Tıkla Doğrulama</span>
          </div>
        </div>
      </div>

      {/* 3. ARAMA VE FİLTRELEME ÇUBUĞU */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Daire, sakin adı veya FAST ref ara..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 outline-none font-medium text-slate-900"
          />
        </div>

        <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200/80 text-xs font-bold w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tümü ({pendingPayments.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('with_receipt')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
              filterMode === 'with_receipt'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📄 Dekont Yüklü ({withReceiptCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('without_receipt')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
              filterMode === 'without_receipt'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dekontsuz ({pendingPayments.length - withReceiptCount})
          </button>
        </div>
      </div>

      {/* 4. ONAY BEKLEYEN DEKONT LİSTESİ */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
            <CheckCircle2 size={40} className="text-teal-600 mb-1" />
            <div className="font-bold text-slate-800 text-sm">Onay Bekleyen Bildirim Bulunmuyor</div>
            <p className="text-xs text-slate-500 max-w-sm">
              Sakinler tarafından iletilen tüm banka havale ve FAST bildirimleri incelenmiş ve onaylanmıştır.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredPayments.map((p) => {
              const isProcessing = actionLoadingId === p.id;
              const hasReceipt = !!p.receiptUrl;

              return (
                <div
                  key={p.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  {/* Sol Bölüm: Daire & Sakin & Referans Bilgileri */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold font-mono">
                        {p.unit || 'Daire'}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {p.residentName || 'Daire Sakini'}
                      </span>
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {p.channel === 'bank_transfer' ? 'Banka FAST / Havale' : 'Kredi Kartı'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap font-medium">
                      <span>Ref No: <strong className="font-mono text-slate-700">{p.referenceNo || 'Belirtilmedi'}</strong></span>
                      <span>•</span>
                      <span>Bildirim Tarihi: {new Date(p.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      {p.notes && (
                        <>
                          <span>•</span>
                          <span className="text-slate-700 italic">"{p.notes}"</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Orta & Sağ Bölüm: Tutar + Dekont Butonu + Onay/Red Aksiyonları */}
                  <div className="flex items-center gap-4 shrink-0 flex-wrap sm:flex-nowrap justify-between lg:justify-end">
                    {/* Tutar */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                        {Number(p.amount).toLocaleString('tr-TR')} ₺
                      </div>
                      <div className="text-[11px] text-amber-700 font-semibold flex items-center gap-1 justify-end">
                        <Clock size={11} />
                        <span>Onay Bekliyor</span>
                      </div>
                    </div>

                    {/* Dekont PDF İncele Butonu */}
                    <div>
                      {hasReceipt ? (
                        <button
                          type="button"
                          onClick={() => openReceiptInNewTab(p.receiptUrl)}
                          className="px-3.5 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                          title="Dekontu Yeni Sekmede Aç"
                        >
                          <FileText size={14} className="text-teal-700" />
                          <span>Dekontu Aç (PDF)</span>
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 text-[11px] font-medium text-slate-400 bg-slate-100 rounded-lg inline-flex items-center gap-1">
                          <AlertTriangle size={12} className="text-slate-400" />
                          <span>Dekontsuz</span>
                        </span>
                      )}
                    </div>

                    {/* Onayla / Reddet Aksiyonları */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleApprove(p.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Check size={14} />
                        <span>{isProcessing ? 'İşleniyor...' : 'Onayla'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleReject(p.id)}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <X size={14} />
                        <span>Reddet</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
