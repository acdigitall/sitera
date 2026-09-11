import React, { useState, useMemo } from 'react';
import {
  LifeBuoy,
  CheckCircle2,
  Clock,
  Wrench,
  AlertCircle,
  MapPin,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Phone,
  User,
  MessageSquare,
  Check,
  Building2,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../../auth';
import { useTickets } from '../useTickets';
import { TicketCategory, TicketStatus, IssueTicket } from '@sitera/shared';
import { openReceiptInNewTab } from '../../finance';

interface AdminTicketsViewProps {
  groupId?: string;
  activeGroup?: any;
}

function getNormalizedPhotos(photos: any): string[] {
  if (!photos) return [];
  if (Array.isArray(photos)) {
    if (photos.length >= 2 && photos[0].startsWith('data:image/') && !photos[0].includes(';base64,')) {
      return [photos.join(',')];
    }
    return photos.filter((p) => typeof p === 'string' && p.trim().length > 0);
  }
  if (typeof photos === 'string') {
    try {
      const parsed = JSON.parse(photos);
      if (Array.isArray(parsed)) return getNormalizedPhotos(parsed);
    } catch {
      if (photos.startsWith('data:') || photos.startsWith('http')) {
        return [photos];
      }
    }
  }
  return [];
}

export const AdminTicketsView: React.FC<AdminTicketsViewProps> = ({ groupId, activeGroup }) => {
  const { user } = useAuth();
  const effectiveGroupId = groupId || user?.groupId;

  const {
    tickets,
    loading,
    refetch,
    updateStatus,
    deleteTicket,
    openTicketsCount,
    inProgressCount,
    resolvedCount,
  } = useTickets({
    groupId: effectiveGroupId,
    isStaff: true,
  });

  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [adminNotesText, setAdminNotesText] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Status filter
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description.toLowerCase().includes(q);
        const matchesUnit = t.unit.toLowerCase().includes(q);
        const matchesResident = t.residentName.toLowerCase().includes(q);
        const matchesLoc = t.location ? t.location.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesDesc && !matchesUnit && !matchesResident && !matchesLoc) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, statusFilter, categoryFilter, searchQuery]);

  const handleStatusChange = async (ticket: IssueTicket, newStatus: TicketStatus) => {
    setActionLoadingId(ticket.id);
    try {
      await updateStatus(ticket.id, {
        status: newStatus,
        adminNotes: ticket.adminNotes || undefined,
      });
    } catch (err: any) {
      alert('Durum güncellenirken hata: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveNotes = async (ticketId: string) => {
    setActionLoadingId(ticketId);
    try {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket) return;

      await updateStatus(ticketId, {
        status: ticket.status,
        adminNotes: adminNotesText.trim(),
      });
      setEditingNotesId(null);
    } catch (err: any) {
      alert('Not kaydedilirken hata: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (!confirm('Bu arıza / talep bildirimini kalıcı olarak silmek istediğinize emin misiniz?')) return;
    setActionLoadingId(ticketId);
    try {
      await deleteTicket(ticketId);
    } catch (err: any) {
      alert('Silme sırasında hata: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-full animate-fade-in pb-16">
      {/* 1. FLUSH PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <LifeBuoy className="text-teal-700" size={26} />
              <span>Talep & Arıza Yönetimi</span>
            </h1>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-md">
              {openTicketsCount} Yeni Bildirim
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {activeGroup?.name || user?.group?.name || 'Gencosman Apartmanı'} · Sakinlerden gelen çim, bakım, asansör ve ortak alan bildirimleri
          </p>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={loading}
            className="h-10 inline-flex items-center gap-2 px-4 text-sm font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-lg shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw size={15} className={`text-teal-700 ${loading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* 2. 3'LÜ KPI KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Kart 1: Bekleyen Talepler */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 relative overflow-hidden border-t-4 border-t-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Bekleyen Talepler
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            {openTicketsCount}
          </div>
          <p className="text-[11px] text-amber-700 font-medium mt-1">
            İnceleme ve görevliye sevk bekliyor
          </p>
        </div>

        {/* Kart 2: İşleme Alınanlar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 relative overflow-hidden border-t-4 border-t-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              İşlemde Olanlar
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wrench size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            {inProgressCount}
          </div>
          <p className="text-[11px] text-blue-700 font-medium mt-1">
            Bahçıvan / Teknik servis görevlendirildi
          </p>
        </div>

        {/* Kart 3: Çözülenler */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 relative overflow-hidden border-t-4 border-t-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Çözülen Talepler
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            {resolvedCount}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            Tamamlandı ve sakine geri bildirim yapıldı
          </p>
        </div>
      </div>

      {/* 3. FİLTRELEME & ARAMA ÇUBUĞU */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Durum Sekmeleri */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Tümü ({tickets.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('open')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'open'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Bekleyenler ({openTicketsCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'in_progress'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            İşlemdekiler ({inProgressCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('resolved')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'resolved'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Çözülenler ({resolvedCount})
          </button>
        </div>

        {/* Kategori Seçimi & Arama */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">Tüm Kategoriler</option>
            <option value="Peyzaj & Bahçe">🌿 Peyzaj & Bahçe</option>
            <option value="Asansör & Elektrik">⚡ Asansör & Elektrik</option>
            <option value="Temizlik & Hijyen">🧹 Temizlik & Hijyen</option>
            <option value="Güvenlik & Kapı">🛡️ Güvenlik & Kapı</option>
            <option value="Sıhhi Tesisat">🚰 Sıhhi Tesisat</option>
            <option value="Ortak Alan & Demirbaş">🏢 Ortak Alan</option>
            <option value="Diğer">📝 Diğer</option>
          </select>

          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Daire, sakin veya konu ara..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 4. TALEP KARTLARI LİSTESİ */}
      <div className="space-y-4">
        {loading && tickets.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span>Talepler yükleniyor...</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
            Seçilen filtrelere uygun arıza veya talep kaydı bulunamadı.
          </div>
        ) : (
          filteredTickets.map((t) => {
            const isProcessing = actionLoadingId === t.id;
            const isEditingNotes = editingNotesId === t.id;

            return (
              <div
                key={t.id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all p-5 space-y-4"
              >
                {/* Header Row: Daire & Sakin + Kategori + Durum */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                      {t.unit}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{t.residentName}</span>
                        <span className="text-[11px] text-slate-400">({t.unit})</span>
                        {t.residentPhone && (
                          <a
                            href={`tel:${t.residentPhone}`}
                            className="text-[11px] text-teal-700 hover:underline inline-flex items-center gap-1 font-mono ml-1"
                          >
                            <Phone size={10} />
                            <span>{t.residentPhone}</span>
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{t.category}</span>
                        {t.location && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={11} className="text-slate-400" />
                              <span>{t.location}</span>
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{new Date(t.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {t.urgency === 'urgent' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                        🔴 Acil
                      </span>
                    )}

                    {t.status === 'open' && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5">
                        <Clock size={12} className="text-amber-600" />
                        <span>Bekliyor</span>
                      </span>
                    )}
                    {t.status === 'in_progress' && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 inline-flex items-center gap-1.5">
                        <Wrench size={12} className="text-blue-600" />
                        <span>İşlemde</span>
                      </span>
                    )}
                    {t.status === 'resolved' && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span>Çözüldü</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle: Başlık ve Detay */}
                <div>
                  <h3 className="text-base font-bold text-slate-900">{t.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    {t.description}
                  </p>
                </div>

                {/* Fotoğraflar (Tıklandığında doğrudan yeni sekmede açılır, modal yok!) */}
                {(() => {
                  const normalizedPhotos = getNormalizedPhotos(t.photos);
                  if (normalizedPhotos.length === 0) return null;
                  return (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Sakinin Eklediği Fotoğraflar ({normalizedPhotos.length}) · Büyütmek için tıklayınız
                      </span>
                      <div className="flex items-center gap-3 overflow-x-auto pb-1">
                        {normalizedPhotos.map((photoUrl, pIdx) => (
                          <div
                            key={pIdx}
                            onClick={() => openReceiptInNewTab(photoUrl)}
                            className="relative group w-24 h-24 rounded-xl overflow-hidden border border-slate-300 shrink-0 cursor-pointer shadow-2xs hover:opacity-90 transition-opacity bg-slate-100"
                            title="Yeni Sekmede Tam Ekran Aç"
                          >
                            <img
                              src={photoUrl}
                              alt="Talep Fotoğrafı"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-xs font-bold">
                              <ArrowUpRight size={16} />
                              <span>Büyüt</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Yönetici Yanıtı / Çözüm Notu Alanı */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <MessageSquare size={13} className="text-teal-700" />
                      <span>Yönetici Çözüm Notu & Sakine Geri Bildirim:</span>
                    </span>
                    {!isEditingNotes && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNotesId(t.id);
                          setAdminNotesText(t.adminNotes || '');
                        }}
                        className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                      >
                        {t.adminNotes ? 'Notu Düzenle' : '+ Not Ekle'}
                      </button>
                    )}
                  </div>

                  {isEditingNotes ? (
                    <div className="space-y-2">
                      <textarea
                        value={adminNotesText}
                        onChange={(e) => setAdminNotesText(e.target.value)}
                        rows={2}
                        placeholder="Örn: Bahçıvana talimat verildi, Cumartesi günü çimler biçilecek..."
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingNotesId(null)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          İptal
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleSaveNotes(t.id)}
                          className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                        >
                          {isProcessing ? 'Kaydediliyor...' : 'Yanıtı Kaydet'}
                        </button>
                      </div>
                    </div>
                  ) : t.adminNotes ? (
                    <div className="p-3 bg-teal-50/50 border border-teal-200/70 rounded-xl text-xs text-slate-700 leading-relaxed font-medium">
                      {t.adminNotes}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Henüz bir çözüm notu eklenmedi. Sakin talebin incelendiğini görüyor.
                    </p>
                  )}
                </div>

                {/* Aksiyon Butonları Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    {t.status !== 'in_progress' && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleStatusChange(t, 'in_progress')}
                        className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <Wrench size={13} className="text-blue-600" />
                        <span>İşleme Al (Görevliye İlet)</span>
                      </button>
                    )}

                    {t.status !== 'resolved' && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleStatusChange(t, 'resolved')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <Check size={13} />
                        <span>Çözüldü Olarak İşaretle</span>
                      </button>
                    )}

                    {t.status === 'resolved' && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleStatusChange(t, 'in_progress')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Yeniden Aç
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleDelete(t.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Talebi Sil"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
