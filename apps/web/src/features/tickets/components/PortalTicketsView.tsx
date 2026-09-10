import React, { useState, useRef } from 'react';
import {
  LifeBuoy,
  Plus,
  Camera,
  UploadCloud,
  CheckCircle2,
  Clock,
  Wrench,
  AlertCircle,
  MapPin,
  X,
  ExternalLink,
  ChevronRight,
  Filter,
  Image as ImageIcon,
  MessageSquare,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../auth';
import { useTickets } from '../useTickets';
import {
  TicketCategory,
  TicketUrgency,
  validateBrowserFile,
  MAX_PHOTO_SIZE_BYTES,
  PHOTO_ALLOWED_MIME_TYPES,
  MAX_TICKET_PHOTOS_COUNT,
} from '@sitera/shared';
import { openReceiptInNewTab } from '../../finance';

const CATEGORIES: { id: TicketCategory; label: string; icon: string; desc: string }[] = [
  { id: 'Peyzaj & Bahçe', label: 'Peyzaj & Bahçe', icon: '🌿', desc: 'Çim biçme, ağaç budama, bahçe sulama' },
  { id: 'Asansör & Elektrik', label: 'Asansör & Elektrik', icon: '⚡', desc: 'Asansör arızası, koridor lambaları, otomat' },
  { id: 'Temizlik & Hijyen', label: 'Temizlik & Hijyen', icon: '🧹', desc: 'Blok merdivenleri, çöp alanı, ortak alanlar' },
  { id: 'Güvenlik & Kapı', label: 'Güvenlik & Kapı', icon: '🛡️', desc: 'Bina giriş kapısı, otopark bariyeri, şifre paneli' },
  { id: 'Sıhhi Tesisat', label: 'Sıhhi Tesisat', icon: '🚰', desc: 'Su deposu, hidrofor, boru sızıntısı, logar' },
  { id: 'Ortak Alan & Demirbaş', label: 'Ortak Alan & Demirbaş', icon: '🏢', desc: 'Çatı, dış cephe, sığınak, yangın merdiveni' },
  { id: 'Diğer', label: 'Diğer Konular', icon: '📝', desc: 'Genel öneri, şikayet ve diğer talepler' },
];

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

export const PortalTicketsView: React.FC = () => {
  const { user, selectedUnit } = useAuth();
  const userUnits = user?.units && user.units.length > 0 ? user.units : [user?.name || 'Daire'];
  const activeUnit = selectedUnit && selectedUnit !== 'all' ? selectedUnit : userUnits[0];

  const { tickets, loading, createTicket, refetch } = useTickets({
    groupId: user?.groupId,
    unit: activeUnit,
    userId: user?.id,
    isStaff: false,
  });

  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory>('Peyzaj & Bahçe');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState<TicketUrgency>('normal');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Photo Selection & Base64 conversion with Security Validation
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > MAX_TICKET_PHOTOS_COUNT) {
      setErrorMessage(`Bir talep için en fazla ${MAX_TICKET_PHOTOS_COUNT} adet fotoğraf yükleyebilirsiniz.`);
      if (e.target) e.target.value = '';
      return;
    }

    setErrorMessage(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = await validateBrowserFile(file, {
        maxSizeBytes: MAX_PHOTO_SIZE_BYTES,
        allowedMimeTypes: PHOTO_ALLOWED_MIME_TYPES,
        scanMaliciousSignatures: true,
      });

      if (!validation.isValid) {
        setErrorMessage(validation.error || `"${file.name}" güvenlik kontrolünden geçemedi.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos((prev) => {
            if (prev.length >= MAX_TICKET_PHOTOS_COUNT) return prev;
            return [...prev, event.target!.result as string];
          });
        }
      };
      reader.readAsDataURL(file);
    }

    if (e.target) e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Lütfen talebiniz için kısa bir başlık giriniz.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Lütfen tespit ettiğiniz sorunu veya talebinizi açıklayınız.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await createTicket({
        unit: activeUnit,
        residentName: user?.name || activeUnit,
        residentPhone: (user as any)?.phone || undefined,
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        location: location.trim() || undefined,
        urgency,
        photos,
      });

      setSuccessBanner(
        `✅ Talebiniz başarıyla site yönetimine iletildi. Yönetici inceledikten sonra durum buradan güncellenecektir.`
      );
      // Reset form
      setTitle('');
      setDescription('');
      setLocation('');
      setPhotos([]);
      setUrgency('normal');
      setActiveTab('history');
      setTimeout(() => setSuccessBanner(null), 8000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Talep oluşturulurken hata meydana geldi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-16">
      {/* 1. FLUSH PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <LifeBuoy className="text-teal-700" size={26} />
              <span>Talep & Arıza Bildirimi</span>
            </h1>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md">
              {activeUnit}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Ortak alanlardaki arıza, temizlik, peyzaj veya güvenlik ihtiyaçlarını fotoğraflayarak doğrudan yöneticiye iletin.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-2 ${
              activeTab === 'new'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus size={14} className={activeTab === 'new' ? 'text-teal-700' : ''} />
            <span>Yeni Talep Bildir</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock size={14} className={activeTab === 'history' ? 'text-teal-700' : ''} />
            <span>Taleplerim ({tickets.length})</span>
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-scale-up">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-teal-700 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-teal-700 hover:text-teal-900 p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TAB 1: YENİ TALEP FORMU */}
      {activeTab === 'new' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Kategori Seçim Izgarası */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Talep / Arıza Kategorisi Seçiniz
              </label>
              <span className="text-[11px] text-slate-400">Konu ile en alakalı başlığı seçiniz</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[85px] ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-600/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{cat.icon}</span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                      )}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isSelected ? 'text-teal-950' : 'text-slate-800'}`}>
                        {cat.label}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                        {cat.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fotoğraf Yükleme Alanı */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  2. Fotoğraf Ekleyin (İsteğe Bağlı ama Önerilir)
                </label>
                <span className="text-xs text-slate-400">
                  Sorunun veya çimlerin durumunu fotoğraflayarak yöneticinin daha hızlı müdahale etmesini sağlayın
                </span>
              </div>
              <span className="text-xs font-bold font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {photos.length} Fotoğraf Eklendi
              </span>
            </div>

            {/* Drag & Drop / File Select Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-teal-600 bg-slate-50/70 hover:bg-teal-50/20 transition-all rounded-xl p-6 text-center cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                onChange={handlePhotoSelect}
              />
              <div className="w-12 h-12 mx-auto rounded-full bg-teal-100/70 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera size={24} />
              </div>
              <div className="mt-3 font-semibold text-xs sm:text-sm text-slate-800">
                Fotoğraf Yüklemek İçin Tıklayın veya Sürükleyin
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                PNG, JPG, WEBP (Fotoğraf başına maks. 5 MB, en fazla 5 fotoğraf)
              </p>
            </div>

            {/* Thumbnail Preview Grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
                {photos.map((imgUrl, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-100">
                    <img
                      src={imgUrl}
                      alt={`Yüklenen Fotoğraf ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(idx);
                      }}
                      className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700 transition-colors cursor-pointer"
                      title="Fotoğrafı Kaldır"
                    >
                      <X size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openReceiptInNewTab(imgUrl);
                      }}
                      className="absolute bottom-1 right-1 bg-slate-900/70 text-white rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Büyüt"
                    >
                      <ExternalLink size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Konum, Başlık ve Açıklama */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              3. Detay Bilgileri & Açıklama
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Konum / Bölge (Nerede?)
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Örn: Arka Bahçe, 2. Kat Asansör Önü, Garaj"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Aciliyet Derecesi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUrgency('normal')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      urgency === 'normal'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🟢 Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgency('urgent')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      urgency === 'urgent'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🔴 Acil Müdahale
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Kısa Başlık <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Arka bahçe çimleri çok uzadı, biçilmesi gerekiyor"
                className="w-full px-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors font-medium"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Detaylı Açıklama <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Sorunu veya talebinizi detaylı olarak açıklayınız (Örn: Çimler yürüyüş yolunu ve çocuk parkını kapatmış durumda, zararlı böcek oluşumunu engellemek için acil biçilmesi rica olunur)..."
                className="w-full px-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                required
              />
            </div>
          </div>

          {/* Form Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>İletiliyor...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={17} />
                  <span>🚀 Talebi Yöneticiye Gönder</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: GEÇMİŞ TALEPLERİM VE TAKİP LİSTESİ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span>Talepleriniz yükleniyor...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <LifeBuoy size={24} />
              </div>
              <div className="font-bold text-slate-800 text-sm">Henüz Bir Talep Bildirmediniz</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Apartman veya sitenizde tespit ettiğiniz çim, arıza, temizlik veya ortak alan ihtiyaçlarını fotoğraflayarak bildirebilirsiniz.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('new')}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                İlk Talebi Oluştur
              </button>
            </div>
          ) : (
            tickets.map((t) => {
              const isOpen = t.status === 'open';
              const isInProgress = t.status === 'in_progress';
              const isResolved = t.status === 'resolved' || t.status === 'closed';

              return (
                <div
                  key={t.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all overflow-hidden p-5 space-y-4"
                >
                  {/* Card Top: Kategori + Durum Rozeti + Tarih */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 inline-flex items-center gap-1.5">
                        <span>{CATEGORIES.find((c) => c.id === t.category)?.icon || '📝'}</span>
                        <span>{t.category}</span>
                      </span>

                      {t.location && (
                        <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 inline-flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" />
                          <span>{t.location}</span>
                        </span>
                      )}

                      {t.urgency === 'urgent' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                          🔴 Acil
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {isOpen && (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5">
                          <Clock size={13} className="text-amber-600" />
                          <span>⏳ Yönetici İnceliyor</span>
                        </span>
                      )}
                      {isInProgress && (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 inline-flex items-center gap-1.5">
                          <Wrench size={13} className="text-blue-600" />
                          <span>🛠️ İşleme Alındı / Görevliye İletildi</span>
                        </span>
                      )}
                      {isResolved && (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span>✅ Çözüldü</span>
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 font-medium">
                        {new Date(t.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Card Middle: Başlık + Açıklama */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{t.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  {/* Fotoğraflar */}
                  {(() => {
                    const normalizedPhotos = getNormalizedPhotos(t.photos);
                    if (normalizedPhotos.length === 0) return null;
                    return (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Yüklenen Fotoğraflar ({normalizedPhotos.length})
                        </span>
                        <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                          {normalizedPhotos.map((photoUrl, pIdx) => (
                            <div
                              key={pIdx}
                              onClick={() => openReceiptInNewTab(photoUrl)}
                              className="relative group w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shrink-0 cursor-pointer shadow-2xs hover:opacity-90 transition-opacity bg-slate-100"
                              title="Tam Ekran Aç"
                            >
                              <img
                                src={photoUrl}
                                alt="Talep Fotoğrafı"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <ExternalLink size={14} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Yönetici Yanıtı / Çözüm Notu */}
                  {t.adminNotes && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                        <MessageSquare size={15} />
                      </div>
                      <div className="text-xs space-y-0.5">
                        <span className="font-bold text-slate-900 block">Site Yönetimi Yanıtı:</span>
                        <p className="text-slate-600 leading-relaxed font-medium">{t.adminNotes}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
