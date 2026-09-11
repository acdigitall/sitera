import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  LifeBuoy,
  Plus,
  Send,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  Lock,
  ChevronRight,
  ArrowLeft,
  Headphones,
  ChevronDown,
  ChevronUp,
} from '../../../components/common/fontawesome-icons';
import {
  PlatformSupportTicket,
  SupportTicketCategory,
  SupportTicketPriority,
  CreateSupportTicketDto,
} from '@sitera/shared';
import { supportApi } from '../services/support.api';
import { useSupport } from '../context/SupportContext';
import { useAuth } from '../../auth';

interface TenantSupportModalProps {
  groupId?: string;
  groupName?: string;
  groupSlug?: string;
}

export const TenantSupportModal: React.FC<TenantSupportModalProps> = ({
  groupId,
  groupName,
  groupSlug,
}) => {
  const { isTenantModalOpen, closeTenantModal } = useSupport();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'list' | 'new' | 'detail'>('list');
  const [tickets, setTickets] = useState<PlatformSupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<PlatformSupportTicket | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (activeTab === 'detail' && selectedTicket) {
      setTimeout(() => scrollToBottom('auto'), 50);
    }
  }, [activeTab, selectedTicket?.id, selectedTicket?.messages?.length]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 120;
    setShowScrollBottom(isUp);
  };

  // Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicketCategory>('finance_error');
  const [priority, setPriority] = useState<SupportTicketPriority>('normal');
  const [message, setMessage] = useState('');
  const [allowSiteAccess, setAllowSiteAccess] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const effectiveGroupId = groupId || user?.groupId || '00000000-0000-0000-0000-000000000001';

  const loadTickets = async () => {
    if (!effectiveGroupId) return;
    setLoading(true);
    try {
      const data = await supportApi.getTickets(effectiveGroupId);
      setTickets(data);
      // If we have selected ticket, update it
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
    if (isTenantModalOpen) {
      loadTickets();
    }
  }, [isTenantModalOpen, effectiveGroupId]);

  if (!isTenantModalOpen) return null;

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      const dto: CreateSupportTicketDto = {
        groupId: effectiveGroupId,
        groupName: groupName || user?.group?.name || 'Site Yönetimi',
        groupSlug: groupSlug || user?.group?.slug || 'site',
        creatorUserId: user?.id || 'usr-anon',
        creatorName: user?.name || 'Site Yöneticisi',
        creatorEmail: user?.email || 'yonetici@sitera.app',
        creatorPhone: (user as any)?.phone || undefined,
        subject: subject.trim(),
        category,
        priority,
        initialMessage: message.trim(),
        allowSiteAccess,
      };

      const created = await supportApi.createTicket(dto);
      setTickets([created, ...tickets]);
      setSelectedTicket(created);
      setActiveTab('detail');
      setSubject('');
      setMessage('');
      setFeedback('Destek talebiniz Sitera teknik ekibine iletildi.');
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      alert('Talep iletilirken hata: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyContent.trim()) return;

    setReplying(true);
    try {
      const updated = await supportApi.addMessage(selectedTicket.id, {
        senderRole: 'tenant_admin',
        senderName: user?.name || 'Site Yöneticisi',
        senderUserId: user?.id || 'usr-admin',
        content: replyContent.trim(),
      });
      setSelectedTicket(updated);
      setReplyContent('');
      loadTickets();
    } catch (err: any) {
      alert('Mesaj iletilemedi: ' + err.message);
    } finally {
      setReplying(false);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
            Yeni Açıldı · Bekliyor
          </span>
        );
      case 'in_progress':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200">
            İnceleniyor
          </span>
        );
      case 'resolved':
      case 'closed':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            Çözüldü ✓
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs font-sans animate-fade-in overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl h-[88vh] max-h-[800px] min-h-[480px] flex flex-col overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0">
              <Headphones size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Sitera Destek &amp; Teknik Yardım
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                  Platform Desteği
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">
                {groupName || 'Gencosman Apartmanı'} · Karşılaştığınız hata veya sorular için doğrudan Süper Admin ile görüşün
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeTenantModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 shrink-0">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* TAB BAR */}
        <div className="flex items-center justify-between px-5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab('list');
                setSelectedTicket(null);
              }}
              className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'list'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Destek Taleplerim ({tickets.length})
            </button>

            {activeTab === 'detail' && selectedTicket && (
              <span className="py-3 text-xs font-bold border-b-2 border-slate-900 text-slate-900 flex items-center gap-1">
                <span>Talep #{selectedTicket.id}</span>
              </span>
            )}
          </div>

          {activeTab !== 'new' && (
            <button
              type="button"
              onClick={() => setActiveTab('new')}
              className="h-8 px-3 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Yeni Talep Aç</span>
            </button>
          )}
        </div>

        {/* CONTENT BODY */}
        {activeTab !== 'detail' ? (
          <div className="flex-1 min-h-0 overflow-y-auto p-5">
          {/* VIEW 1: TICKET LIST */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              {loading ? (
                <div className="p-12 text-center text-xs text-slate-400">Yükleniyor...</div>
              ) : tickets.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <MessageSquare size={22} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Henüz Açılmış Destek Talebiniz Yok</div>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Sistem kullanımı, aidat paylaştırma, kasa hareketleri veya donanım bağlantılarıyla ilgili her konuda destek talebi açabilirsiniz.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('new')}
                    className="h-9 px-4 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>İlk Destek Talebini Aç</span>
                  </button>
                </div>
              ) : (
                tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTicket(t);
                      setActiveTab('detail');
                    }}
                    className="p-4 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50/80 hover:border-slate-300 transition-all cursor-pointer shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-xs">#{t.id}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs font-semibold text-slate-700 truncate">{t.subject}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap">
                        <span>{getCategoryLabel(t.category)}</span>
                        <span>·</span>
                        <span>{new Date(t.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        {t.allowSiteAccess && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                              <ShieldCheck size={12} />
                              Uzaktan Müdahale İzni Verildi
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      {getStatusBadge(t.status)}
                      <ChevronRight size={15} className="text-slate-400 group-hover:text-slate-800 transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* VIEW 2: NEW TICKET FORM */}
          {activeTab === 'new' && (
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Yeni Destek Talebi Oluştur</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hata veya sorununuzu anlatın, Sitera teknik ekibi anında incelesin.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Talep Konusu / Başlık *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Örn: Eylül 2026 Aidat Dağıtımında Gecikme Zammı Hesaplanmadı"
                  className="w-full h-10 px-3.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SupportTicketCategory)}
                    className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-900 cursor-pointer"
                  >
                    <option value="finance_error">Kasa, Aidat veya Fatura Hatası</option>
                    <option value="access_hardware">Bariyer, Plaka veya Kapı Donanımı</option>
                    <option value="resident_data">Daire, Sakin veya İletişim Verisi</option>
                    <option value="system_bug">Yazılım / Arayüz Hatası</option>
                    <option value="general">Genel Soru &amp; Mevzuat Danışmanlığı</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Öncelik Seviyesi
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as SupportTicketPriority)}
                    className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-900 cursor-pointer"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">Yüksek (Operasyonu Etkiliyor)</option>
                    <option value="urgent">Acil (Sistem Kilitlendi / Kritik)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hata / Problem Açıklaması *
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hatanın hangi ekranda gerçekleştiğini ve nasıl çözülmesini istediğinizi detaylandırın..."
                  className="w-full p-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-900 leading-relaxed"
                />
              </div>

              {/* KVKK & UZAKTAN MÜDAHALE İZİN KUTUSU */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowSiteAccess}
                    onChange={(e) => setAllowSiteAccess(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                  />
                  <div className="text-xs text-slate-700 leading-relaxed">
                    <strong className="text-slate-900 block font-bold mb-0.5">
                      Uzaktan Teknik Müdahale &amp; İnceleme İzni (KVKK Onayı):
                    </strong>
                    Sitera teknik destek ekibinin bu arızayı yerinde inceleyip giderebilmesi amacıyla site yönetim paneline 48 saat süreyle salt inceleme ve düzeltme yetkisiyle erişmesini onaylıyorum.
                  </div>
                </label>
                <p className="text-[11px] text-slate-500 pl-7">
                  * İzin vermezseniz teknik ekip yalnızca mesaj yoluyla yönlendirme yapabilir; sitenizin yönetim paneline giriş yapamaz.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="h-10 px-4 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>{submitting ? 'İletiliyor...' : 'Talebi İlet'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* VIEW 3: TICKET DETAIL & CONVERSATION (FULL HEIGHT CHAT) */
        selectedTicket && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* SUBHEADER (FIXED) */}
            <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Taleplere Dön</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-500">
                  #{selectedTicket.id}
                </span>
                {getStatusBadge(selectedTicket.status)}

                <button
                  type="button"
                  onClick={() => setIsDetailsCollapsed(!isDetailsCollapsed)}
                  className="ml-2 px-2 py-1 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-200/60 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Detayları Gizle / Göster"
                >
                  <span className="hidden sm:inline">{isDetailsCollapsed ? 'Detayları Göster' : 'Detayları Gizle'}</span>
                  {isDetailsCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                </button>
              </div>
            </div>

            {/* COLLAPSIBLE TICKET SUMMARY CARD */}
            {!isDetailsCollapsed && (
              <div className="px-4 py-2.5 bg-white border-b border-slate-200 text-xs shrink-0 animate-fade-in">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{selectedTicket.subject}</h3>
                    <div className="text-slate-500 mt-0.5 text-[11px]">
                      Kategori: <strong className="text-slate-700">{getCategoryLabel(selectedTicket.category)}</strong> · 
                      Öncelik: <strong className="text-slate-700">{selectedTicket.priority}</strong>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {selectedTicket.allowSiteAccess ? (
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <ShieldCheck size={12} />
                        Müdahale İzni Aktif
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                        Sadece Mesaj
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* MESSAGES THREAD (SCROLLABLE - MIN-H-0 MANDATORY) */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-100/40 relative"
            >
              <div className="flex items-center justify-center my-1">
                <span className="px-3 py-0.5 rounded-full bg-slate-200/80 text-slate-600 text-[10px] font-bold tracking-wider uppercase">
                  Mesaj Geçmişi
                </span>
              </div>

              {selectedTicket.messages?.map((msg, idx) => {
                const isSuperAdmin = msg.senderRole === 'superadmin';
                const prevMsg = idx > 0 ? selectedTicket.messages[idx - 1] : null;
                const isSameSenderAsPrev = prevMsg && prevMsg.senderRole === msg.senderRole;

                return (
                  <div
                    key={msg.id || idx}
                    className={`flex flex-col ${isSuperAdmin ? 'items-start' : 'items-end'} ${
                      isSameSenderAsPrev ? 'mt-1' : 'mt-3'
                    }`}
                  >
                    {!isSameSenderAsPrev && (
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span
                          className={`font-bold text-[11px] ${
                            isSuperAdmin ? 'text-amber-600' : 'text-slate-700'
                          }`}
                        >
                          {isSuperAdmin ? '🛡️ Sitera Destek Ekibi' : msg.senderName}
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
                      className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 text-xs shadow-2xs leading-relaxed break-words whitespace-pre-wrap ${
                        isSuperAdmin
                          ? 'bg-slate-900 text-white rounded-2xl rounded-tl-xs'
                          : 'bg-white border border-slate-200/90 text-slate-900 rounded-2xl rounded-tr-xs'
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

              {/* Floating scroll-to-bottom button */}
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

            {/* REPLY INPUT (FIXED AT BOTTOM) */}
            <form
              onSubmit={handleSendReply}
              className="p-3 sm:p-4 border-t border-slate-200 bg-white shrink-0"
            >
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    rows={2}
                    required
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply(e);
                      }
                    }}
                    placeholder="Eklemek istediğiniz bilgi veya cevabınızı yazın... (Enter ile gönder, Shift+Enter yeni satır)"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 resize-none transition-all shadow-2xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={replying || !replyContent.trim()}
                  className="h-10 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                >
                  <Send size={13} />
                  <span>{replying ? '...' : 'Yanıtla'}</span>
                </button>
              </div>
            </form>
          </div>
        )
      )}
    </div>
  </div>
);
};
