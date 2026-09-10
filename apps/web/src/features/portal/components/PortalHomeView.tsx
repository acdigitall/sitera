import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Landmark,
  Receipt,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../auth';
import { useFinance } from '../../finance';
import { useAnnouncements } from '../../announcements';

interface PortalHomeViewProps {
  groupId?: string;
  onNavigate?: (tab: any) => void;
}

export const PortalHomeView: React.FC<PortalHomeViewProps> = ({ groupId, onNavigate }) => {
  const { user, selectedUnit, setSelectedUnit } = useAuth();
  const navigate = useNavigate();
  const effectiveGroupId = groupId || user?.groupId;
  const userUnits = user?.units && user.units.length > 0 ? user.units : (user?.name ? [user.name] : []);
  const hasMultipleUnits = userUnits.length > 1;

  const activeUnitFilter = selectedUnit === 'all' ? undefined : (selectedUnit || undefined);
  const { debts } = useFinance(effectiveGroupId, user?.id, activeUnitFilter);
  const { announcements, unreadCount } = useAnnouncements(effectiveGroupId, user?.id);

  const tenantSlug =
    user?.group?.slug ||
    (user?.group?.name
      ? user.group.name
          .toLowerCase()
          .replace(/ğ/g, 'g')
          .replace(/ü/g, 'u')
          .replace(/ş/g, 's')
          .replace(/ı/g, 'i')
          .replace(/ö/g, 'o')
          .replace(/ç/g, 'c')
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
      : 'site');

  const getTenantPath = (path: string) => `/${tenantSlug}${path}`;

  const goToPayments = () => {
    if (onNavigate) {
      onNavigate('portal_payments');
    } else {
      navigate(getTenantPath('/portal/payments'));
    }
  };

  const goToAnnouncements = () => {
    if (onNavigate) {
      onNavigate('portal_announcements');
    } else {
      navigate(getTenantPath('/portal/announcements'));
    }
  };

  const urgentAnnouncement = useMemo(
    () => announcements.find((a) => a.isImportant),
    [announcements],
  );

  const recentAnnouncements = useMemo(
    () =>
      announcements.slice(0, 3).map((a) => ({
        id: a.id,
        title: a.title,
        date: new Date(a.createdAt).toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        category: a.category,
        summary: a.content.slice(0, 140) + (a.content.length > 140 ? '...' : ''),
        isImportant: a.isImportant,
      })),
    [announcements],
  );

  const pendingDebts = useMemo(() => debts.filter((d) => d.status !== 'paid'), [debts]);
  const paidDebts = useMemo(() => debts.filter((d) => d.status === 'paid'), [debts]);
  const totalPendingAmount = useMemo(
    () => pendingDebts.reduce((sum, d) => sum + (Number((d as any).totalWithLateFee || d.amount) - Number(d.paidAmount)), 0),
    [pendingDebts],
  );
  const totalPaidAmount = useMemo(
    () => paidDebts.reduce((sum, d) => sum + Number(d.paidAmount || d.amount), 0),
    [paidDebts],
  );
  const totalTahakkuk = totalPendingAmount + totalPaidAmount;
  const collectionRate = totalTahakkuk > 0 ? Math.round((totalPaidAmount / totalTahakkuk) * 100) : 100;

  const nearestPending = pendingDebts[0];

  return (
    <div className="space-y-6 max-w-full animate-fade-in pb-12">
      {/* 0. Acil Bildirim Bandı (Varsa En Üstte Sitera Kurumsal Uyarı) */}
      {urgentAnnouncement && (
        <div
          onClick={goToAnnouncements}
          className="bg-white border border-rose-300 border-l-4 border-l-rose-600 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-rose-50/20 cursor-pointer hover:border-rose-400 transition-colors"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0 mt-0.5">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                  Acil Yönetim Bildirimi
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {new Date(urgentAnnouncement.createdAt).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <h4 className="font-bold text-base text-slate-900 mt-1">{urgentAnnouncement.title}</h4>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed max-w-3xl">
                {urgentAnnouncement.content}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToAnnouncements();
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
          >
            Detayını Oku →
          </button>
        </div>
      )}

      {/* 1. FLUSH PAGE HEADER (Admin Dashboard ile Birebir Uyumlu Başlık) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Sakin Portalı & Daire Durumu
            </h1>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-md">
              {hasMultipleUnits
                ? selectedUnit === 'all'
                  ? `${userUnits.join(' & ')} (${userUnits.length} Daire)`
                  : selectedUnit
                : (userUnits[0] || 'Daire')}{' '}
              · {user?.residentType === 'tenant' ? 'Kiracı Sakin' : user?.residentType === 'both' ? 'Ev Sahibi (İkamet Eden)' : 'Kat Maliki'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {user?.group?.name || 'Gencosman Apartmanı'} · Hoş Geldiniz, {user?.name || 'Sayın Sakin'}
          </p>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={goToAnnouncements}
            className="h-10 inline-flex items-center gap-2 px-4 text-sm font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-lg shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Bell size={15} className="text-teal-700" />
            <span>Duyurular {unreadCount > 0 && `(${unreadCount})`}</span>
          </button>

          <button
            type="button"
            onClick={goToPayments}
            className="h-10 inline-flex items-center gap-2 px-4 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <CreditCard size={15} />
            <span>Aidat & Borç Öde</span>
          </button>
        </div>
      </div>

      {/* Çoklu Daireye Sahip Kullanıcı İçin Hızlı Daire Seçim Sekmeleri */}
      {hasMultipleUnits && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-teal-700" />
            <span className="text-xs font-bold text-slate-800">
              Kayıtlı Bağımsız Bölümleriniz ({userUnits.length} Daire):
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

      {/* 2. 3'LÜ KPI VARLIK KARTLARI (Tıklanabilir ve Yönlendirilebilir) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Kart 1: Toplam Bekleyen Borç (Top Teal Border) */}
        <div
          onClick={goToPayments}
          className="animate-card animate-card-1 bg-white border border-slate-300 border-t-[3px] border-t-teal-600 rounded-xl p-5 shadow-xs flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-slate-400 transition-all group"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                Toplam Bekleyen Borç
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                totalPendingAmount > 0 ? 'text-rose-800 bg-rose-50' : 'text-teal-800 bg-teal-50'
              }`}>
                {pendingDebts.length} Fatura
              </span>
            </div>
            <div className="text-sm text-slate-500 mt-1 font-medium">Ödenmesi gereken cari aidat/demirbaş</div>

            <div className="mt-4">
              <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                {totalPendingAmount.toLocaleString('tr-TR')} ₺
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                {nearestPending
                  ? `En yakın vade: ${new Date(nearestPending.dueDate).toLocaleDateString('tr-TR')}`
                  : 'Tüm borçlar ödendi'}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Durum: {totalPendingAmount > 0 ? 'Ödeme Bekleniyor' : 'Borçsuz Daire'}</span>
            <span className="text-teal-700 font-bold group-hover:underline flex items-center gap-0.5">
              <span>{totalPendingAmount > 0 ? 'Öde' : 'Detay'}</span>
              <ChevronRight size={13} />
            </span>
          </div>
        </div>

        {/* Kart 2: 2026 Ödenen Aidatlar */}
        <div
          onClick={goToPayments}
          className="animate-card animate-card-2 bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-slate-400 transition-all group"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                Ödenen Aidatlar
              </span>
              <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                {paidDebts.length} Makbuz
              </span>
            </div>
            <div className="text-sm text-slate-500 mt-1 font-medium">Bu yıl bankaya geçen ödemeler</div>

            <div className="mt-4">
              <div className="text-3xl font-bold text-teal-900 tracking-tight tabular-nums">
                {totalPaidAmount.toLocaleString('tr-TR')} ₺
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                Düzenli ödenen toplam aidat bedeli
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Resmi işletme defteri kayıtlı</span>
            <span className="text-teal-700 font-semibold group-hover:underline flex items-center gap-0.5">
              <span>Makbuzlar</span>
              <ChevronRight size={13} />
            </span>
          </div>
        </div>

        {/* Kart 3: Yönetim Duyuru Panosu */}
        <div
          onClick={goToAnnouncements}
          className="animate-card animate-card-3 bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-slate-400 transition-all group"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                Yönetim Bülteni
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                unreadCount > 0 ? 'text-amber-800 bg-amber-50' : 'text-slate-600 bg-slate-100'
              }`}>
                {unreadCount > 0 ? `${unreadCount} Yeni` : 'Güncel'}
              </span>
            </div>
            <div className="text-sm text-slate-500 mt-1 font-medium">Site yönetiminden resmi bilgilendirmeler</div>

            <div className="mt-4">
              <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                {announcements.length} Duyuru
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                {unreadCount > 0 ? `${unreadCount} adet okunmamış bildiriminiz var` : 'Tüm duyurular okundu'}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>KMK m. 34 Resmi İlan Panosu</span>
            <span className="text-teal-700 font-bold group-hover:underline flex items-center gap-0.5">
              <span>İncele</span>
              <ChevronRight size={13} />
            </span>
          </div>
        </div>
      </div>

      {/* 3. DÖNEM BÜTÇE & AİDAT GERÇEKLEŞME BANDI (Admin Dashboard ile Birebir) */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-base font-bold text-slate-900">2026 Yılı Daire Aidat Durumu</div>
            <div className="text-xs sm:text-sm text-slate-500 mt-0.5">Dairenize tahakkuk eden aidatların ödenme oranı ve cari durum</div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-sm font-bold text-teal-900 bg-teal-50 border border-teal-200 px-3 py-1 rounded-lg">
              %{collectionRate} Ödendi
            </span>
          </div>
        </div>

        {/* Progress Line */}
        <div className="mt-3.5 h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div style={{ width: `${collectionRate}%` }} className="bg-teal-700 h-full rounded-l-full" />
          <div style={{ width: `${100 - collectionRate}%` }} className="bg-rose-500/80 h-full rounded-r-full" />
        </div>

        {/* 4 Clean Metric Pillars */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-3.5 border-t border-slate-100 text-sm">
          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Toplam Tahakkuk</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {totalTahakkuk.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{debts.length} adet dönem borcu</div>
          </div>

          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Ödenen Tutar</div>
            <div className="text-xl sm:text-2xl font-bold text-teal-900 mt-1 tabular-nums">
              {totalPaidAmount.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{paidDebts.length} adet ödendi</div>
          </div>

          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Kalan Borç Tutarı</div>
            <div className="text-xl sm:text-2xl font-bold text-rose-700 mt-1 tabular-nums">
              {totalPendingAmount.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{pendingDebts.length} ödenmemiş fatura</div>
          </div>

          <div
            onClick={goToPayments}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Ödeme Kolaylığı</div>
            <div className="text-xl sm:text-2xl font-bold text-teal-800 mt-1 flex items-center gap-1">
              <span>Havale & Kart</span>
              <ChevronRight size={16} />
            </div>
            <div className="text-xs text-slate-400 mt-0.5">FAST (0 ₺) veya Kart (%5)</div>
          </div>
        </div>
      </div>

      {/* 4. İKİ SÜTUNLU OPERASYONEL PANEL (Admin Dashboard 7+5 Grid Düzeni) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Sol Sütun (7 Kolon): Yönetimden Son Duyurular */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-teal-700" />
                <span className="text-base font-bold text-slate-900">Yönetimden Son Duyurular</span>
              </div>
              <button
                type="button"
                onClick={goToAnnouncements}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <span>Tümünü Gör</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  onClick={goToAnnouncements}
                  className="py-4 hover:bg-slate-50/70 -mx-2 px-3 rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {ann.category}
                      </span>
                      {ann.isImportant && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                          Önemli
                        </span>
                      )}
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-teal-800 transition-colors">
                        {ann.title}
                      </h4>
                    </div>
                    <span className="text-xs text-slate-400 font-mono shrink-0">{ann.date}</span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                    {ann.summary}
                  </p>
                </div>
              ))}

              {recentAnnouncements.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-400">
                  Henüz yayınlanmış bir duyuru bulunmuyor.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Site Yönetim Kurulu resmi tebligatları</span>
            <span
              className="text-teal-700 font-bold hover:underline cursor-pointer"
              onClick={goToAnnouncements}
            >
              {announcements.length} Bildirim Mevcut →
            </span>
          </div>
        </div>

        {/* Sağ Sütun (5 Kolon): En Yakın Ödeme Özeti */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-teal-700" />
                <span className="text-base font-bold text-slate-900">Vadesi Gelen Borç</span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                pendingDebts.length > 0 ? 'text-amber-800 bg-amber-50 border border-amber-200' : 'text-teal-800 bg-teal-50'
              }`}>
                {pendingDebts.length > 0 ? `${pendingDebts.length} Bekleyen` : 'Borçsuz'}
              </span>
            </div>

            {nearestPending ? (
              <div className="space-y-4 pt-3">
                <div
                  onClick={goToPayments}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 cursor-pointer hover:border-slate-300 transition-colors"
                >
                  <div className="text-xs font-bold text-slate-900">{nearestPending.title}</div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-xs text-slate-500">Ödenecek Tutar:</span>
                    <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                      {Number((nearestPending as any).totalWithLateFee || nearestPending.amount).toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 pt-1 border-t border-slate-200">
                    <span>Son Ödeme Vadesi:</span>
                    <span className="font-semibold text-rose-700">
                      {new Date(nearestPending.dueDate).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-teal-50/60 border border-teal-200/80 rounded-lg text-xs space-y-1 text-slate-600">
                  <div className="font-bold text-teal-950">Ödeme Seçenekleri:</div>
                  <div>• <strong>Banka FAST / Havale:</strong> Komisyonsuz (0 ₺ masraf)</div>
                  <div>• <strong>Kredi Kartı:</strong> %5 sanal POS komisyonuyla anında</div>
                </div>

                <button
                  type="button"
                  onClick={goToPayments}
                  className="w-full h-11 inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <CreditCard size={16} />
                  <span>Hemen Borç Öde ({Number((nearestPending as any).totalWithLateFee || nearestPending.amount).toLocaleString('tr-TR')} ₺)</span>
                </button>
              </div>
            ) : (
              <div className="py-12 text-center flex flex-col items-center gap-2 text-slate-400">
                <CheckCircle2 size={36} className="text-teal-600" />
                <div className="font-bold text-slate-800 text-sm mt-1">Tüm Aidatlar Ödendi</div>
                <p className="text-xs text-slate-500 max-w-xs">
                  Dairenize tahakkuk ettirilmiş bekleyen bir borç bulunmamaktadır.
                </p>
                <button
                  type="button"
                  onClick={goToPayments}
                  className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Geçmiş Makbuzları Gör →
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Dijital makbuzunuz anında üretilir.</span>
            <span
              className="text-teal-800 font-semibold hover:underline cursor-pointer"
              onClick={goToPayments}
            >
              Güvenli Tahsilat →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
