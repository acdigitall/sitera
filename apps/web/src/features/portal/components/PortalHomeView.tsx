import React from 'react';
import {
  Bell,
  CreditCard,
  Building2,
  Calendar,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../auth';
import { Badge } from '../../../components/common/Badge';

interface PortalHomeViewProps {
  onNavigate: (tab: any) => void;
}

export const PortalHomeView: React.FC<PortalHomeViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const recentAnnouncements = [
    {
      id: '1',
      title: 'Aylık Bina & Tesis Bakımı Hakkında',
      date: '30 Ağustos 2026',
      category: 'Bakım',
      summary: 'Perşembe günü 10:00 - 13:00 saatleri arasında hidrofor ve asansör rutin bakımı yapılacaktır.',
      isImportant: true,
    },
    {
      id: '2',
      title: 'Eylül 2026 Aidat Bildirimi',
      date: '28 Ağustos 2026',
      category: 'Aidat',
      summary: 'Eylül ayı bina ortak gider aidatları hesaplanmış olup son ödeme tarihi 15 Eylül’dür.',
      isImportant: false,
    },
  ];

  const pendingPayments = [
    {
      id: 'p-1',
      title: 'Ağustos 2026 Aidat Ödemesi',
      amount: '1.250 ₺',
      dueDate: '31 Ağustos 2026',
      status: 'pending',
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* 1. Welcome Hero Card */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white/5 backdrop-blur-3xl transform skew-x-12 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-wide backdrop-blur-sm flex items-center gap-1">
                <Sparkles size={12} /> Sakin Portalı
              </span>
              <span className="text-indigo-100 text-xs font-medium">
                {user?.group?.name || 'Sitera Rezidans'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Hoş Geldiniz, {user?.name}!
            </h1>
            <p className="text-xs text-indigo-100 mt-1 max-w-xl leading-relaxed">
              Dairenize ait aidat ve ödemelerinizi takip edebilir, bina yönetiminin en güncel duyurularına anında ulaşabilirsiniz.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('portal_payments')}
              className="px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0"
            >
              <CreditCard size={15} />
              <span>Ödemelerime Git</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Daire & Organizasyon */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Bağlı Daire / Birim
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-1">
              {user?.name.includes('Daire') ? user.name : 'Daire Sakini'}
            </div>
            <div className="text-xs text-indigo-600 font-medium mt-1 flex items-center gap-1">
              <Building2 size={13} />
              <span>{user?.group?.name || 'Sitera Teknoloji'}</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Building2 size={22} />
          </div>
        </div>

        {/* Card 2: Güncel Borç Durumu */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Toplam Bekleyen Borç
            </span>
            <div className="text-2xl font-extrabold text-amber-600 mt-1 font-mono">
              1.250 ₺
            </div>
            <div className="text-xs text-amber-600 font-medium mt-1 flex items-center gap-1">
              <Clock size={13} />
              <span>Son Ödeme: 31 Ağustos</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <CreditCard size={22} />
          </div>
        </div>

        {/* Card 3: Güvenlik ve İzolasyon */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Hesap Durumu
            </span>
            <div className="text-xl font-extrabold text-emerald-600 mt-1 flex items-center gap-1.5">
              <CheckCircle2 size={18} />
              <span>Aktif Sakin</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <ShieldCheck size={13} className="text-indigo-600" />
              <span>RLS ile Güvenli Veri</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <ShieldCheck size={22} />
          </div>
        </div>
      </div>

      {/* 3. Main Content Split: Duyurular & Ödemeler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Son Duyurular */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Bell size={16} />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Yönetimden Son Duyurular</h3>
            </div>
            <button
              onClick={() => onNavigate('portal_announcements')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              <span>Tümünü Gör</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-3.5">
            {recentAnnouncements.map((ann) => (
              <div
                key={ann.id}
                onClick={() => onNavigate('portal_announcements')}
                className="p-4 rounded-xl border border-slate-200/90 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                      {ann.title}
                    </span>
                    {ann.isImportant && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle size={10} /> Önemli
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium shrink-0">
                    {ann.date}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {ann.summary}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Bina yönetimi tarafından yayınlanan resmi bilgilendirmeler</span>
            <span className="text-indigo-600 font-semibold cursor-pointer" onClick={() => onNavigate('portal_announcements')}>
              2 yeni duyuru
            </span>
          </div>
        </div>

        {/* Right 1 Col: Bekleyen Ödeme Özeti */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <CreditCard size={16} />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Ödeme Durumu</h3>
            </div>
            <Badge variant="warning" size="sm">
              1 Bekleyen
            </Badge>
          </div>

          <div className="p-5 flex flex-col gap-4">
            {pendingPayments.map((p) => (
              <div key={p.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-900 mb-1">{p.title}</div>
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-[11px] text-slate-500">Tutar:</span>
                  <span className="text-lg font-extrabold text-slate-900 font-mono">{p.amount}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 mb-4">
                  <span>Son Ödeme Tarihi:</span>
                  <span className="font-medium text-amber-700">{p.dueDate}</span>
                </div>
                <button
                  onClick={() => onNavigate('portal_payments')}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <CreditCard size={14} />
                  <span>Şimdi Öde</span>
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 text-center">
            Ödemeleriniz anında yönetime iletilir.
          </div>
        </div>
      </div>
    </div>
  );
};
