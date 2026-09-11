import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCheck, X } from 'lucide-react';
import { AnnouncementReadStats } from '@sitera/shared';

export interface AnnouncementStatsModalProps {
  isOpen: boolean;
  statsLoading: boolean;
  readStatsData: AnnouncementReadStats | null;
  onClose: () => void;
}

export const AnnouncementStatsModal: React.FC<AnnouncementStatsModalProps> = ({
  isOpen,
  statsLoading,
  readStatsData,
  onClose,
}) => {
  // Escape key and body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
    >
      <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-up max-h-[90vh] overflow-y-auto my-auto">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-xs z-10 -mx-6 -mt-6 px-6 pt-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
              <CheckCheck size={16} />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Duyuru Okunma Dökümü &amp; Tebligat Takibi
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {statsLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Okuma kayıtları yükleniyor...
          </div>
        ) : !readStatsData ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Veri bulunamadı.
          </div>
        ) : (
          <div className="space-y-4 mt-4 text-xs">
            {/* İstatistik Özeti */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Hedeflenen</div>
                <div className="text-base font-bold text-slate-800">
                  {readStatsData.totalTargetUnits} Daire
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Okuyanlar</div>
                <div className="text-base font-bold text-emerald-700">
                  {readStatsData.readCount} Daire
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Okuma Yüzdesi</div>
                <div className="text-base font-bold text-teal-800">
                  %{readStatsData.readPercentage}
                </div>
              </div>
            </div>

            {/* Okuyan Sakinler Listesi */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs mb-2 flex items-center justify-between">
                <span>Okuyan Sakinler ({readStatsData.reads.length})</span>
                <span className="text-[11px] text-emerald-700 font-medium">Resmi Kayıt</span>
              </h4>
              {readStatsData.reads.length === 0 ? (
                <div className="p-4 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  Henüz hiçbir sakin tarafından görüntülenmedi.
                </div>
              ) : (
                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                  {readStatsData.reads.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-md bg-emerald-50/40 border border-emerald-100"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{r.unit}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-700 font-medium">{r.userName}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">
                        {new Date(r.readAt).toLocaleString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Henüz Okumamış Daireler */}
            {readStatsData.unreadUnits.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-1.5 flex items-center justify-between">
                  <span className="text-amber-800">Henüz Okumayan Daireler ({readStatsData.unreadUnits.length})</span>
                  <span className="text-[11px] text-slate-400">Beklemede</span>
                </h4>
                <div className="flex flex-wrap gap-1.5 p-2.5 bg-amber-50/40 border border-amber-100 rounded-lg">
                  {readStatsData.unreadUnits.map((u, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-white border border-amber-200 text-amber-900 font-bold text-[11px]"
                    >
                      {u}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
