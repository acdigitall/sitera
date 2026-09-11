import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  RefreshCw,
} from '../../../components/common/fontawesome-icons';
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

  // Reply & Chat State
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (selectedTicket) {
      setTimeout(() => scrollToBottom('auto'), 50);
    }
  }, [selectedTicket?.id, selectedTicket?.messages?.length]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 120;
    setShowScrollBottom(isUp);
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await supportApi.getTickets();
      setTickets(data);
      if (selectedTicket) {
        const updated = data.find((t) => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      } else if (data.length > 0) {
        // WhatsApp / Outlook standard: ilk bileti otomatik seç
        setSelectedTicket(data[0]);
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
      setTimeout(() => scrollToBottom('smooth'), 50);
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
      await supportApi.impersonateSite(ticket.id);

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

  const getStatusBadge = (status: SupportTicketStatus) => {
    switch (status) {
      case 'open':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
            Açık / Bekliyor
          </span>
        );
      case 'in_progress':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200">
            İnceleniyor
          </span>
        );
      case 'waiting_admin_action':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
            Yönetici Bekleniyor
          </span>
        );
      case 'resolved':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            Çözüldü ✓
          </span>
        );
      case 'closed':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
            Kapatıldı
          </span>
        );
      default:
        return null;
    }
  };

  const getLastMessage = (ticket: PlatformSupportTicket) => {
    if (!ticket.messages || ticket.messages.length === 0) {
      return 'Henüz mesaj yok';
    }
    const last = ticket.messages[ticket.messages.length - 1];
    return last.content;
  };

  return (
    <div className="space-y-4 max-w-full font-sans pb-8 animate-fade-in">
      {/* 1. ÜST HEADER & ÖZET BİLGİ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Destek Talepleri &amp; Site Müdahaleleri
            </h1>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
              WhatsApp / Outlook Görünümü
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Site yöneticilerinin açtığı teknik destek bildirimleri, canlı mesajlaşma ve KVKK onaylı uzaktan müdahale
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              Toplam: <strong>{tickets.length}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
              Bekleyen: <strong>{openCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              Müdahale Onaylı: <strong>{allowAccessCount}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={loadTickets}
            disabled={loading}
            className="h-8 px-3 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            title="Talepleri Yenile"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* 2. ANA ÇİFT PANELLİ WHATSAPP / OUTLOOK ÇALIŞMA ALANI */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex h-[calc(100vh-190px)] min-h-[580px]">
        {/* SOL PANEL: TALEPLER / MESAJLAR LİSTESİ (GELEN KUTUSU) */}
        <div
          className={`w-full md:w-[360px] lg:w-[410px] border-r border-slate-200 flex flex-col shrink-0 bg-white transition-all ${
            selectedTicket ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Arama Kutusu */}
          <div className="p-3 border-b border-slate-100 shrink-0 bg-slate-50/50">
            <div className="relative">
              <Search size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Site, konu veya yönetici ara..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Durum Filtreleri (Sekmeler) */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 bg-slate-50/30 text-xs shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Tümü ({tickets.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('open')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap ${
                filterStatus === 'open'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Bekleyen ({openCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('resolved')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap ${
                filterStatus === 'resolved'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Çözülen ({resolvedCount})
            </button>
          </div>

          {/* Talep Kartları Listesi */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <MessageSquare size={24} className="mx-auto text-slate-300 mb-2" />
                <span>Filtreye uygun destek talebi bulunamadı.</span>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                const lastMsg = getLastMessage(t);

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-3.5 cursor-pointer transition-all border-l-4 ${
                      isSelected
                        ? 'bg-teal-50/60 border-teal-700 shadow-2xs'
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/70 truncate max-w-[170px]">
                        {t.groupName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(t.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>

                    <div className="font-bold text-slate-900 text-xs sm:text-sm truncate mb-1">
                      {t.subject}
                    </div>

                    <p className="text-xs text-slate-500 truncate mb-2">
                      <span className="font-semibold text-slate-700">{t.creatorName}: </span>
                      {lastMsg}
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100/80">
                      <div>{getStatusBadge(t.status)}</div>

                      {t.allowSiteAccess && (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <ShieldCheck size={11} />
                          Müdahale İzni
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SAĞ PANEL: AKTİF TALEP SOHBETİ & İŞLEMLER (OUTLOOK / WHATSAPP SAĞ PANE) */}
        <div
          className={`flex-1 min-h-0 flex flex-col bg-slate-50/50 ${
            selectedTicket ? 'flex' : 'hidden md:flex'
          }`}
        >
          {selectedTicket ? (
            <>
              {/* SAĞ ÜST BAR: TALEP DETAYLARI & BUTONLAR */}
              <div className="p-3.5 sm:p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobil Geri Butonu */}
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer shrink-0"
                    title="Listeye Dön"
                  >
                    <ArrowLeft size={16} />
                  </button>

                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <LifeBuoy size={20} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                        {selectedTicket.subject}
                      </h2>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        #{selectedTicket.id}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                        {selectedTicket.groupName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      Yönetici: <strong className="text-slate-700">{selectedTicket.creatorName}</strong> · E-posta: {selectedTicket.creatorEmail} {selectedTicket.creatorPhone ? `· Tel: ${selectedTicket.creatorPhone}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto flex-wrap">
                  {/* Durum Seçici */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-500 hidden lg:inline">Durum:</span>
                    <select
                      disabled={statusUpdating}
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(e.target.value as SupportTicketStatus)}
                      className="h-8 px-2.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-800 cursor-pointer focus:outline-none focus:border-slate-900"
                    >
                      <option value="open">Açık / Bekliyor</option>
                      <option value="in_progress">İnceleniyor</option>
                      <option value="waiting_admin_action">Yöneticiden Bilgi Bekleniyor</option>
                      <option value="resolved">Çözüldü ✓</option>
                      <option value="closed">Kapatıldı</option>
                    </select>
                  </div>

                  {/* Siteye Destek Girişi Butonu */}
                  {selectedTicket.allowSiteAccess ? (
                    <button
                      type="button"
                      disabled={impersonating}
                      onClick={() => handleImpersonateSite(selectedTicket)}
                      className="h-8 px-3 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      title="Sitenin yönetici paneline uzaktan müdahale girişi yap"
                    >
                      <ExternalLink size={12} />
                      <span>Siteye Gir</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic hidden xl:inline">
                      (Müdahale İzni Yok)
                    </span>
                  )}
                </div>
              </div>

              {/* MESAJLAŞMA AKIŞI (TAM YÜKSEKLİKTE SCROLLABLE) */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-slate-100/50 relative"
              >
                <div className="flex items-center justify-center my-1">
                  <span className="px-3 py-0.5 rounded-full bg-slate-200/80 text-slate-600 text-[10px] font-bold tracking-wider uppercase">
                    Görüşme Başlangıcı
                  </span>
                </div>

                {selectedTicket.messages?.map((msg, idx) => {
                  const isSuperAdmin = msg.senderRole === 'superadmin';
                  const prevMsg = idx > 0 ? selectedTicket.messages[idx - 1] : null;
                  const isSameSenderAsPrev = prevMsg && prevMsg.senderRole === msg.senderRole;

                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex flex-col ${isSuperAdmin ? 'items-end' : 'items-start'} ${
                        isSameSenderAsPrev ? 'mt-1' : 'mt-3'
                      }`}
                    >
                      {!isSameSenderAsPrev && (
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span
                            className={`font-bold text-[11px] ${
                              isSuperAdmin ? 'text-teal-800' : 'text-slate-700'
                            }`}
                          >
                            {isSuperAdmin ? '🛡️ Süper Admin (Siz)' : msg.senderName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(msg.createdAt).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 text-xs shadow-2xs leading-relaxed break-words whitespace-pre-wrap ${
                          isSuperAdmin
                            ? 'bg-slate-900 text-white rounded-2xl rounded-tr-xs'
                            : 'bg-white border border-slate-200/90 text-slate-900 rounded-2xl rounded-tl-xs'
                        }`}
                      >
                        <p>{msg.content}</p>
                        {isSameSenderAsPrev && (
                          <div
                            className={`text-[9px] text-right mt-1 font-mono ${
                              isSuperAdmin ? 'text-slate-400' : 'text-slate-400'
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />

                {/* Yüzen En Alta İn Butonu */}
                {showScrollBottom && (
                  <button
                    type="button"
                    onClick={() => scrollToBottom('smooth')}
                    className="sticky bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5 transition-all cursor-pointer hover:bg-slate-800 animate-fade-in"
                  >
                    <ChevronDown size={12} />
                    <span>En yeni mesaja in</span>
                  </button>
                )}
              </div>

              {/* ALT MESAJ YAZMA FORMU */}
              <form
                onSubmit={handleSendReply}
                className="p-3 sm:p-4 border-t border-slate-200 bg-white shrink-0"
              >
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      rows={2}
                      required
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply(e);
                        }
                      }}
                      placeholder="Yöneticiye yanıtınızı yazın... (Enter ile gönder, Shift+Enter yeni satır)"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 resize-none transition-all shadow-2xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={replying || !replyText.trim()}
                    className="h-10 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                  >
                    <Send size={13} />
                    <span>{replying ? '...' : 'Yanıtla'}</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* BOŞ DURUM: HİÇBİR TALEP SEÇİLİ DEĞİLKEN */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-200/70 text-slate-400 flex items-center justify-center mb-4 shadow-2xs">
                <LifeBuoy size={32} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                Görüntülemek İçin Bir Talep Seçin
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Sol listeden bir destek bildirimi seçerek detayları inceleyebilir, WhatsApp tarzında anlık mesajlaşabilir veya site paneline doğrudan giriş yapabilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
