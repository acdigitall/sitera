import React, { useEffect, useState } from 'react';
import { X, Printer, ShieldCheck, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import { LegalDocument } from '@sitera/shared';
import { legalApi } from '../legal.api';
import { Spinner } from '../../../components/common/Spinner';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'kvkk';
  initialDocument?: LegalDocument | null;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  type,
  initialDocument,
}) => {
  const [document, setDocument] = useState<LegalDocument | null>(initialDocument || null);
  const [isLoading, setIsLoading] = useState(!initialDocument);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // ESC tuşu ile kapatma
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    // Belgeyi API'den yükle
    const fetchDoc = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await legalApi.getDocument(type);
        setDocument(data);
      } catch (err: any) {
        setError(err.message || 'Yasal belge yüklenemedi.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoc();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, type, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Basit ve güvenli Markdown başlık/madde biçimlendirici
  const renderMarkdownContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={index} className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-6 mb-3 pb-2 border-b border-slate-200">
            {trimmed.replace('# ', '')}
          </h1>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={index} className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-5 mb-2">
            {trimmed.replace('## ', '')}
          </h2>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={index} className="text-sm sm:text-base font-bold text-slate-800 tracking-tight mt-4 mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600 inline-block" />
            {trimmed.replace('### ', '')}
          </h3>
        );
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={index} className="ml-4 text-xs sm:text-sm text-slate-600 leading-relaxed list-disc">
            {trimmed.replace(/^[-*]\s/, '')}
          </li>
        );
      }
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <div key={index} className="ml-2 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium mt-1">
            {trimmed}
          </div>
        );
      }
      if (trimmed === '---') {
        return <hr key={index} className="my-4 border-slate-200" />;
      }
      if (trimmed === '') {
        return <div key={index} className="h-2" />;
      }

      return (
        <p key={index} className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white">
      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col max-h-[90vh] overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-200/60 flex items-center justify-center shrink-0">
              {type === 'terms' ? <FileText size={20} /> : <ShieldCheck size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                  {document?.title || (type === 'terms' ? 'Kullanıcı Sözleşmesi' : 'KVKK Aydınlatma Metni')}
                </h2>
                {document?.version && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                    {document.version}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Sitera Akıllı Yaşam ERP · Yasal Doküman
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer print:hidden"
              title="Yazdır"
            >
              <Printer size={18} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer print:hidden"
              title="Kapat"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 space-y-2 text-slate-700 font-sans selection:bg-sky-100">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Spinner size={32} className="text-sky-600" />
              <span className="text-xs text-slate-500 font-medium">Yasal metin yükleniyor...</span>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-rose-600 text-sm">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
              >
                Yeniden Dene
              </button>
            </div>
          ) : (
            renderMarkdownContent(document?.content || '')
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-7 py-3.5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span>634 Sayılı KMK ve 6698 Sayılı KVKK hükümlerine tam uyumludur.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Anladım ve Kapat
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
