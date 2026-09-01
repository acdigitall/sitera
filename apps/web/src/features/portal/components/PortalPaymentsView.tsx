import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Receipt,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';

export const PortalPaymentsView: React.FC = () => {
  const [payments, setPayments] = useState([
    {
      id: 'INV-2026-08',
      title: 'Ağustos 2026 Aidat & Ortak Gider',
      period: 'Ağustos 2026',
      amount: '1.250 ₺',
      dueDate: '31 Ağustos 2026',
      status: 'pending', // 'pending' | 'paid'
      category: 'Aidat',
      paidDate: null,
    },
    {
      id: 'INV-2026-07',
      title: 'Temmuz 2026 Aidat & Ortak Gider',
      period: 'Temmuz 2026',
      amount: '1.250 ₺',
      dueDate: '31 Temmuz 2026',
      status: 'paid',
      category: 'Aidat',
      paidDate: '25 Temmuz 2026',
    },
    {
      id: 'INV-2026-06',
      title: 'Haziran 2026 Aidat & Ortak Gider',
      period: 'Haziran 2026',
      amount: '1.150 ₺',
      dueDate: '30 Haziran 2026',
      status: 'paid',
      category: 'Aidat',
      paidDate: '28 Haziran 2026',
    },
    {
      id: 'INV-2026-05',
      title: 'Mayıs 2026 Çatı İzolasyon Katkı Payı',
      period: 'Mayıs 2026',
      amount: '750 ₺',
      dueDate: '31 Mayıs 2026',
      status: 'paid',
      category: 'Demirbaş',
      paidDate: '20 Mayıs 2026',
    },
  ]);

  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paying, setPaying] = useState(false);

  const pendingTotal = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + parseInt(p.amount.replace(/[^0-9]/g, '')), 0);

  const paidTotal = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + parseInt(p.amount.replace(/[^0-9]/g, '')), 0);

  const handlePay = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsPayModalOpen(true);
    setIsSuccess(false);
  };

  const confirmPayment = () => {
    setPaying(true);
    setTimeout(() => {
      setPayments((prev) =>
        prev.map((p) =>
          p.id === selectedInvoice.id
            ? { ...p, status: 'paid', paidDate: '30 Ağustos 2026' }
            : p
        )
      );
      setPaying(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsPayModalOpen(false);
        setIsSuccess(false);
      }, 1500);
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* 1. Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Pending */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Toplam Bekleyen Borç
            </span>
            <div className="text-2xl font-extrabold text-amber-600 mt-1 font-mono">
              {pendingTotal.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-amber-700 font-medium mt-1">
              1 Adet Ödenmemiş Fatura
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock size={22} />
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Bu Yıl Yapılan Ödemeler
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1 font-mono">
              {paidTotal.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-emerald-700 font-medium mt-1">
              3 Adet Makbuzlu Ödeme
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Payment Security */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Güvenli Ödeme Altyapısı
            </span>
            <div className="text-base font-extrabold text-indigo-700 mt-1">
              256-Bit SSL Korumalı
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-600" />
              <span>Anlık Dijital Makbuz</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <CreditCard size={22} />
          </div>
        </div>
      </div>

      {/* 2. Invoices & Dues Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Aidat ve Gider Dökümü</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Toplam {payments.length} dönem kaydı
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                <th className="py-3 px-5">Fatura No & Açıklama</th>
                <th className="py-3 px-5">Dönem</th>
                <th className="py-3 px-5">Kategori</th>
                <th className="py-3 px-5">Tutar</th>
                <th className="py-3 px-5">Son Ödeme</th>
                <th className="py-3 px-5">Durum</th>
                <th className="py-3 px-5 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {payments.map((p) => {
                const isPaid = p.status === 'paid';

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900 text-sm">{p.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{p.id}</div>
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-700">{p.period}</td>
                    <td className="py-3.5 px-5">
                      <Badge variant={p.category === 'Aidat' ? 'primary' : 'secondary'} size="sm">
                        {p.category}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5 font-bold font-mono text-slate-900 text-sm">
                      {p.amount}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-medium">{p.dueDate}</td>
                    <td className="py-3.5 px-5">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span>Ödendi ({p.paidDate})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-xs">
                          <Clock size={13} className="text-amber-600" />
                          <span>Bekliyor</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {isPaid ? (
                        <button
                          onClick={() => alert(`Makbuz indirildi: ${p.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Download size={13} />
                          <span>Makbuz</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePay(p)}
                          className="btn btn-primary text-xs py-1.5 px-3.5"
                        >
                          <CreditCard size={13} />
                          <span>Öde</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => !paying && setIsPayModalOpen(false)}
          title="Online Aidat Ödeme"
          icon={<CreditCard size={20} className="text-indigo-600" />}
        >
          {isSuccess ? (
            <div className="py-8 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
                <Check size={24} />
              </div>
              <h4 className="font-extrabold text-slate-900 text-base">Ödemeniz Başarıyla Alındı!</h4>
              <p className="text-xs text-slate-500">
                Dijital makbuzunuz oluşturuldu ve hesabınız güncellendi.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-xs text-slate-500">Ödenecek Fatura:</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedInvoice.title}</div>
                <div className="flex justify-between items-baseline mt-2 pt-2 border-t border-slate-200">
                  <span className="text-xs text-slate-500">Ödenecek Tutar:</span>
                  <span className="text-xl font-extrabold text-slate-900 font-mono">
                    {selectedInvoice.amount}
                  </span>
                </div>
              </div>

              {/* Card Inputs Mock */}
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Kart Numarası</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500 shadow-sm"
                    defaultValue="5421 •••• •••• 8842"
                    readOnly
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Son Kullanma</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono outline-none shadow-sm"
                      defaultValue="08/29"
                      readOnly
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">CVC / CVV</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono outline-none shadow-sm"
                      defaultValue="•••"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={paying}
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  type="button"
                  disabled={paying}
                  onClick={confirmPayment}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {paying ? 'Ödeme İşleniyor...' : `${selectedInvoice.amount} Ödemeyi Onayla`}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
