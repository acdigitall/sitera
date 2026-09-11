import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Download,
  AlertTriangle,
  Info,
  Shield,
  Clock,
  User,
  Activity,
  ChevronDown,
  ChevronUp,
  FileCode,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../auth';
import { useAuditLogs } from '../useAuditLogs';
import { AuditLog, AuditLogCategory, AuditLogLevel } from '@sitera/shared';

interface AdminAuditLogsViewProps {
  groupId?: string;
  activeGroup?: any;
}

export const AdminAuditLogsView: React.FC<AdminAuditLogsViewProps> = ({ groupId, activeGroup }) => {
  const { user } = useAuth();
  const effectiveGroupId = groupId || user?.groupId;

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const { logs, loading, refetch } = useAuditLogs({
    groupId: effectiveGroupId,
    category: selectedCategory,
    search: searchQuery,
    limit: 100,
  });

  // Client-side quick filter
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (selectedCategory !== 'ALL' && l.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAction = l.action.toLowerCase().includes(q);
        const matchesUser = l.userName ? l.userName.toLowerCase().includes(q) : false;
        const matchesResource = l.resource ? l.resource.toLowerCase().includes(q) : false;
        const matchesIp = l.ipAddress ? l.ipAddress.toLowerCase().includes(q) : false;
        if (!matchesAction && !matchesUser && !matchesResource && !matchesIp) return false;
      }
      return true;
    });
  }, [logs, selectedCategory, searchQuery]);

  // KPI Metrics
  const totalEvents = logs.length;
  const authEvents = logs.filter((l) => l.category === 'AUTH').length;
  const financeEvents = logs.filter((l) => l.category === 'FINANCE' || l.category === 'EXPENSE').length;
  const securityEvents = logs.filter((l) => l.category === 'SECURITY' || l.level === 'SECURITY').length;

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Tarih', 'Kullanıcı', 'Rol', 'Kategori', 'Düzey', 'İşlem', 'Kaynak', 'IP'];
    const rows = filteredLogs.map((l) => [
      new Date(l.createdAt).toLocaleString('tr-TR'),
      l.userName || 'Sistem',
      l.userRole || 'admin',
      l.category,
      l.level,
      l.action,
      l.resource || '',
      l.ipAddress || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sitera_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-full animate-fade-in pb-16">
      {/* 1. FLUSH PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="text-teal-700" size={26} />
              <span>Audit Log & Güvenlik Denetimi</span>
            </h1>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-md">
              PostgreSQL RLS Aktif
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {activeGroup?.name || user?.group?.name || 'Tüm Siteler'} · Kullanıcı girişleri, tahsilat onayları, masraf dağıtımı ve veri güvenliği kayıtları
          </p>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="h-10 inline-flex items-center gap-2 px-3.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download size={14} className="text-slate-500" />
            <span>CSV Dışa Aktar</span>
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={loading}
            className="h-10 inline-flex items-center gap-2 px-4 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={`text-teal-700 ${loading ? 'animate-spin' : ''}`} />
            <span>Canlı Yenile</span>
          </button>
        </div>
      </div>

      {/* 2. 4'LÜ KPI KARTLARI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 relative overflow-hidden border-t-4 border-t-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Toplam Olay
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Activity size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            {totalEvents}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Sistemde kayıtlı tüm denetim hareketleri
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 relative overflow-hidden border-t-4 border-t-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Oturum Hareketleri
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <User size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-2 font-mono">
            {authEvents}
          </div>
          <p className="text-[11px] text-blue-700 font-medium mt-1">
            Giriş, çıkış ve oturum denemeleri
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 relative overflow-hidden border-t-4 border-t-teal-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Finansal İşlemler
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-teal-900 mt-2 font-mono">
            {financeEvents}
          </div>
          <p className="text-[11px] text-teal-700 font-medium mt-1">
            Tahsilat onayı, gider dağıtımı ve nakit
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 relative overflow-hidden border-t-4 border-t-purple-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Güvenlik & RLS
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Shield size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-900 mt-2 font-mono">
            {securityEvents}
          </div>
          <p className="text-[11px] text-purple-700 font-medium mt-1">
            Tenant session erişim ve yetki denetimleri
          </p>
        </div>
      </div>

      {/* 3. FİLTRE VE ARAMA ÇUBUĞU */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Kategori Filtre Butonları */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'Tümü' },
            { id: 'AUTH', label: '🔐 Oturum' },
            { id: 'FINANCE', label: '💰 Finans' },
            { id: 'EXPENSE', label: '📊 Gider Dağıtım' },
            { id: 'TICKET', label: '🛠️ Sakin Talepleri' },
            { id: 'SECURITY', label: '🛡️ Güvenlik' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Arama Kutusu */}
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="İşlem, kullanıcı veya IP ara..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
          />
        </div>
      </div>

      {/* 4. CANLI AUDIT LOG TABLOSU */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Tarih & Saat</th>
                <th className="py-3 px-4">Kullanıcı</th>
                <th className="py-3 px-4">Kategori & Düzey</th>
                <th className="py-3 px-4">İşlem (Action)</th>
                <th className="py-3 px-4">Hedef Kaynak</th>
                <th className="py-3 px-4">IP Adresi</th>
                <th className="py-3 px-4 text-right">Detay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Denetim kayıtları yükleniyor...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Seçilen kriterlere uygun denetim kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const isSecurity = log.category === 'SECURITY' || log.level === 'SECURITY';
                  const isWarn = log.level === 'WARN';

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-slate-50/60' : ''
                        }`}
                      >
                        {/* Zaman */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-900">
                            {new Date(log.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                          </span>
                        </td>

                        {/* Kullanıcı */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <User size={13} className="text-slate-400" />
                            <span>{log.userName || 'Sistem'}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {log.userRole ? `Rol: ${log.userRole}` : 'admin'}
                          </span>
                        </td>

                        {/* Kategori & Düzey */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                isSecurity
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : isWarn
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : log.category === 'AUTH'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-teal-50 text-teal-800 border-teal-200'
                              }`}
                            >
                              {log.category === 'AUTH' ? '🔐 ' + log.category : log.category}
                            </span>
                            <span
                              className={`text-[9px] font-bold font-mono px-1 py-0.2 rounded ${
                                isSecurity
                                  ? 'bg-purple-200/60 text-purple-900'
                                  : isWarn
                                  ? 'bg-amber-200/60 text-amber-900'
                                  : 'bg-slate-200/60 text-slate-700'
                              }`}
                            >
                              {log.level}
                            </span>
                          </div>
                        </td>

                        {/* İşlem Adı */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900 text-[11px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                            {log.action}
                          </span>
                        </td>

                        {/* Hedef Kaynak */}
                        <td className="py-3 px-4">
                          <span className="text-slate-800 font-medium">
                            {log.resource || '—'}
                          </span>
                        </td>

                        {/* IP Adresi */}
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {log.ipAddress || '127.0.0.1'}
                        </td>

                        {/* Detay Aç / Kapa Butonu */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSON details */}
                      {isExpanded && (
                        <tr className="bg-slate-900/5 border-y border-slate-200/80">
                          <td colSpan={7} className="p-4">
                            <div className="bg-slate-900 rounded-xl p-4 text-slate-200 font-mono text-[11px] space-y-2 overflow-x-auto shadow-inner">
                              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800 text-[10px]">
                                <span className="flex items-center gap-1.5">
                                  <FileCode size={13} className="text-teal-400" />
                                  <span>Olay Parametreleri & Metadata ({log.id})</span>
                                </span>
                                <span>{log.createdAt}</span>
                              </div>
                              <pre className="text-emerald-400 whitespace-pre-wrap">
                                {JSON.stringify(
                                  {
                                    id: log.id,
                                    groupId: log.groupId,
                                    action: log.action,
                                    category: log.category,
                                    level: log.level,
                                    userName: log.userName,
                                    userRole: log.userRole,
                                    resource: log.resource,
                                    details: log.details,
                                    ipAddress: log.ipAddress,
                                    userAgent: log.userAgent,
                                    createdAt: log.createdAt,
                                  },
                                  null,
                                  2
                                )}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
