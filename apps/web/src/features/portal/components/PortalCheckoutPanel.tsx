import React from 'react';
import {
  CreditCard,
  Landmark,
  Copy,
  FileText,
  Upload,
  Trash2,
} from 'lucide-react';

export interface PortalCheckoutPanelProps {
  selectedInvoices: any[];
  baseInvoiceAmount: number;
  totalCardAmount: number;
  totalBankAmount: number;
  cardCommissionAmount: number;
  payMethod: 'bank' | 'card';
  setPayMethod: (m: 'bank' | 'card') => void;
  bankRefNo: string;
  setBankRefNo: (val: string) => void;
  bankNotes: string;
  setBankNotes: (val: string) => void;
  ibanCopied: boolean;
  onCopyIban: (iban: string) => void;
  receiptFileName: string | null;
  receiptFileSize: string | null;
  receiptDataUrl: string | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveReceipt: () => void;
  onPreviewReceipt: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  cardNumber: string;
  setCardNumber: (val: string) => void;
  cardExpiry: string;
  setCardExpiry: (val: string) => void;
  cardCvv: string;
  setCardCvv: (val: string) => void;
  paying: boolean;
  onConfirmPayment: () => void;
  defaultNotePlaceholder?: string;
  iban?: string | null;
  bankName?: string;
}

export const PortalCheckoutPanel: React.FC<PortalCheckoutPanelProps> = ({
  selectedInvoices,
  baseInvoiceAmount,
  totalCardAmount,
  totalBankAmount,
  cardCommissionAmount,
  payMethod,
  setPayMethod,
  bankRefNo,
  setBankRefNo,
  bankNotes,
  setBankNotes,
  ibanCopied,
  onCopyIban,
  receiptFileName,
  receiptFileSize,
  receiptDataUrl,
  onFileUpload,
  onRemoveReceipt,
  onPreviewReceipt,
  fileInputRef,
  cardNumber,
  setCardNumber,
  cardExpiry,
  setCardExpiry,
  cardCvv,
  setCardCvv,
  paying,
  onConfirmPayment,
  defaultNotePlaceholder,
  iban,
  bankName,
}) => {
  return (
    <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <span className="text-base font-bold text-slate-900">Seçili Ödeme Sepeti</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            {selectedInvoices.length} Fatura Seçildi
          </span>
        </div>

        {selectedInvoices.length > 0 ? (
          <div className="mt-4 space-y-4">
            {/* Seçili Fatura Özet Listesi */}
            <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-200/80 space-y-2 max-h-36 overflow-y-auto">
              {selectedInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-800 block truncate">{inv.title}</span>
                    <span className="text-[10px] text-slate-400">
                      {inv.unit ? `${inv.unit} · ` : ''}
                      {inv.category}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 shrink-0">
                    {inv.isOverdue && !inv.isPendingApproval && inv.lateFee > 0
                      ? inv.totalWithLateFee
                      : inv.amount}
                  </span>
                </div>
              ))}
            </div>

            {/* Tutar Dökümü */}
            <div className="p-3.5 bg-teal-50/40 rounded-xl border border-teal-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Asıl Borç Tutarı:</span>
                <span className="font-mono font-bold">
                  {baseInvoiceAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </span>
              </div>

              {payMethod === 'card' && (
                <div className="flex justify-between text-amber-800 font-medium">
                  <span>Sanal POS Komisyonu (%5):</span>
                  <span className="font-mono">
                    +{cardCommissionAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </span>
                </div>
              )}

              <div className="border-t border-teal-200/60 pt-2 flex justify-between items-baseline font-bold text-slate-900 text-sm">
                <span>Toplam Ödenecek:</span>
                <span className="text-xl font-mono text-teal-900">
                  {(payMethod === 'card' ? totalCardAmount : totalBankAmount).toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                  })}{' '}
                  ₺
                </span>
              </div>
            </div>

            {/* Ödeme Metodu Seçimi */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Ödeme Kanalı Seçiniz:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayMethod('bank')}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    payMethod === 'bank'
                      ? 'border-teal-700 bg-teal-50/50 ring-1 ring-teal-700'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <Landmark size={14} className="text-teal-700" />
                    <span>Havale / FAST</span>
                  </div>
                  <span className="text-[10px] text-teal-800 font-semibold block mt-0.5">0 ₺ Komisyonsuz</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethod('card')}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    payMethod === 'card'
                      ? 'border-teal-700 bg-teal-50/50 ring-1 ring-teal-700'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <CreditCard size={14} className="text-teal-700" />
                    <span>Kredi / Banka Kartı</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">%5 Banka POS Komisyonu</span>
                </button>
              </div>
            </div>

            {/* Form Alanları */}
            {payMethod === 'bank' ? (
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between text-slate-600 mb-1">
                    <span className="font-semibold">{bankName ? `${bankName} IBAN:` : 'Site Yönetimi IBAN:'}</span>
                    {iban && (
                      <button
                        type="button"
                        onClick={() => onCopyIban(iban)}
                        className="text-teal-700 font-bold hover:underline cursor-pointer flex items-center gap-1 text-[11px]"
                      >
                        <Copy size={11} />
                        <span>{ibanCopied ? 'Kopyalandı' : 'Kopyala'}</span>
                      </button>
                    )}
                  </div>
                  <div className="font-mono font-bold text-slate-900 bg-white p-2 rounded border border-slate-200 select-all text-xs">
                    {iban || 'Banka hesabı henüz tanımlanmadı'}
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 font-semibold block mb-1">
                    FAST / Havale Dekont Referans No
                  </label>
                  <input
                    type="text"
                    value={bankRefNo}
                    onChange={(e) => setBankRefNo(e.target.value)}
                    placeholder="Örn: FAST-984210"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono outline-none focus:border-teal-600 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Açıklama / Dekont Notu</label>
                  <input
                    type="text"
                    value={bankNotes}
                    onChange={(e) => setBankNotes(e.target.value)}
                    placeholder={defaultNotePlaceholder || 'Toplu Aidat Ödemesi'}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs outline-none focus:border-teal-600 font-medium text-slate-900"
                  />
                </div>

                {/* Banka Dekontu PDF / Görsel Yükleme Alanı */}
                <div className="pt-2 border-t border-slate-200/80">
                  <label className="text-slate-700 font-bold block mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText size={13} className="text-teal-700" />
                      <span>Banka Dekontu (PDF / Görsel)</span>
                    </span>
                    <span className="text-[10px] text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded font-semibold">
                      Yönetim Onayı İçin
                    </span>
                  </label>

                  <input
                    ref={fileInputRef as any}
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    onChange={onFileUpload}
                    className="hidden"
                  />

                  {!receiptDataUrl ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-teal-600 bg-white hover:bg-teal-50/20 rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Upload size={15} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 group-hover:text-teal-800 block">
                          Dekont PDF veya Görsel Seç
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          PDF, PNG, JPEG veya WebP (Maks. 10 MB)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-teal-200 rounded-xl p-2.5 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {receiptFileName}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium">
                            <span>{receiptFileSize}</span>
                            <span>•</span>
                            <span className="text-teal-700 font-semibold">Hazır ✓</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={onPreviewReceipt}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                        >
                          Önizle
                        </button>
                        <button
                          type="button"
                          onClick={onRemoveReceipt}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                          title="Dekontu Kaldır"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2.5 text-xs">
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
                  <span className="font-bold block">Sanal POS Komisyonu Bilgilendirmesi</span>
                  <span>
                    Net tutar {baseInvoiceAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    üzerine banka komisyonu (%5:{' '}
                    {cardCommissionAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺)
                    eklenmiştir.
                  </span>
                </div>

                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Kart Numarası</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono outline-none focus:border-teal-600 font-medium text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Son Kullanma</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono outline-none focus:border-teal-600 font-medium text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">CVV / CVC</label>
                    <input
                      type="text"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono outline-none focus:border-teal-600 font-medium text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Ödeme Onay Butonu */}
            <button
              type="button"
              disabled={paying}
              onClick={onConfirmPayment}
              className="w-full h-11 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-lg font-bold text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <CreditCard size={16} />
              <span>
                {paying
                  ? 'Ödeme İşleniyor...'
                  : selectedInvoices.length > 1
                  ? `Seçili ${selectedInvoices.length} Borcu Öde (${(payMethod === 'card'
                      ? totalCardAmount
                      : totalBankAmount
                    ).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺)`
                  : `Hemen Öde (${(payMethod === 'card' ? totalCardAmount : totalBankAmount).toLocaleString(
                      'tr-TR',
                      { minimumFractionDigits: 2 }
                    )} ₺)`}
              </span>
            </button>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            Lütfen sol taraftan ödemek istediğiniz faturaları işaretleyiniz.
          </div>
        )}
      </div>

      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>256-bit SSL ve 3D Secure güvencesiyle</span>
        <span className="text-teal-800 font-semibold">Resmi Tahsilat</span>
      </div>
    </div>
  );
};
