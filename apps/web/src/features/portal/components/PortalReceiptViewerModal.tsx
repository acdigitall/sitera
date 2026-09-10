import React from 'react';
import { FileText, X, Maximize2 } from 'lucide-react';

export interface PortalReceiptViewerModalProps {
  isOpen: boolean;
  url: string | null;
  fileName?: string | null;
  fileSize?: string | null;
  isUploadedByUser?: boolean;
  onClose: () => void;
}

export const PortalReceiptViewerModal: React.FC<PortalReceiptViewerModalProps> = ({
  isOpen,
  url,
  fileName,
  fileSize,
  isUploadedByUser = false,
  onClose,
}) => {
  if (!isOpen || !url) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-scale-up text-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-teal-700" />
            <span className="font-bold text-sm text-slate-900 truncate max-w-xs sm:max-w-md">
              {!isUploadedByUser
                ? 'Sisteme İletilen FAST / Havale Dekontu'
                : fileName || 'Yüklenen Dekont'}
            </span>
            {isUploadedByUser && fileSize && (
              <span className="text-[11px] text-slate-500 font-mono font-normal">
                ({fileSize})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 p-4 bg-slate-100/60 overflow-y-auto flex items-center justify-center min-h-[400px]">
          {url.startsWith('data:application/pdf') || url.endsWith('.pdf') ? (
            <iframe
              src={url}
              title="Dekont PDF"
              className="w-full h-[60vh] rounded-xl border border-slate-300 bg-white"
            />
          ) : (
            <img
              src={url}
              alt="Dekont Önizleme"
              className="max-h-[58vh] max-w-full object-contain rounded-lg border border-slate-200 shadow-2xs"
            />
          )}
        </div>

        <div className="p-3.5 border-t border-slate-200 bg-white flex items-center justify-between">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline inline-flex items-center gap-1"
          >
            <Maximize2 size={13} /> Tam Ekran Aç
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
