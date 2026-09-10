import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Lock,
  Pencil,
  ExternalLink,
} from 'lucide-react';
import { getSiteCommunicationQuota } from '../services/communication-mock';

export interface SiteCardGridViewProps {
  filteredGroups: any[];
  tenantSlug: string;
  onOpenQuickEdit: (group: any, e: React.MouseEvent) => void;
}

export const SiteCardGridView: React.FC<SiteCardGridViewProps> = ({
  filteredGroups,
  tenantSlug,
  onOpenQuickEdit,
}) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
      {filteredGroups.map((group) => {
        const detailUrl = `/${tenantSlug}/admin/sites/${group.slug}`;
        const targetSiteOverviewUrl = `/${group.slug}/admin/overview`;
        const primaryManager = group.managers[0];
        const primaryTech = group.technicians[0];

        return (
          <div
            key={group.id}
            className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm truncate">
                    {group.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <MapPin size={12} className="text-slate-400" />
                    <span>
                      {group.district}, {group.city}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {group.isFrozen ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
                      <Lock size={10} /> Donduruldu
                    </span>
                  ) : group.isTrial ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Lansman ({group.remainingDays} gün)
                    </span>
                  ) : group.remainingDays <= 30 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                      {group.remainingDays} gün kaldı
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Aktif ({group.remainingDays} gün)
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Bağımsız Bölüm:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {group.totalUnits} daire ({group.residentsCount} sakin)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Yönetici:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[170px]">
                    {primaryManager ? primaryManager.name : 'Atanmamış'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Teknik Ekip:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[170px]">
                    {primaryTech ? primaryTech.name : 'Yok'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                  <span className="text-slate-400">Tarife:</span>
                  <div className="flex items-center gap-1 font-mono">
                    <span className="font-semibold text-slate-800">₺{group.unitFee}/daire</span>
                    <span className="text-slate-400 text-[11px]">(₺{group.monthlyFee}/ay)</span>
                    <button
                      type="button"
                      onClick={(e) => onOpenQuickEdit(group, e)}
                      className="text-slate-400 hover:text-slate-700 p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer ml-1"
                      title="Ücreti düzenle"
                    >
                      <Pencil size={11} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                  <span className="text-slate-400">Mesaj Kotası:</span>
                  <button
                    type="button"
                    onClick={() => navigate(`/${tenantSlug}/admin/messages`)}
                    className="flex items-center gap-1 font-mono text-[11px] text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    <span>
                      {getSiteCommunicationQuota(group).smsRemaining} SMS ·{' '}
                      {getSiteCommunicationQuota(group).whatsappRemaining} WP
                    </span>
                    <span className="text-[9px] px-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      Demo
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => navigate(detailUrl)}
                className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors cursor-pointer text-center"
              >
                Detayları Yönet
              </button>
              <button
                type="button"
                onClick={() => window.open(targetSiteOverviewUrl, '_blank')}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Site paneline git"
              >
                <ExternalLink size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
