import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Send,
  Building2,
  ExternalLink,
  Search,
  Filter,
  ArrowRight,
  Lock,
  User,
  Phone,
  Mail,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  PlatformSupportTicket,
  SupportTicketCategory,
  SupportTicketStatus,
} from '@sitera/shared';
import { supportApi } from '../services/support.api';
import { useSupport } from '../context/SupportContext';
import { useAuth } from '../../auth';
import { useNavigate } from 'react-router-dom';

export const SuperAdminSupportPage: React.FC = () => {
  const { user } = useAuth();
  const { enterSupportMode } = useSupport();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<PlatformSupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<PlatformSupportTicket | null>(null);

  // Reply State
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await supportApi.getTickets();
      setTickets(data);
      if (selectedTicket) {
        const updated = data.find((t) => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'open'
        ? t.status === 'open' || t.status === 'in_progress'
        : t.status === filterStatus;

    const matchesSearch =
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.creatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const openCount = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;
  const allowAccessCount = tickets.filter((t) => t.allowSiteAccess).length;

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setReplying(true);
    try {
      const updated = await supportApi.addMessage(selectedTicket.id, {
        senderRole: 'superadmin',
        senderName: user?.name || 'Süper Admin',
        senderUserId: user?.id || 'usr-superadmin',
        content: replyText.trim(),
      });
      setSelectedTicket(updated);
      setReplyText('');
      loadTickets();
    } catch (err: any) {
      alert('Cevap gönderilemedi: ' + err.message);
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (status: SupportTicketStatus) => {
    if (!selectedTicket) return;
    setStatusUpdating(true);
    try {
      const updated = await supportApi.updateStatus(selectedTicket.id, status);
      setSelectedTicket(updated);
      loadTickets();
    } catch (err: any) {
      alert('Durum güncellenemedi: ' + err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleImpersonateSite = async (ticket: PlatformSupportTicket) => {
    if (!ticket.allowSiteAccess) {
      alert('Site yöneticisi uzaktan sisteme müdahale izni vermemiştir. Yalnızca mesaj ile destek verebilirsiniz.');
      return;
    }

    setImpersonating(true);
    try {
      const res = await supportApi.impersonateSite(ticket.id);

      enterSupportMode({
        ticketId: ticket.id,
        targetGroupId: ticket.groupId,
        targetGroupSlug: ticket.groupSlug,
        targetGroupName: ticket.groupName,
        reason: ticket.subject,
      });

      // Hedef sitenin genel bakış paneline yönlendir
      navigate(`/${ticket.groupSlug}/admin/overview`);
    } catch (err: any) {
      alert('Siteye destek girişi yapılamadı: ' + err.message);
    } finally {
      setImpersonating(false);
    }
  };

  const getCategoryLabel = (cat: SupportTicketCategory) => {
    switch (cat) {
      case 'finance_error':
        return 'Kasa & Aidat Hatası';
      case 'access_hardware':
        return 'Bariyer & Donanım';
      case 'resident_data':
        return 'Sakin & Daire Verisi';
      case 'system_bug':
        return 'Yazılım / Sistem Hatası';
      case 'general':
        return 'Genel Soru & Danışmanlık';
      default:
        return cat;
    }
  };

  return (
    <div className="space-y-6 max-w-full font-sans pb-16">
      {/* 1. FLUSH PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Destek Talepleri &amp; Site Müdahaleleri
            </h1>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
              Süper Admin
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Site yöneticilerinin açtığı teknik destek bildirimleri, mesajlaşma ve KVKK onaylı uzaktan müdahale oturumları
          </p>
        </div>

        <button
          type="button"
          onClick={loadTickets}
          className="h-10 px-4 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          Yenile
        </button>
      </div>

      {/* 2. STATS BANNER */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Toplam Bildirim</div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">{tickets.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Tüm sitelerden gelenler</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Bekleyen / İncelenen</div>
          <div className="text-2xl font-bold text-amber-700 font-mono mt-1">{openCount}</div>
          <div className="text-xs text-amber-600 font-medium mt-0.5">Yanıt bekleyen talepler</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Müdahale İzni Verilen</div>
          <div className="text-2xl font-bold text-emerald-800 font-mono mt-1">{allowAccessCount}</div>
          <div className="text-xs text-emerald-700 font-medium mt-0.5">KVKK uzaktan destek onaylı</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Çözülen Talepler</div>
          <div className="text-2xl font-bold text-slate-700 font-mono mt-1">{resolvedCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">Başarıyla kapatıldı</div>
        </div>
      </div>

      {/* 3. FİLTRELER & ARAMA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tümü ({tickets.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('open')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === 'open'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Bekleyenler ({openCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('resolved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === 'resolved'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Çözülenler ({resolvedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Site, yönetici veya konu ara..."
            className="w-full h-9 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:border-slate-900"
          />
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
        </div>
      </div>

      {/* 4. TALEP TABLOSU */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/60">
              <th className="py-3 px-4">Talep No</th>
              <th className="py-3 px-4">Site / Apartman</th>
              <th className="py-3 px-4">Yönetici Bilgisi</th>
              <th className="py-3 px-4">Konu &amp; Kategori</th>
              <th className="py-3 px-4">KVKK Müdahale İzni</th>
              <th className="py-3 px-4">Durum</th>
              <th className="py-3 px-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Yükleniyor...
                </td>
              </tr>
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                  Eşleşen destek talebi bulunamadı.
                </td>
              </tr>
            ) : (
              filteredTickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    #{t.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{t.groupName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">/{t.groupSlug}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{t.creatorName}</div>
                    <div className="text-[11px] text-slate-500">{t.creatorEmail}</div>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-slate-900 truncate">{t.subject}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{getCategoryLabel(t.category)}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {t.allowSiteAccess ? (
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                        <ShieldCheck size={13} />
                        <span>Müdahale İzni Var</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                        <Lock size={12} className="text-slate-400" />
                        <span>Sadece Mesaj</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {t.status === 'open' ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                        Açık / Bekliyor
                      </span>
                    ) : t.status === 'in_progress' ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200">
                        İnceleniyor
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Çözüldü ✓
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(t)}
                        className="h-8 px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <MessageSquare size={13} className="text-slate-500" />
                        <span>Yanıtla</span>
                      </button>

                      {t.allowSiteAccess && (
                        <button
                          type="button"
                          disabled={impersonating}
                          onClick={() => handleImpersonateSite(t)}
                          className="h-8 px-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Site Paneline Destek Girişi Yap"
                        >
                          <ExternalLink size={12} />
                          <span>Siteye Gir</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 5. TICKET DETAIL & MESSAGING DRAWER */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* DRAWER HEADER */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <LifeBuoy size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      Talep #{selectedTicket.id}
                    </h2>
                    <span className="text-xs text-slate-500 font-medium">
                      ({selectedTicket.groupName})
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">
                    {selectedTicket.subject}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* ACTION & STATUS BAR */}
            <div className="p-4 bg-slate-100/60 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600">Durum:</span>
                <select
                  disabled={statusUpdating}
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(e.target.value as SupportTicketStatus)}
                  className="h-8 px-2.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 cursor-pointer focus:outline-hidden"
                >
                  <option value="open">Açık / Bekliyor</option>
                  <option value="in_progress">İnceleniyor</option>
                  <option value="waiting_admin_action">Yöneticiden Bilgi Bekleniyor</option>
                  <option value="resolved">Çözüldü ✓</option>
                  <option value="closed">Kapatıldı</option>
                </select>
              </div>

              {/* SITE IMPERSONATION BUTTON */}
              <div>
                {selectedTicket.allowSiteAccess ? (
                  <button
                    type="button"
                    disabled={impersonating}
                    onClick={() => handleImpersonateSite(selectedTicket)}
                    className="h-8 px-3 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <ExternalLink size={13} />
                    <span>Bu Sitenin Paneline Destek Girişi Yap</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-500 italic flex items-center gap-1">
                    <Lock size={12} />
                    Yönetici müdahale izni vermemiştir (Sadece mesajlaşma)
                  </span>
                )}
              </div>
            </div>

            {/* MESSAGES THREAD */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1.5">
                <div className="font-bold text-slate-900 text-sm">{selectedTicket.subject}</div>
                <div className="text-slate-600 flex items-center gap-3 flex-wrap">
                  <span>Yönetici: <strong>{selectedTicket.creatorName}</strong></span>
                  <span>·</span>
                  <span>E-posta: {selectedTicket.creatorEmail}</span>
                  {selectedTicket.creatorPhone && (
                    <>
                      <span>·</span>
                      <span>Tel: {selectedTicket.creatorPhone}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {selectedTicket.messages?.map((msg) => {
                  const isSuperAdmin = msg.senderRole === 'superadmin';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isSuperAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-2xs space-y-1 ${
                          isSuperAdmin
                            ? 'bg-slate-900 text-white rounded-tr-xs'
                            : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
                        }`}
                      >
                        <div className="flex items-center gap-2 justify-between">
                          <span
                            className={`font-bold text-[11px] ${
                              isSuperAdmin ? 'text-amber-400' : 'text-slate-900'
                            }`}
                          >
                            {isSuperAdmin ? '🛡️ Süper Admin (Siz)' : msg.senderName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(msg.createdAt).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* REPLY INPUT */}
            <form onSubmit={handleSendReply} className="p-4 border-t border-slate-100 bg-white flex gap-2">
              <input
                type="text"
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Yöneticiye yanıtınızı yazın..."
                className="flex-1 h-10 px-3.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:border-slate-900"
              />
              <button
                type="submit"
                disabled={replying}
                className="h-10 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0"
              >
                <Send size={13} />
                <span>{replying ? '...' : 'Yanıtla'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
