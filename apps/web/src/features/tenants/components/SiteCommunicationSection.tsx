import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowRight, AlertCircle } from 'lucide-react';
import { SiteCommunicationQuota, MOCK_DISCLAIMER_TEXT } from '../services/communication-mock';

export interface SiteCommunicationSectionProps {
  commQuota: SiteCommunicationQuota;
  tenantSlug: string;
}

export const SiteCommunicationSection: React.FC<SiteCommunicationSectionProps> = ({
  commQuota,
  tenantSlug,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <MessageSquare size={15} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>İletişim &amp; Mesaj Paketleri</span>
              <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                Demo Simülasyon
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Bu sitede sakinlere gönderilen SMS ve WhatsApp şablon kotaları
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/${tenantSlug}/admin/messages`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>Tüm Sitelerin Paketlerini Gör</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Demo Uyarısı */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 mb-4 flex items-start gap-2.5 text-xs text-amber-900">
        <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Demo Bilgilendirmesi:</strong> {MOCK_DISCLAIMER_TEXT}
        </p>
      </div>

      {/* SMS ve WP Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SMS Sağlayıcı Kartı */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">SMS Paketi &amp; Sağlayıcı</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-bold">
                {commQuota.smsProvider}
              </span>
            </div>
            <div className="text-xs text-slate-500 mb-3">
              Başlık (Header): <strong className="text-slate-800 font-mono">{commQuota.smsHeader}</strong>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Toplam Kota:</span>
                <strong className="font-mono text-slate-900">{commQuota.smsTotalQuota.toLocaleString('tr-TR')} SMS</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Kullanılan:</span>
                <span className="font-mono text-slate-800">{commQuota.smsUsed.toLocaleString('tr-TR')} SMS (%{commQuota.smsUsagePercent})</span>
              </div>
              <div className="flex justify-between text-indigo-700 font-bold">
                <span>Kalan Kredi:</span>
                <span className="font-mono">{commQuota.smsRemaining.toLocaleString('tr-TR')} SMS</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2.5 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${Math.min(100, commQuota.smsUsagePercent)}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-400 flex justify-between">
            <span>Yenilenme: {commQuota.renewalDate}</span>
            <span className="text-slate-500 font-mono">₺{commQuota.monthlyCost}/ay</span>
          </div>
        </div>

        {/* WhatsApp Sağlayıcı Kartı */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">WhatsApp Business (WABA)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-bold">
                {commQuota.whatsappProvider}
              </span>
            </div>
            <div className="text-xs text-slate-500 mb-3">
              Onaylı No: <strong className="text-slate-800 font-mono">{commQuota.whatsappSenderPhone}</strong>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Aylık Mesaj Kotası:</span>
                <strong className="font-mono text-slate-900">{commQuota.whatsappTotalQuota.toLocaleString('tr-TR')} WP</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>İletilen Şablon:</span>
                <span className="font-mono text-slate-800">{commQuota.whatsappUsed.toLocaleString('tr-TR')} WP (%{commQuota.whatsappUsagePercent})</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Kalan Mesaj Kotası:</span>
                <span className="font-mono">{commQuota.whatsappRemaining.toLocaleString('tr-TR')} WP</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2.5 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${Math.min(100, commQuota.whatsappUsagePercent)}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-400 flex justify-between">
            <span>Meta Status: Hazır (Demo)</span>
            <span className="text-emerald-600 font-medium">Aktif</span>
          </div>
        </div>
      </div>
    </div>
  );
};
