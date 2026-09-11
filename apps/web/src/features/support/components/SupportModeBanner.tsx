import React from 'react';
import { ShieldAlert, LogOut, FileText, AlertTriangle } from '../../../components/common/fontawesome-icons';
import { useSupport } from '../context/SupportContext';
import { useNavigate } from 'react-router-dom';

export const SupportModeBanner: React.FC = () => {
  const { supportSession, exitSupportMode } = useSupport();
  const navigate = useNavigate();

  if (!supportSession) return null;

  const handleExit = () => {
    exitSupportMode();
    navigate('/admin/support');
  };

  return (
    <div className="bg-amber-950 text-amber-100 border-b border-amber-800/80 px-4 py-2.5 sm:px-6 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <ShieldAlert size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-amber-300 uppercase tracking-wider text-[10px] bg-amber-900/80 border border-amber-700/60 px-2 py-0.5 rounded">
                KVKK Teknik Destek Modu
              </span>
              <span className="font-semibold text-white">
                {supportSession.targetGroupName}
              </span>
              <span className="text-amber-300/80 font-mono">
                (Talep #{supportSession.ticketId})
              </span>
            </div>
            <p className="text-[11px] text-amber-200/70 mt-0.5">
              Yöneticinin onayıyla teknik müdahale oturumundasınız. Tüm işlemler denetim günlüğüne (Audit Log) kaydedilmektedir.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={handleExit}
            className="h-8 px-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <LogOut size={13} />
            <span>Destek Oturumunu Kapat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
