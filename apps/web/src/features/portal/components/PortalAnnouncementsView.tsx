import React, { useState, useMemo } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  Building2,
  Trash2,
  X,
  Share2,
  Copy,
  Check,
  CheckCheck,
  Info,
  Wrench,
  Users,
  Flame,
  MessageCircle,
  Eye,
  FileText,
  BadgeCheck,
  Circle,
  EyeOff,
  Home,
} from 'lucide-react';
import { useAuth } from '../../auth';
import { useAnnouncements } from '../../announcements';
import { Announcement, AnnouncementCategory } from '@sitera/shared';

interface PortalAnnouncementsViewProps {
  groupId?: string;
}

export const PortalAnnouncementsView: React.FC<PortalAnnouncementsViewProps> = ({ groupId }) => {
  const { user } = useAuth();
  const effectiveGroupId = groupId || user?.groupId;
  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin';
  const {
    announcements,
    loading,
    createAnnouncement,
    deleteAnnouncement,
    isRead,
    toggleRead,
    markAllAsRead,
    unreadCount,
    readCount,
  } = useAnnouncements(effectiveGroupId, user);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<AnnouncementCategory>('Genel');
  const [isImportant, setIsImportant] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      await createAnnouncement(
        { title: title.trim(), content: content.trim(), category, isImportant },
        user?.name || 'Site Yönetimi',
        user?.id,
      );
      setIsCreateOpen(false);
      setTitle('');
      setContent('');
      setIsImportant(false);
      setCategory('Genel');
    } catch (err: any) {
      alert('Duyuru eklenirken hata: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'Acil':
      case 'Kesinti':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Flame size={12} /> {cat}
          </span>
        );
      case 'Bakım':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Wrench size={12} /> Bakım & Onarım
          </span>
        );
      case 'Toplantı':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            <Users size={12} /> Genel Kurul / Toplantı
          </span>
        );
      case 'Aidat':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            Aidat & Bütçe
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Info size={12} /> Genel Duyuru
          </span>
        );
    }
  };

  const getTargetBadge = (ann: any) => {
    if (ann.targetScope === 'block' && ann.targetBlocks?.length) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
          <Building2 size={11} /> {ann.targetBlocks.join(', ')} Sakinlerine Özel
        </span>
      );
    }
    if (ann.targetScope === 'unit' && ann.targetUnits?.length) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-200">
          <Home size={11} /> Dairenize Özel Tebligat
        </span>
      );
    }
    if (ann.targetScope === 'role') {
      const roleLabel =
        ann.targetRole === 'owner'
          ? 'Kat Malikleri Özel'
          : ann.targetRole === 'resident'
          ? 'Kiracılar Özel'
          : 'Tüm Roller';
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
          <BadgeCheck size={11} /> {roleLabel}
        </span>
      );
    }
    return null;
  };

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      const matchesSearch =
        ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ann.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ann.authorName && ann.authorName.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesCat = true;
      if (selectedCategory === 'all') {
        matchesCat = true;
      } else if (selectedCategory === 'unread') {
        matchesCat = !isRead(ann.id);
      } else if (selectedCategory === 'read') {
        matchesCat = isRead(ann.id);
      } else if (selectedCategory === 'important') {
        matchesCat = ann.isImportant;
      } else {
        matchesCat = ann.category === selectedCategory;
      }

      return matchesSearch && matchesCat;
    });
  }, [announcements, searchQuery, selectedCategory, isRead]);

  const importantCount = announcements.filter((a) => a.isImportant).length;

  return (
    <div className="space-y-6 max-w-full animate-fade-in pb-12">
      {/* 1. FLUSH PAGE HEADER (Admin Dashboard Tasarım Uyumlu) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Bina Duyuruları & Tebligatlar
            </h1>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-md">
              Resmi İlan Panosu
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {user?.group?.name || 'Gencosman Apartmanı'} · Site yönetimi tarafından yayınlanan genel kurul kararları ve bakım duyuruları
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="h-10 inline-flex items-center gap-2 px-3.5 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <CheckCheck size={16} />
              <span>Tümünü Okundu İşaretle</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="h-10 inline-flex items-center gap-2 px-4 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span>Yeni Duyuru Yayınla</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 3'LÜ KPI VARLIK KARTLARI (Admin Dashboard ile Birebir) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Kart 1: Toplam Duyuru (Top Teal Border) */}
        <div className="bg-white border border-slate-300 border-t-3 border-t-teal-700 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900">Yayındaki Duyurular</span>
              <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                Aktif Bülten
              </span>
            </div>
            <div className="text-sm text-slate-500 mt-1 font-medium">Yönetimce paylaşılan toplam bülten</div>

            <div className="mt-4">
              <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                {announcements.length} Adet
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                Tüm kat maliki ve sakinlere açık
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Yayın Durumu: Güncel</span>
            <span className="text-teal-700 font-bold">Portalda Yayında</span>
          </div>
        </div>

        {/* Kart 2: Okunmamış Duyurular */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900">Okunmamış Duyurular</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                unreadCount > 0 ? 'text-amber-800 bg-amber-50' : 'text-teal-800 bg-teal-50'
              }`}>
                {unreadCount > 0 ? `${unreadCount} Yeni` : 'Hepsi Okundu'}
              </span>
            </div>
            <div className="text-sm text-slate-500 mt-1 font-medium">Tarafınızca henüz incelenmemiş bildirimler</div>

            <div className="mt-4">
              <div className={`text-3xl font-bold tracking-tight tabular-nums ${
                unreadCount > 0 ? 'text-amber-600' : 'text-teal-900'
              }`}>
                {unreadCount} Adet
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                {unreadCount > 0 ? 'İncelemeniz gereken yeni bültenler var' : 'Tüm duyuruları okudunuz'}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Okuma Durumu</span>
            <span className={unreadCount > 0 ? 'text-amber-600 font-bold' : 'text-teal-700 font-semibold'}>
              {unreadCount > 0 ? `${readCount} Okundu / ${unreadCount} Bekliyor` : 'Tümü Tamamlandı'}
            </span>
          </div>
        </div>

        {/* Kart 3: Acil Durum & Tebligat */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900">Önemli / Acil Bildirim</span>
              <span className="text-xs font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded">
                KMK m. 34
              </span>
            </div>
            <div className="text-sm text-slate-500 mt-1 font-medium">Acil kesinti ve toplantı çağrıları</div>

            <div className="mt-4">
              <div className="text-3xl font-bold text-rose-700 tracking-tight tabular-nums">
                {importantCount} Adet
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                {importantCount > 0 ? 'Kritik içerikli resmi bildirim' : 'Aktif acil durum bulunmuyor'}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Site Yönetim Kurulu</span>
            <span className="text-teal-700 font-semibold">Resmi Tebligat</span>
          </div>
        </div>
      </div>

      {/* 3. FİLTRELEME & ARAMA ÇUBUĞU */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200/80 shrink-0 text-xs overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tümü ({announcements.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('unread')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'unread'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-amber-700 hover:text-amber-900'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${selectedCategory === 'unread' ? 'bg-white' : 'bg-amber-600'}`} />
            <span>Okunmamış ({unreadCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('read')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'read'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'text-teal-800 hover:text-teal-900'
            }`}
          >
            <span>Okunanlar ({readCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('important')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'important'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-rose-700 hover:text-rose-900'
            }`}
          >
            Önemli ({importantCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('Bakım')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'Bakım'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bakım
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('Aidat')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'Aidat'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Aidat
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('Toplantı')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'Toplantı'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Toplantı
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('Genel')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'Genel'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Genel
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Duyurularda ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200/90 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-teal-600 transition-all font-medium"
          />
        </div>
      </div>

      {/* 4. DUYURU KARTLARI LİSTESİ */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-xl">
            Duyurular yükleniyor...
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
            Kriterlere uygun duyuru bulunamadı.
          </div>
        ) : (
          filteredAnnouncements.map((ann) => {
            const read = isRead(ann.id);

            return (
              <div
                key={ann.id}
                className={`bg-white border rounded-xl p-5 shadow-xs transition-all ${
                  ann.isImportant
                    ? 'border-rose-300 border-l-4 border-l-rose-600 bg-rose-50/15'
                    : read
                    ? 'border-slate-200/80 opacity-80 hover:opacity-100 hover:border-slate-300'
                    : 'border-teal-200/80 border-l-3 border-l-teal-600 hover:border-teal-400 shadow-2xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Okundu / Okunmadı Durum Rozeti */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        read
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : 'bg-teal-50 text-teal-800 border border-teal-200'
                      }`}
                    >
                      {read ? (
                        <>
                          <Check size={11} className="text-slate-500" />
                          <span>Okundu</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
                          <span>Yeni / Okunmadı</span>
                        </>
                      )}
                    </span>

                    {getCategoryBadge(ann.category)}
                    {getTargetBadge(ann)}

                    {ann.isImportant && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-200">
                        <AlertTriangle size={11} /> Acil / Önemli
                      </span>
                    )}

                    <h3 className={`font-bold text-base ${read ? 'text-slate-800 font-semibold' : 'text-slate-950 font-black'}`}>
                      {ann.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1 text-slate-700">
                      <Building2 size={13} className="text-teal-700" />
                      {ann.authorName || 'Site Yönetimi'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-500 font-mono">
                      <Calendar size={13} />
                      {new Date(ann.createdAt).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>

                    <div className="flex items-center gap-1 ml-2">
                      {/* Okundu / Okunmadı İşaretleme Butonu */}
                      <button
                        type="button"
                        onClick={() => toggleRead(ann.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                          read
                            ? 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                            : 'bg-teal-700 hover:bg-teal-800 text-white border-teal-700 shadow-2xs'
                        }`}
                        title={read ? 'Okunmadı olarak işaretle' : 'Okundu olarak işaretle'}
                      >
                        <Check size={12} />
                        <span>{read ? 'Okunmadı Yap' : 'Okundu İşaretle'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(ann.id, `${ann.title}\n\n${ann.content}`)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Metni Kopyala"
                      >
                        {copiedId === ann.id ? <Check size={14} className="text-teal-700" /> : <Copy size={14} />}
                      </button>

                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`*${ann.title}*\n\n${ann.content}\n\n— Sitera Site Yönetimi`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="WhatsApp'ta Paylaş"
                      >
                        <Share2 size={14} />
                      </a>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`"${ann.title}" başlıklı duyuruyu silmek istediğinize emin misiniz?`)) {
                              try {
                                await deleteAnnouncement(ann.id);
                              } catch (err: any) {
                                alert('Silme hatası: ' + err.message);
                              }
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Duyuruyu Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                  {ann.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. YENİ DUYURU YAYINLAMA MODALI (Admin Yetkili) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Megaphone size={18} className="text-teal-700" />
                Yeni Duyuru Yayınla
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Duyuru Başlığı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Asansör Periyodik Muayenesi & Bakımı"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:border-teal-600 outline-none text-slate-900 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-teal-600 outline-none text-slate-900 bg-white font-medium text-xs cursor-pointer"
                  >
                    <option value="Genel">📢 Genel Bilgilendirme</option>
                    <option value="Acil">🚨 Acil Durum / Uyarı</option>
                    <option value="Kesinti">⚠️ Su / Elektrik Kesintisi</option>
                    <option value="Bakım">🛠️ Bakım & Onarım</option>
                    <option value="Toplantı">👥 Kat Malikleri Toplantısı</option>
                    <option value="Aidat">💳 Aidat & Bütçe</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Yayınlayan</label>
                  <input
                    type="text"
                    disabled
                    value={user?.name || 'Site Yönetimi'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-rose-600 shrink-0" size={18} />
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">Acil / Önemli Bildirim Olarak İşaretle</span>
                    <span className="text-[11px] text-slate-500">
                      Sakinlerin ekranında kırmızı uyarı bandı olarak en tepede sabitlenir.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Duyuru Metni *</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Daire sakinlerine duyurmak istediğiniz tüm detayları buraya yazınız..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:border-teal-600 outline-none text-slate-900 text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <span>{submitting ? 'Yayınlanıyor...' : 'Duyuruyu Yayınla'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
