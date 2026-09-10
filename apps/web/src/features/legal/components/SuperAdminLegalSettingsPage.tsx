import React, { useEffect, useState } from 'react';
import {
  Scale,
  FileText,
  ShieldCheck,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  Calendar,
  Layers,
  Info,
} from 'lucide-react';
import { LegalDocument, UpdateLegalDocumentDto } from '@sitera/shared';
import { legalApi } from '../legal.api';
import { Spinner } from '../../../components/common/Spinner';

export const SuperAdminLegalSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'terms' | 'kvkk'>('terms');
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchDocument = async (type: 'terms' | 'kvkk') => {
    try {
      setIsLoading(true);
      setNotification(null);
      const data = await legalApi.getDocument(type);
      setDocument(data);
      setTitle(data.title);
      setVersion(data.version);
      setContent(data.content);
      setIsActive(data.isActive);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Yasal belge yüklenemedi.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument(activeTab);
  }, [activeTab]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setNotification({ type: 'error', message: 'Lütfen başlık ve metin alanlarını doldurunuz.' });
      return;
    }

    try {
      setIsSaving(true);
      setNotification(null);
      const dto: UpdateLegalDocumentDto = {
        title: title.trim(),
        version: version.trim() || 'v1.0',
        content,
        isActive,
      };
      const updated = await legalApi.updateDocument(activeTab, dto);
      setDocument(updated);
      setNotification({
        type: 'success',
        message: `${updated.title} başarıyla kaydedildi ve tüm platformda güncellendi.`,
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Güncelleme kaydedilemedi.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    const confirm = window.confirm(
      'Bu belgeyi Sitera standart yasal şablonuna sıfırlamak istediğinize emin misiniz? Özel yaptığınız düzenlemeler silinecektir.',
    );
    if (!confirm) return;

    try {
      setIsResetting(true);
      setNotification(null);
      const resetDoc = await legalApi.resetToDefault(activeTab);
      setDocument(resetDoc);
      setTitle(resetDoc.title);
      setVersion(resetDoc.version);
      setContent(resetDoc.content);
      setIsActive(resetDoc.isActive);
      setNotification({
        type: 'success',
        message: `${resetDoc.title} orijinal şablona başarıyla sıfırlandı.`,
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Sıfırlama başarısız oldu.' });
    } finally {
      setIsResetting(false);
    }
  };

  const renderPreview = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-6 mb-3 pb-2 border-b border-slate-200">
            {trimmed.replace('# ', '')}
          </h1>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-5 mb-2">
            {trimmed.replace('## ', '')}
          </h2>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-sm sm:text-base font-bold text-slate-800 tracking-tight mt-4 mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600 inline-block" />
            {trimmed.replace('### ', '')}
          </h3>
        );
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 text-xs sm:text-sm text-slate-600 leading-relaxed list-disc">
            {trimmed.replace(/^[-*]\s/, '')}
          </li>
        );
      }
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <div key={idx} className="ml-2 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium mt-1">
            {trimmed}
          </div>
        );
      }
      if (trimmed === '---') {
        return <hr key={idx} className="my-4 border-slate-200" />;
      }
      if (trimmed === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Sayfa Başlığı */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
            <Scale size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Sözleşme & KVKK Yönetimi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Kullanıcı Sözleşmesi ve KVKK Aydınlatma Metni'ni canlı olarak düzenleyin ve yayımlayın.
            </p>
          </div>
        </div>

        {/* Canlı Güvenilirlik Rozeti */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span>KMK 634 & KVKK 6698 Uyumlu</span>
        </div>
      </div>

      {/* Sekmeler (Tabs) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        <button
          type="button"
          onClick={() => {
            setActiveTab('terms');
            setPreviewMode(false);
          }}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'terms'
              ? 'border-sky-600 text-sky-600 bg-sky-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <FileText size={17} />
          <span>Kullanıcı Sözleşmesi</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('kvkk');
            setPreviewMode(false);
          }}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'kvkk'
              ? 'border-sky-600 text-sky-600 bg-sky-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <ShieldCheck size={17} />
          <span>KVKK Aydınlatma Metni</span>
        </button>
      </div>

      {/* Bildirim Alanı */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Ana Düzenleme Kartı */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-20 flex flex-col items-center justify-center gap-3">
          <Spinner size={32} className="text-sky-600" />
          <span className="text-xs text-slate-500 font-medium">Metin yükleniyor...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Üst Ayarlar Toolbar */}
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/40 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Belge Başlığı */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 tracking-tight">
                Belge Başlığı
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:border-sky-600 focus:ring-4 focus:ring-sky-500/10 focus:outline-none transition-all"
                placeholder="Belge başlığını giriniz"
              />
            </div>

            {/* Versiyon / Sürüm Bilgisi */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 tracking-tight">
                Sürüm / Versiyon
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                required
                className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:border-sky-600 focus:ring-4 focus:ring-sky-500/10 focus:outline-none transition-all"
                placeholder="Örn: v2.4 - Eylül 2026"
              />
            </div>

            {/* Son Güncelleme & Yayında Durumu */}
            <div className="flex items-center justify-between gap-3 pt-5 md:pt-0">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-700">Son Değişiklik</span>
                <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <Calendar size={13} className="text-slate-400" />
                  {document?.updatedAt ? new Date(document.updatedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Bugün'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                    previewMode
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {previewMode ? <Edit3 size={14} /> : <Eye size={14} />}
                  <span>{previewMode ? 'Düzenleme Modu' : 'Canlı Önizleme'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* İçerik Düzenleme Alanı / Canlı Önizleme */}
          <div className="p-5 sm:p-7">
            {previewMode ? (
              <div className="bg-slate-50/60 rounded-xl p-6 border border-slate-200 min-h-[400px] max-h-[600px] overflow-y-auto">
                <div className="max-w-3xl mx-auto space-y-2">
                  {renderPreview(content)}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 tracking-tight">
                    Belge Metni (Markdown Desteği Mevcuttur)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {content.length.toLocaleString('tr-TR')} karakter
                  </span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={18}
                  required
                  className="w-full p-4 text-xs sm:text-sm font-mono text-slate-800 bg-slate-50/40 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-600 focus:ring-4 focus:ring-sky-500/10 focus:outline-none transition-all leading-relaxed"
                  placeholder="Yasal metin içeriğini buraya giriniz..."
                />
              </div>
            )}
          </div>

          {/* Alt Aksiyon Çubuğu */}
          <div className="px-5 sm:px-7 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={isResetting || isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-slate-200 hover:border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw size={14} className={isResetting ? 'animate-spin' : ''} />
              <span>Orijinal Şablona Sıfırla</span>
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="submit"
                disabled={isSaving || isResetting}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSaving ? (
                  <Spinner size={16} className="text-white" text="Kaydediliyor..." />
                ) : (
                  <>
                    <Save size={15} />
                    <span>Değişiklikleri Kaydet & Yayımla</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      )}

      {/* Bilgilendirme Kartı */}
      <div className="bg-sky-50/60 border border-sky-200/70 rounded-2xl p-5 flex items-start gap-3.5 text-xs text-sky-900 leading-relaxed">
        <Info size={18} className="text-sky-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-sky-950">Nasıl Çalışır?</span>
          <p className="mt-0.5 text-sky-800">
            Burada yaptığınız tüm değişiklikler doğrudan PostgreSQL veritabanına işlenir. Kullanıcılar giriş ekranındaki 
            <strong> "Kullanıcı Sözleşmesi"</strong> veya <strong>"KVKK Aydınlatma Metni"</strong> bağlantılarına tıkladıklarında 
            güncellediğiniz bu içeriği anında görüntüler.
          </p>
        </div>
      </div>
    </div>
  );
};
