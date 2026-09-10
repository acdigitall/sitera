import React, { useState, useMemo, useEffect } from 'react';
import {
  Landmark,
  FileText,
  Building2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useAuth } from '../../auth';
import { useFinance, triggerFinanceUpdate } from '../../finance';
import {
  validateBrowserFile,
  MAX_RECEIPT_SIZE_BYTES,
  RECEIPT_ALLOWED_MIME_TYPES,
} from '@sitera/shared';
import { PortalPaymentStats } from './PortalPaymentStats';
import { PortalDebtCard } from './PortalDebtCard';
import { PortalCheckoutPanel } from './PortalCheckoutPanel';
import { PortalPrintableReceiptModal } from './PortalPrintableReceiptModal';
import { PortalReceiptViewerModal } from './PortalReceiptViewerModal';

export const PortalPaymentsView: React.FC = () => {
  const { user, selectedUnit, setSelectedUnit } = useAuth();
  const userUnits = user?.units && user.units.length > 0 ? user.units : (user?.name ? [user.name] : []);
  const hasMultipleUnits = userUnits.length > 1;
  const userUnit = selectedUnit && selectedUnit !== 'all' ? selectedUnit : (userUnits[0] || 'Daire');

  const activeUnitFilter = selectedUnit === 'all' ? undefined : (selectedUnit || undefined);
  const { debts, pendingPayments, submitPayment } = useFinance(user?.groupId, user?.id, activeUnitFilter);

  // Map of debts that have a pending approval submission
  const pendingApprovalsMap = useMemo(() => {
    const map = new Map<string, { paymentId: string; receiptUrl?: string | null; amount: number; date: string }>();
    pendingPayments
      .filter((p) => p.status === 'pending' && p.debtId)
      .forEach((p) => {
        map.set(p.debtId!, {
          paymentId: p.id,
          receiptUrl: p.receiptUrl,
          amount: Number(p.amount),
          date: new Date(p.createdAt).toLocaleDateString('tr-TR'),
        });
      });
    return map;
  }, [pendingPayments]);

  // Map backend debts
  const payments = useMemo(() => {
    return debts.map((d) => {
      const isPaid = d.status === 'paid';
      const pendingApproval = pendingApprovalsMap.get(d.id);
      const isPendingApproval = Boolean(pendingApproval) && !isPaid;
      const isOverdue = !isPaid && !isPendingApproval && Boolean(d.dueDate && new Date(d.dueDate) < new Date());
      const lateFee = (d as any).lateFee || 0;
      const isFixture = d.category === 'fixture';
      const totalAmount = Number((d as any).totalWithLateFee || d.amount);

      return {
        id: d.id,
        title: d.title,
        period: (d as any).period?.name || d.title,
        category: isFixture ? 'Demirbaş / Malik' : 'İşletme / Aidat',
        amount: `${Number(d.amount).toLocaleString('tr-TR')} ₺`,
        rawAmount: Number(d.amount),
        rawTotalAmount: totalAmount,
        totalWithLateFee: `${totalAmount.toLocaleString('tr-TR')} ₺`,
        dueDate: d.dueDate ? new Date(d.dueDate).toLocaleDateString('tr-TR') : 'Belirtilmedi',
        status: isPaid ? 'paid' : isPendingApproval ? 'pending_approval' : d.status,
        isPendingApproval,
        pendingReceiptUrl: pendingApproval?.receiptUrl,
        isOverdue,
        overdueDays: (d as any).overdueDays || 0,
        lateFee,
        isFixture,
        paidDate: d.paidDate ? new Date(d.paidDate).toLocaleDateString('tr-TR') : undefined,
        unit: d.unit,
      };
    });
  }, [debts, pendingApprovalsMap]);

  const payablePaymentsList = useMemo(
    () => payments.filter((p) => p.status !== 'paid' && !p.isPendingApproval),
    [payments]
  );
  const pendingApprovalList = useMemo(
    () => payments.filter((p) => p.isPendingApproval),
    [payments]
  );
  const paidPaymentsList = useMemo(
    () => payments.filter((p) => p.status === 'paid'),
    [payments]
  );
  const pendingTotal = useMemo(
    () => payablePaymentsList.reduce((sum, p) => sum + p.rawTotalAmount, 0),
    [payablePaymentsList]
  );
  const paidTotal = useMemo(
    () => paidPaymentsList.reduce((sum, p) => sum + p.rawAmount, 0),
    [paidPaymentsList]
  );

  // Selection and tabs
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'under_review' | 'paid'>('pending');
  const [receiptInvoice, setReceiptInvoice] = useState<any>(null);
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    method: 'bank' | 'card';
    title: string;
    description: string;
  } | null>(null);

  // Form states
  const [payMethod, setPayMethod] = useState<'bank' | 'card'>('bank');
  const [bankRefNo, setBankRefNo] = useState('');
  const [bankNotes, setBankNotes] = useState('');
  const [ibanCopied, setIbanCopied] = useState(false);
  const [cardNumber, setCardNumber] = useState('5421 •••• •••• 8842');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('•••');
  const [paying, setPaying] = useState(false);

  // Dekont Dosyası (PDF / Görsel) State'leri
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptDataUrl, setReceiptDataUrl] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [receiptFileSize, setReceiptFileSize] = useState<string | null>(null);
  const [previewPdfOpen, setPreviewPdfOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = await validateBrowserFile(file, {
      maxSizeBytes: MAX_RECEIPT_SIZE_BYTES,
      allowedMimeTypes: RECEIPT_ALLOWED_MIME_TYPES,
      scanMaliciousSignatures: true,
    });

    if (!validation.isValid) {
      alert(validation.error || 'Seçilen dekont dosyası güvenlik kontrolünden geçemedi.');
      if (e.target) e.target.value = '';
      return;
    }

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    setReceiptFile(file);
    setReceiptFileName(file.name);
    setReceiptFileSize(sizeStr);

    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptDataUrl(null);
    setReceiptFileName(null);
    setReceiptFileSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (selectedInvoiceIds.length === 0 && payablePaymentsList.length > 0) {
      setSelectedInvoiceIds([payablePaymentsList[0].id]);
      setBankRefNo(`FAST-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  }, [payablePaymentsList]);

  const selectedInvoices = useMemo(() => {
    return payablePaymentsList.filter((p) => selectedInvoiceIds.includes(p.id));
  }, [payablePaymentsList, selectedInvoiceIds]);

  const baseInvoiceAmount = useMemo(() => {
    return selectedInvoices.reduce((sum, inv) => sum + inv.rawTotalAmount, 0);
  }, [selectedInvoices]);

  const cardCommissionRate = 0.05;
  const cardCommissionAmount = Math.round(baseInvoiceAmount * cardCommissionRate * 100) / 100;
  const totalCardAmount = Math.round((baseInvoiceAmount + cardCommissionAmount) * 100) / 100;
  const totalBankAmount = baseInvoiceAmount;

  const handleCopyIban = (iban: string) => {
    navigator.clipboard.writeText(iban);
    setIbanCopied(true);
    setTimeout(() => setIbanCopied(false), 2000);
  };

  const handleToggleInvoice = (id: string) => {
    setSelectedInvoiceIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
    setBankRefNo(`FAST-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleSelectAllPending = () => {
    if (selectedInvoiceIds.length === payablePaymentsList.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(payablePaymentsList.map((p) => p.id));
    }
  };

  const confirmPayment = async () => {
    if (selectedInvoices.length === 0) return;
    setPaying(true);
    try {
      await Promise.all(
        selectedInvoices.map((inv) => {
          const indBase = inv.rawTotalAmount;
          const indCommission = Math.round(indBase * cardCommissionRate * 100) / 100;
          const indTotalCard = Math.round((indBase + indCommission) * 100) / 100;

          return submitPayment({
            debtId: inv.id,
            unit: inv.unit || userUnit || 'Daire',
            amount: payMethod === 'card' ? indTotalCard : indBase,
            channel: payMethod === 'card' ? 'credit_card' : 'bank_transfer',
            referenceNo:
              payMethod === 'card'
                ? `POS-${Math.floor(100000 + Math.random() * 900000)}`
                : bankRefNo || `FAST-${Math.floor(100000 + Math.random() * 900000)}`,
            receiptUrl: payMethod === 'bank' ? receiptDataUrl || undefined : undefined,
            notes:
              payMethod === 'card'
                ? `Toplu Kredi Kartı Ödemesi: ${inv.title} (${indBase.toLocaleString('tr-TR')} ₺ + %5 Komisyon)`
                : bankNotes || `Toplu FAST / Havale: ${inv.title}`,
          });
        })
      );

      triggerFinanceUpdate();

      if (payMethod === 'card') {
        setSubmissionFeedback({
          method: 'card',
          title: 'Ödemeniz Başarıyla Alındı ve Hesabınıza İşlendi!',
          description: `${selectedInvoices.length} adet faturanın tahsilatı kredi kartınızdan tamamlandı ve ilgili borçlar doğrudan ödendi olarak kapatıldı.`,
        });
        setSelectedInvoiceIds([]);
        setActiveTab('paid');
      } else {
        setSubmissionFeedback({
          method: 'bank',
          title: 'FAST / Havale Bildiriminiz Yöneticiye İletildi!',
          description: `${selectedInvoices.length} adet faturaya ait banka transfer kaydınız ve dekontunuz yönetici onayına gönderildi. Yönetici banka ekstresiyle eşleştirdiğinde borcunuz onaylanacaktır.`,
        });
        setSelectedInvoiceIds([]);
        handleRemoveReceipt();
        setActiveTab('under_review');
      }
    } catch (err: any) {
      alert('Ödeme kaydedilirken bir sorun oluştu: ' + (err.message || 'Lütfen tekrar deneyiniz.'));
    } finally {
      setPaying(false);
    }
  };

  const filteredPayments = useMemo(() => {
    if (activeTab === 'pending') return payablePaymentsList;
    if (activeTab === 'under_review') return pendingApprovalList;
    if (activeTab === 'paid') return paidPaymentsList;
    return payments;
  }, [payments, payablePaymentsList, pendingApprovalList, paidPaymentsList, activeTab]);

  return (
    <div className="space-y-6 max-w-full animate-fade-in pb-12">
      {/* 1. FLUSH PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Aidat &amp; Borç Ödeme</h1>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-md">
              {hasMultipleUnits
                ? selectedUnit === 'all'
                  ? `${userUnits.join(' & ')} (${userUnits.length} Daire)`
                  : selectedUnit
                : userUnits[0] || 'Daire'}{' '}
              ·{' '}
              {user?.residentType === 'tenant'
                ? 'Kiracı Sakin'
                : user?.residentType === 'both'
                ? 'Ev Sahibi (İkamet Eden)'
                : 'Kat Maliki'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {user?.group?.name || 'Gencosman Apartmanı'} · Daireye Ait Tahakkuk ve Tahsilat Dökümü
          </p>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => handleCopyIban('TR42 0001 0090 1234 5678 5001')}
            className="h-10 inline-flex items-center gap-2 px-4 text-sm font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-lg shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Landmark size={15} className="text-teal-700" />
            <span>{ibanCopied ? 'IBAN Kopyalandı' : 'Site IBAN Bilgisi'}</span>
          </button>

          <button
            type="button"
            onClick={() => alert('Daireye ait hesap ekstresi PDF olarak hazırlanıyor.')}
            className="h-10 inline-flex items-center gap-2 px-4 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <FileText size={15} />
            <span>Hesap Ekstresi (PDF)</span>
          </button>
        </div>
      </div>

      {/* Çoklu Daire Seçim Sekmeleri */}
      {hasMultipleUnits && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-teal-700" />
            <span className="text-xs font-bold text-slate-800">
              Daire Seçimi ({userUnits.length} Bağımsız Bölüm):
            </span>
          </div>

          <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200/80 text-xs font-bold shrink-0 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setSelectedUnit('all')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                selectedUnit === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏢 Tüm Dairelerim ({userUnits.length})
            </button>
            {userUnits.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setSelectedUnit(u)}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  selectedUnit === u
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🚪 {u}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. KASA & VARLIK KARTLARI */}
      <PortalPaymentStats
        pendingTotal={pendingTotal}
        payableCount={payablePaymentsList.length}
        paidTotal={paidTotal}
        paidCount={paidPaymentsList.length}
        ibanCopied={ibanCopied}
        onCopyIban={handleCopyIban}
      />

      {/* 3. İŞLEM BİLDİRİM BANNERI */}
      {submissionFeedback && (
        <div
          className={`p-4 rounded-xl border animate-scale-up flex items-start justify-between gap-3 ${
            submissionFeedback.method === 'card'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                submissionFeedback.method === 'card'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm">{submissionFeedback.title}</h4>
              <p className="text-xs opacity-90 mt-0.5 leading-relaxed">
                {submissionFeedback.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSubmissionFeedback(null)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 4. İKİ SÜTUNLU OPERASYONEL PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Sol Sütun: Daire Aidat & Gider Dökümü */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-bold text-slate-900">Aidat ve Gider Dökümü</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {filteredPayments.length} Kayıt
                </span>
              </div>

              {/* Segmented Filter Buttons */}
              <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200/80 shrink-0 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('pending')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    activeTab === 'pending'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Ödenecekler ({payablePaymentsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('under_review')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    activeTab === 'under_review'
                      ? 'bg-white text-amber-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>Onay Bekleyenler</span>
                  {pendingApprovalList.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-mono">
                      {pendingApprovalList.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('paid')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    activeTab === 'paid'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Ödenenler ({paidPaymentsList.length})
                </button>
              </div>
            </div>

            {/* Çoklu Seçim Toolbar */}
            {activeTab === 'pending' && payablePaymentsList.length > 0 && (
              <div className="py-2.5 px-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-bold -mx-2 mb-2 rounded-md">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={
                      selectedInvoiceIds.length === payablePaymentsList.length &&
                      payablePaymentsList.length > 0
                    }
                    onChange={handleSelectAllPending}
                    className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600 cursor-pointer"
                  />
                  <span>
                    Tümünü Seç ({payablePaymentsList.length} Fatura ·{' '}
                    {pendingTotal.toLocaleString('tr-TR')} ₺)
                  </span>
                </label>

                <span className="text-teal-800 font-semibold text-[11px]">
                  {selectedInvoiceIds.length} / {payablePaymentsList.length} seçili
                </span>
              </div>
            )}

            {/* List */}
            <div className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {activeTab === 'under_review'
                    ? 'Yönetici onayı bekleyen herhangi bir dekont bildiriminiz bulunmuyor.'
                    : activeTab === 'pending'
                    ? 'Harika! Ödenmemiş herhangi bir aidat veya demirbaş borcunuz bulunmuyor.'
                    : 'Henüz ödenmiş bir borç kaydı bulunmuyor.'}
                </div>
              ) : (
                filteredPayments.map((p) => (
                  <PortalDebtCard
                    key={p.id}
                    payment={p}
                    isSelected={selectedInvoiceIds.includes(p.id)}
                    onToggleSelect={handleToggleInvoice}
                    onOpenReceipt={(invoice) => setReceiptInvoice(invoice)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sağ Sütun: Ödeme Sepeti & Onay Formu */}
        <PortalCheckoutPanel
          selectedInvoices={selectedInvoices}
          baseInvoiceAmount={baseInvoiceAmount}
          totalCardAmount={totalCardAmount}
          totalBankAmount={totalBankAmount}
          cardCommissionAmount={cardCommissionAmount}
          payMethod={payMethod}
          setPayMethod={setPayMethod}
          bankRefNo={bankRefNo}
          setBankRefNo={setBankRefNo}
          bankNotes={bankNotes}
          setBankNotes={setBankNotes}
          ibanCopied={ibanCopied}
          onCopyIban={handleCopyIban}
          receiptFileName={receiptFileName}
          receiptFileSize={receiptFileSize}
          receiptDataUrl={receiptDataUrl}
          onFileUpload={handleFileUpload}
          onRemoveReceipt={handleRemoveReceipt}
          onPreviewReceipt={() => setPreviewPdfOpen(true)}
          fileInputRef={fileInputRef}
          cardNumber={cardNumber}
          setCardNumber={setCardNumber}
          cardExpiry={cardExpiry}
          setCardExpiry={setCardExpiry}
          cardCvv={cardCvv}
          setCardCvv={setCardCvv}
          paying={paying}
          onConfirmPayment={confirmPayment}
          defaultNotePlaceholder={`Örn: ${userUnits.join(', ')} Toplu Aidat Ödemesi`}
        />
      </div>

      {/* 5. RESMİ MAKBUZ MODALI */}
      <PortalPrintableReceiptModal
        invoice={receiptInvoice}
        userUnit={userUnit}
        userName={user?.name}
        onClose={() => setReceiptInvoice(null)}
      />

      {/* 6. YÜKLENEN DEKONT ÖNİZLEME MODALI */}
      <PortalReceiptViewerModal
        isOpen={previewPdfOpen && Boolean(viewReceiptUrl || receiptDataUrl)}
        url={viewReceiptUrl || receiptDataUrl}
        fileName={receiptFileName}
        fileSize={receiptFileSize}
        isUploadedByUser={!viewReceiptUrl}
        onClose={() => {
          setPreviewPdfOpen(false);
          setViewReceiptUrl(null);
        }}
      />
    </div>
  );
};
