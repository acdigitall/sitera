import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  X,
  AlertTriangle,
  Building2,
  Phone,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Info,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Group } from '@sitera/shared';
import { useNavigate } from 'react-router-dom';
import {
  getSiteCommunicationQuota,
  getCommunicationSummary,
  SiteCommunicationQuota,
  MOCK_DISCLAIMER_TEXT,
} from '../services/communication-mock';

interface CommunicationPackagesPageProps {
  groups: Group[];
  loading?: boolean;
  tenantSlug?: string;
}

export const CommunicationPackagesPage: React.FC<CommunicationPackagesPageProps> = ({
  groups,
  loading = false,
  tenantSlug = 'gencosman-apartmani',
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'warning' | 'healthy'>('all');
  const [providerFilter, setProviderFilter] = useState<'all' | 'Netgsm' | 'İletiMerkezi' | 'Mutlucell'>('all');

  // Detay Modalı
  const [selectedSiteQuota, setSelectedSiteQuota] = useState<SiteCommunicationQuota | null>(null);

  // Zenginleştirilmiş site kotaları
  const allQuotas = useMemo(() => {
    return groups.map((g) => getSiteCommunicationQuota(g));
  }, [groups]);

  // Özet İstatistikler
  const summary = useMemo(() => {
    return getCommunicationSummary(allQuotas);
  }, [allQuotas]);

  // Filtreleme
  const filteredQuotas = useMemo(() => {
    return allQuotas.filter((q) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = q.groupName.toLowerCase().includes(query);
        const matchSlug = q.groupSlug.toLowerCase().includes(query);
        const matchSmsHeader = q.smsHeader.toLowerCase().includes(query);
        const matchSmsProvider = q.smsProvider.toLowerCase().includes(query);
        const matchWpProvider = q.whatsappProvider.toLowerCase().includes(query);

        if (!matchName && !matchSlug && !matchSmsHeader && !matchSmsProvider && !matchWpProvider) {
          return false;
        }
      }

      if (statusFilter === 'critical') {
        if (q.smsStatus !== 'critical' && q.whatsappStatus !== 'critical') return false;
      } else if (statusFilter === 'warning') {
        if (
          (q.smsStatus !== 'warning' && q.whatsappStatus !== 'warning') ||
          q.smsStatus === 'critical' ||
          q.whatsappStatus === 'critical'
        ) {
          return false;
        }
      } else if (statusFilter === 'healthy') {
        if (q.smsStatus !== 'healthy' || q.whatsappStatus !== 'healthy') return false;
      }

      if (providerFilter !== 'all') {
        if (q.smsProvider !== providerFilter) return false;
      }

      return true;
    });
  }, [allQuotas, searchQuery, statusFilter, providerFilter]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full max-w-full overflow-hidden font-sans pb-16">
      {/* 1. Sayfa Başlığı ve Temel Açıklama */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              SMS &amp; WhatsApp İletişim Paketleri
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300/80 shadow-2xs">
              <AlertTriangle size={12} className="text-amber-600" />
              <span>Demo / Simülasyon Verisi</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Sitelerin kullandığı SMS, WhatsApp mesaj kotaları, sağlayıcı paketleri ve kalan bakiye takibi
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => navigate(`/${tenantSlug}/admin/sites`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <Building2 size={14} className="text-slate-500" />
            <span>Siteler Kataloğuna Dön</span>
          </button>
        </div>
      </div>

      {/* 2. DİKKAT ÇEKİCİ DUMMY / DEMO VERİ BİLGİLENDİRME BANNERI */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/70 rounded-xl p-4 flex items-start gap-3 shadow-2xs">
        <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs sm:text-sm font-bold text-amber-900 flex items-center gap-1.5 flex-wrap">
            <span>Sistem Bilgilendirmesi: Bu Veriler Simülasyondur (Dummy Data)</span>
            <span className="text-[11px] font-normal px-2 py-0.2 rounded bg-amber-200/60 text-amber-900 border border-amber-300/60">
              API Entegrasyonu Geliştirme Aşamasında
            </span>
          </div>
          <p className="text-xs text-amber-800/90 leading-relaxed mt-1">
            {MOCK_DISCLAIMER_TEXT} Netgsm, İletiMerkezi ve Meta Cloud API (WhatsApp Business) sağlayıcı bağlantıları
            canlı ortama alındığında buradaki veriler doğrudan operatör sunucularından anlık çekilecektir.
          </p>
        </div>
      </div>

      {/* 3. 4 Temel KPI Metrik Kartı */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Toplam SMS Kullanımı */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Kullanılan SMS</span>
            <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">
              <MessageSquare size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {summary.totalSmsUsed.toLocaleString('tr-TR')}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Kota: {summary.totalSmsQuota.toLocaleString('tr-TR')}</span>
              <span className="font-mono font-medium text-indigo-600">%{summary.smsOverallPercent}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, summary.smsOverallPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Kalan SMS Bakiyesi */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Kalan SMS Kotası</span>
            <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
              <Zap size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
              {summary.totalSmsRemaining.toLocaleString('tr-TR')}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Tüm sitelerde kalan toplam kredi
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">
              🟢 Genel bakiye yeterli
            </div>
          </div>
        </div>

        {/* WhatsApp Mesajları */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>WhatsApp (WP) Kullanımı</span>
            <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
              <Phone size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {summary.totalWpUsed.toLocaleString('tr-TR')}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Kalan: {summary.totalWpRemaining.toLocaleString('tr-TR')}</span>
              <span className="font-mono font-medium text-emerald-600">%{summary.wpOverallPercent}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, summary.wpOverallPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Kritik Kota / İnceleme Uyarısı */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Kritik Kota Durumu</span>
            <div className="w-6 h-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center text-xs">
              <AlertTriangle size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {summary.criticalSitesCount + summary.warningSitesCount} Site
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {summary.criticalSitesCount > 0 ? (
                <span className="text-rose-600 font-medium">
                  {summary.criticalSitesCount} site kritik seviyede (%90+)
                </span>
              ) : (
                <span className="text-slate-500">Tüm kotalar normal seviyede</span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              3 Sağlayıcı: Netgsm, İletiMerkezi, Mutlucell
            </div>
          </div>
        </div>
      </div>

      {/* 4. Arama, Filtreler ve Liste */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Arama Barı */}
          <div className="relative w-full lg:w-80">
            <Search size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Site adı, başlık (header) veya sağlayıcı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-400 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Durum & Sağlayıcı Filtreleri */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Kota Durumu */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tümü ({allQuotas.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('critical')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === 'critical'
                    ? 'bg-rose-50 text-rose-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                Kritik ({summary.criticalSitesCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('warning')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === 'warning'
                    ? 'bg-amber-50 text-amber-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                Azalan ({summary.warningSitesCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('healthy')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === 'healthy'
                    ? 'bg-emerald-50 text-emerald-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                Yeterli Bakiye
              </button>
            </div>

            {/* Sağlayıcı Seçici */}
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden focus:border-slate-400 cursor-pointer"
            >
              <option value="all">Tüm Sağlayıcılar</option>
              <option value="Netgsm">Netgsm</option>
              <option value="İletiMerkezi">İletiMerkezi</option>
              <option value="Mutlucell">Mutlucell</option>
            </select>
          </div>
        </div>

        {/* 5. İletişim Paketleri Tablosu */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-medium text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4 sm:px-6">Site / Apartman</th>
                <th className="py-2.5 px-4">SMS Sağlayıcısı &amp; Başlık</th>
                <th className="py-2.5 px-4">SMS Kotası &amp; Kullanım</th>
                <th className="py-2.5 px-4">WhatsApp (WP) Durumu</th>
                <th className="py-2.5 px-4">Bakiye Seviyesi</th>
                <th className="py-2.5 px-4">Entegrasyon Durumu</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredQuotas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertCircle size={20} className="mx-auto mb-1.5 text-slate-300" />
                    Arama kriterlerine uygun iletişim paketi bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredQuotas.map((quota) => {
                  const isSmsCritical = quota.smsStatus === 'critical';
                  const isWpCritical = quota.whatsappStatus === 'critical';

                  return (
                    <tr key={quota.groupId} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Site Adı & Daire Sayısı */}
                      <td className="py-3 px-4 sm:px-6">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{quota.groupName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {quota.totalUnits} Bağımsız Bölüm · {quota.packageTier}
                          </div>
                        </div>
                      </td>

                      {/* 2. SMS Sağlayıcı & Başlık */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900">{quota.smsProvider}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {quota.smsHeader}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Alfanümerik SMS Başlığı
                        </div>
                      </td>

                      {/* 3. SMS Kotası & Kullanım Barı */}
                      <td className="py-3 px-4">
                        <div className="w-48">
                          <div className="flex justify-between items-center text-[11px] mb-1">
                            <span className="font-mono font-medium text-slate-900">
                              {quota.smsUsed.toLocaleString('tr-TR')} / {quota.smsTotalQuota.toLocaleString('tr-TR')}
                            </span>
                            <span
                              className={`font-mono font-bold text-[11px] ${
                                isSmsCritical
                                  ? 'text-rose-600'
                                  : quota.smsStatus === 'warning'
                                  ? 'text-amber-600'
                                  : 'text-slate-600'
                              }`}
                            >
                              %{quota.smsUsagePercent}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isSmsCritical
                                  ? 'bg-rose-500'
                                  : quota.smsStatus === 'warning'
                                  ? 'bg-amber-500'
                                  : 'bg-indigo-500'
                              }`}
                              style={{ width: `${Math.min(100, quota.smsUsagePercent)}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                            Kalan: <strong className="text-slate-700">{quota.smsRemaining.toLocaleString('tr-TR')} SMS</strong>
                          </div>
                        </div>
                      </td>

                      {/* 4. WhatsApp Durumu */}
                      <td className="py-3 px-4">
                        <div className="w-44">
                          <div className="flex justify-between items-center text-[11px] mb-1">
                            <span className="font-semibold text-slate-800">{quota.whatsappProvider}</span>
                            <span
                              className={`font-mono font-bold text-[11px] ${
                                isWpCritical ? 'text-rose-600' : 'text-slate-600'
                              }`}
                            >
                              %{quota.whatsappUsagePercent}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isWpCritical ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, quota.whatsappUsagePercent)}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                            Kalan: <strong className="text-slate-700">{quota.whatsappRemaining} Mesaj</strong>
                          </div>
                        </div>
                      </td>

                      {/* 5. Bakiye Seviyesi */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isSmsCritical || isWpCritical ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            Kritik Bakiye
                          </span>
                        ) : quota.smsStatus === 'warning' || quota.whatsappStatus === 'warning' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Kota Azalıyor
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Yeterli Kredi
                          </span>
                        )}
                      </td>

                      {/* 6. Entegrasyon Durumu (Dummy Notu) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/80"
                          title={MOCK_DISCLAIMER_TEXT}
                        >
                          <span className="w-1 h-1 rounded-full bg-amber-500" />
                          <span>Demo / API Bekleniyor</span>
                        </span>
                      </td>

                      {/* 7. İşlemler */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedSiteQuota(quota)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <span>Paket Detayı</span>
                          <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. PAKET VE KOTA DETAY MODALI (DUMMY VURGULU) */}
      {selectedSiteQuota && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Başlık */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedSiteQuota.groupName}
                  </h3>
                  <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Demo Simülasyon
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedSiteQuota.totalUnits} Bağımsız Bölüm · {selectedSiteQuota.packageTier}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSiteQuota(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Uyarı Kutusu */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Gerçek Sağlayıcı Bağlantısı Henüz Yapılmamıştır</strong>
                {MOCK_DISCLAIMER_TEXT} Bu ekran, operatör API bağlantısı yapıldığında SMS ve WhatsApp kotalarının nasıl
                yösterileceğini görselleştirmektedir.
              </div>
            </div>

            {/* İki Sütunlu Sağlayıcı Kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* SMS Kartı */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-indigo-600" />
                      <span>SMS Paketi</span>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      {selectedSiteQuota.smsProvider}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mb-2">
                    Gönderici Başlığı: <strong className="text-slate-900">{selectedSiteQuota.smsHeader}</strong>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Toplam Paket:</span>
                      <strong className="font-mono">{selectedSiteQuota.smsTotalQuota.toLocaleString('tr-TR')} SMS</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Kullanılan:</span>
                      <span className="font-mono text-slate-900">{selectedSiteQuota.smsUsed.toLocaleString('tr-TR')} SMS</span>
                    </div>
                    <div className="flex justify-between text-indigo-700 font-bold">
                      <span>Kalan Kredi:</span>
                      <span className="font-mono">{selectedSiteQuota.smsRemaining.toLocaleString('tr-TR')} SMS</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Yenilenme: {selectedSiteQuota.renewalDate}</span>
                  <span className="text-indigo-600 font-mono font-medium">%{selectedSiteQuota.smsUsagePercent}</span>
                </div>
              </div>

              {/* WhatsApp Kartı */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Phone size={14} className="text-emerald-600" />
                      <span>WhatsApp Business</span>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      {selectedSiteQuota.whatsappProvider}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mb-2">
                    WABA No: <strong className="text-slate-900">{selectedSiteQuota.whatsappSenderPhone}</strong>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Aylık Mesaj Kotası:</span>
                      <strong className="font-mono">{selectedSiteQuota.whatsappTotalQuota.toLocaleString('tr-TR')} WP</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>İletilen Şablon:</span>
                      <span className="font-mono text-slate-900">{selectedSiteQuota.whatsappUsed.toLocaleString('tr-TR')} WP</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Kalan Bakiye:</span>
                      <span className="font-mono">{selectedSiteQuota.whatsappRemaining.toLocaleString('tr-TR')} WP</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Meta Cloud Status: OK</span>
                  <span className="text-emerald-600 font-mono font-medium">%{selectedSiteQuota.whatsappUsagePercent}</span>
                </div>
              </div>
            </div>

            {/* Son Gönderim Simülasyonu */}
            <div>
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Son İletişim Gönderimleri (Simüle Edilen)</span>
                <span className="text-[10px] text-slate-400 font-normal">Son 3 İşlem</span>
              </div>
              <div className="space-y-2">
                {selectedSiteQuota.recentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          msg.channel === 'WhatsApp'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {msg.channel}
                      </span>
                      <span className="font-medium text-slate-800">{msg.title}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-mono text-slate-500">
                        {msg.recipientCount} Kişiye İletildi
                      </div>
                      <div className="text-[10px] text-slate-400">{msg.sentAt}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kapat Butonu */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSiteQuota(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
