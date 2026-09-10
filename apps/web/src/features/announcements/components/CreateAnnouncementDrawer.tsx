import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  X,
  Layers,
  Clock,
  AlertTriangle,
  Send,
} from 'lucide-react';
import {
  AnnouncementCategory,
  AnnouncementTargetScope,
} from '@sitera/shared';

export interface CreateAnnouncementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  authorDefault?: string;
  onCreate: (
    data: {
      title: string;
      content: string;
      category: AnnouncementCategory;
      isImportant: boolean;
      targetScope: AnnouncementTargetScope;
      targetBlocks?: string[];
      targetUnits?: string[];
      targetRole?: 'all' | 'owner' | 'resident';
      publishAt?: string | null;
    },
    authorName: string
  ) => Promise<void>;
}

export const CreateAnnouncementDrawer: React.FC<CreateAnnouncementDrawerProps> = ({
  isOpen,
  onClose,
  authorDefault = 'Site Yönetimi',
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<AnnouncementCategory>('Genel');
  const [isImportant, setIsImportant] = useState(false);
  const [authorName, setAuthorName] = useState(authorDefault);
  const [submitting, setSubmitting] = useState(false);

  // 1. Hedefleme State'i
  const [targetScope, setTargetScope] = useState<AnnouncementTargetScope>('all');
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>(['A Blok']);
  const [targetUnitsText, setTargetUnitsText] = useState('');
  const [targetRole, setTargetRole] = useState<'all' | 'owner' | 'resident'>('all');

  // 2. Zamanlama State'i
  const [scheduleType, setScheduleType] = useState<'immediate' | 'scheduled'>('immediate');
  const [publishAtDate, setPublishAtDate] = useState('');
  const [publishAtTime, setPublishAtTime] = useState('09:00');

  useEffect(() => {
    if (authorDefault) setAuthorName(authorDefault);
  }, [authorDefault]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      let publishAt: string | null = null;
      if (scheduleType === 'scheduled' && publishAtDate) {
        publishAt = new Date(`${publishAtDate}T${publishAtTime || '09:00'}:00`).toISOString();
      }

      const parsedUnits =
        targetScope === 'unit' && targetUnitsText.trim()
          ? targetUnitsText
              .split(',')
              .map((u) => u.trim())
              .filter(Boolean)
          : undefined;

      await onCreate(
        {
          title: title.trim(),
          content: content.trim(),
          category,
          isImportant,
          targetScope,
          targetBlocks: targetScope === 'block' ? selectedBlocks : undefined,
          targetUnits: parsedUnits,
          targetRole: targetScope === 'role' ? targetRole : 'all',
          publishAt,
        },
        authorName.trim() || 'Site Yönetimi'
      );

      // Sıfırla
      setTitle('');
      setContent('');
      setIsImportant(false);
      setCategory('Genel');
      setTargetScope('all');
      setSelectedBlocks(['A Blok']);
      setTargetUnitsText('');
      setTargetRole('all');
      setScheduleType('immediate');
      setPublishAtDate('');
      onClose();
    } catch (err: any) {
      alert('Bildirim yayınlanırken bir hata oluştu: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 animate-scale-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Megaphone size={18} className="text-teal-700" />
            Yeni Duyuru &amp; Tebligat Yayınla
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          <div>
            <label className="font-bold text-slate-800 block mb-1">Duyuru Başlığı *</label>
            <input
              type="text"
              required
              placeholder="Örn: A Blok Asansör Bakımı ve Yeşil Etiket Çalışması"
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
                <option value="Bakım">🛠️ Bakım &amp; Onarım</option>
                <option value="Toplantı">👥 Kat Malikleri Toplantısı</option>
                <option value="Aidat">💳 Aidat &amp; Bütçe</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Yayınlayan Kurum / Kişi</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Örn: Site Yönetimi"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-teal-600 outline-none text-slate-900 text-xs font-medium"
              />
            </div>
          </div>

          {/* 1. HEDEF KİTLE SEÇİCİ */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Layers size={14} className="text-teal-700" />
                Hedef Kitle Seçimi (Kimler Görebilsin?)
              </span>
              <span className="text-[11px] text-slate-500">Filtreli Gösterim</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setTargetScope('all')}
                className={`px-2.5 py-1.5 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                  targetScope === 'all'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                Tüm Site
              </button>
              <button
                type="button"
                onClick={() => setTargetScope('block')}
                className={`px-2.5 py-1.5 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                  targetScope === 'block'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                Belirli Blok
              </button>
              <button
                type="button"
                onClick={() => setTargetScope('role')}
                className={`px-2.5 py-1.5 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                  targetScope === 'role'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                KMK Rolü
              </button>
              <button
                type="button"
                onClick={() => setTargetScope('unit')}
                className={`px-2.5 py-1.5 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                  targetScope === 'unit'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                Özel Daireler
              </button>
            </div>

            {/* Blok Seçimi Alanı */}
            {targetScope === 'block' && (
              <div className="pt-2 border-t border-slate-200/80 flex items-center gap-3">
                <span className="text-[11px] font-bold text-slate-700">Hedef Bloklar:</span>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBlocks.includes('A Blok')}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedBlocks([...selectedBlocks, 'A Blok']);
                      else setSelectedBlocks(selectedBlocks.filter((b) => b !== 'A Blok'));
                    }}
                    className="rounded text-teal-700"
                  />
                  <span>A Blok</span>
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBlocks.includes('B Blok')}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedBlocks([...selectedBlocks, 'B Blok']);
                      else setSelectedBlocks(selectedBlocks.filter((b) => b !== 'B Blok'));
                    }}
                    className="rounded text-teal-700"
                  />
                  <span>B Blok</span>
                </label>
              </div>
            )}

            {/* Rol Seçimi Alanı */}
            {targetScope === 'role' && (
              <div className="pt-2 border-t border-slate-200/80 flex items-center gap-3">
                <span className="text-[11px] font-bold text-slate-700">Hedef Rol:</span>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="targetRoleRadioDrawer"
                    checked={targetRole === 'owner'}
                    onChange={() => setTargetRole('owner')}
                    className="text-teal-700"
                  />
                  <span>Sadece Kat Malikleri (Ev Sahipleri)</span>
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="targetRoleRadioDrawer"
                    checked={targetRole === 'resident'}
                    onChange={() => setTargetRole('resident')}
                    className="text-teal-700"
                  />
                  <span>Sadece Kiracılar (İkamet Edenler)</span>
                </label>
              </div>
            )}

            {/* Özel Daireler Alanı */}
            {targetScope === 'unit' && (
              <div className="pt-2 border-t border-slate-200/80">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Hedef Daireler (Virgülle Ayırarak Yazınız):
                </label>
                <input
                  type="text"
                  placeholder="Örn: A Blok D.1, A Blok D.2, B Blok D.5"
                  value={targetUnitsText}
                  onChange={(e) => setTargetUnitsText(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            )}
          </div>

          {/* 2. ZAMANLANMIŞ YAYINLAMA SEÇİCİ */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Clock size={14} className="text-teal-700" />
                Yayınlama Zamanlaması
              </span>
              <span className="text-[11px] text-slate-500">Zaman Ayarı</span>
            </div>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="scheduleRadioDrawer"
                  checked={scheduleType === 'immediate'}
                  onChange={() => setScheduleType('immediate')}
                  className="text-teal-700"
                />
                <span>Hemen Canlıya Al</span>
              </label>

              <label className="inline-flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="scheduleRadioDrawer"
                  checked={scheduleType === 'scheduled'}
                  onChange={() => setScheduleType('scheduled')}
                  className="text-teal-700"
                />
                <span>İleri Bir Tarihte Yayınla (Zamanla)</span>
              </label>
            </div>

            {scheduleType === 'scheduled' && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Yayın Tarihi</label>
                  <input
                    type="date"
                    required
                    value={publishAtDate}
                    onChange={(e) => setPublishAtDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Yayın Saati</label>
                  <input
                    type="time"
                    value={publishAtTime}
                    onChange={(e) => setPublishAtTime(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Acil Durum Switch */}
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
            <label className="font-bold text-slate-800 block mb-1">Bildirim İçeriği *</label>
            <textarea
              required
              rows={5}
              placeholder="Daire sakinlerine duyurmak istediğiniz tüm detayları buraya yazınız (tarih, saat, kesinti süresi, yapılacak işlemler vb.)..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:border-teal-600 outline-none text-slate-900 text-xs leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Send size={13} />
              <span>
                {submitting
                  ? 'İşleniyor...'
                  : scheduleType === 'scheduled'
                  ? 'Zamanlayarak Kaydet'
                  : 'Hemen Yayınla'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
