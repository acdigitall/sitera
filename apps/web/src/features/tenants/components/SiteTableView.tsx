import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Copy,
  Check,
  Pencil,
  ExternalLink,
  ChevronRight,
  Lock,
  Unlock,
  AlertCircle,
} from 'lucide-react';
import { getSiteCommunicationQuota } from '../services/communication-mock';

export interface SiteTableViewProps {
  filteredGroups: any[];
  tenantSlug: string;
  copiedId: string | null;
  onCopyPhone: (phone: string, id: string, e: React.MouseEvent) => void;
  onOpenQuickEdit: (group: any, e: React.MouseEvent) => void;
  onToggleFreeze: (group: any, e: React.MouseEvent) => void;
  actionGroupId: string | null;
  actionFeedback: { type: 'success' | 'error'; text: string } | null;
}

export const SiteTableView: React.FC<SiteTableViewProps> = ({
  filteredGroups,
  tenantSlug,
  copiedId,
  onCopyPhone,
  onOpenQuickEdit,
  onToggleFreeze,
  actionGroupId,
  actionFeedback,
}) => {
  const navigate = useNavigate();

  return (
    <div className="w-full overflow-hidden">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-medium text-[11px] uppercase tracking-wider">
            <th className="py-2.5 px-3 sm:px-4 w-[21%]">Site / Apartman</th>
            <th className="py-2.5 px-2.5 sm:px-3 w-[12%]">Konum</th>
            <th className="py-2.5 px-2.5 sm:px-3 w-[10%]">Bölüm</th>
            <th className="py-2.5 px-2.5 sm:px-3 w-[14%]">Yönetici</th>
            <th className="py-2.5 px-2.5 sm:px-3 w-[12%]">Teknik Personel</th>
            <th className="py-2.5 px-2.5 sm:px-3 w-[14%]">Lisans</th>
            <th className="py-2.5 px-2.5 sm:px-3 w-[11%]">SMS &amp; WP</th>
            <th className="py-2.5 px-3 text-right w-[6%]">İşlem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {filteredGroups.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-12 text-center text-slate-400">
                <AlertCircle size={20} className="mx-auto mb-1.5 text-slate-300" />
                Arama kriterlerinize uygun site bulunamadı.
              </td>
            </tr>
          ) : (
            filteredGroups.map((group) => {
              const detailUrl = `/${tenantSlug}/admin/sites/${group.slug}`;
              const targetSiteOverviewUrl = `/${group.slug}/admin/overview`;
              const primaryManager = group.managers[0];
              const primaryTech = group.technicians[0];
              const commQuota = getSiteCommunicationQuota(group);

              return (
                <tr key={group.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* 1. Site Adı */}
                  <td className="py-2.5 px-3 sm:px-4">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 truncate">
                        <span className="truncate">{group.name}</span>
                        {group.isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                        sitera.app/{group.slug}
                      </div>
                    </div>
                  </td>

                  {/* 2. Konum */}
                  <td className="py-2.5 px-2.5 sm:px-3 text-slate-600">
                    <div className="flex items-center gap-1 text-xs truncate">
                      <MapPin size={11} className="text-slate-400 shrink-0" />
                      <span className="truncate">
                        {group.district}, {group.city}
                      </span>
                    </div>
                  </td>

                  {/* 3. Bağımsız Bölüm */}
                  <td className="py-2.5 px-2.5 sm:px-3">
                    <span className="font-mono font-medium text-slate-900 text-xs">
                      {group.totalUnits} Bölüm
                    </span>
                    <div className="text-[11px] text-slate-400">
                      {group.residentsCount} sakin
                    </div>
                  </td>

                  {/* 4. Site Yöneticisi */}
                  <td className="py-2.5 px-2.5 sm:px-3">
                    {primaryManager ? (
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 text-xs truncate">
                          {primaryManager.name}
                        </div>
                        {primaryManager.phone ? (
                          <button
                            type="button"
                            onClick={(e) =>
                              onCopyPhone(primaryManager.phone!, `${group.id}-mgr`, e)
                            }
                            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 font-mono transition-colors cursor-pointer mt-0.5 max-w-full truncate"
                            title="Telefon numarasını kopyala"
                          >
                            <Phone size={9} className="text-slate-400 shrink-0" />
                            <span className="truncate">{primaryManager.phone}</span>
                            {copiedId === `${group.id}-mgr` ? (
                              <Check size={9} className="text-emerald-600 shrink-0" />
                            ) : (
                              <Copy size={9} className="text-slate-300 hover:text-slate-500 shrink-0" />
                            )}
                          </button>
                        ) : (
                          <div className="text-[11px] text-slate-400 truncate">
                            {primaryManager.email}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">Yönetici atanmamış</span>
                    )}
                  </td>

                  {/* 5. Teknik Personel */}
                  <td className="py-2.5 px-2.5 sm:px-3">
                    {primaryTech ? (
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800 text-xs truncate">
                          {primaryTech.name}
                        </div>
                        {primaryTech.phone ? (
                          <button
                            type="button"
                            onClick={(e) =>
                              onCopyPhone(primaryTech.phone!, `${group.id}-tech`, e)
                            }
                            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 font-mono transition-colors cursor-pointer mt-0.5 max-w-full truncate"
                            title="Telefon numarasını kopyala"
                          >
                            <Phone size={9} className="text-slate-400 shrink-0" />
                            <span className="truncate">{primaryTech.phone}</span>
                            {copiedId === `${group.id}-tech` ? (
                              <Check size={9} className="text-emerald-600 shrink-0" />
                            ) : (
                              <Copy size={9} className="text-slate-300 hover:text-slate-500 shrink-0" />
                            )}
                          </button>
                        ) : (
                          <div className="text-[11px] text-slate-400 truncate">
                            {primaryTech.email}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">Teknik ekip yok</span>
                    )}
                  </td>

                  {/* 6. Lisans & Tarife */}
                  <td className="py-2.5 px-2.5 sm:px-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {group.isFrozen ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                            <Lock size={9} /> Donduruldu
                          </span>
                        ) : group.isTrial ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Lansman ({group.remainingDays} gün)
                          </span>
                        ) : group.remainingDays <= 30 ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            {group.remainingDays} gün kaldı
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Aktif ({group.remainingDays} gün)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                        <span className="truncate">₺{group.unitFee}/d · ₺{group.monthlyFee}/ay</span>
                        <button
                          type="button"
                          onClick={(e) => onOpenQuickEdit(group, e)}
                          className="text-slate-400 hover:text-slate-700 p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                          title="Fiyat tarifesini düzenle"
                        >
                          <Pencil size={10} />
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* 7. SMS & WhatsApp */}
                  <td className="py-2.5 px-2.5 sm:px-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/${tenantSlug}/admin/messages`)}
                      className="text-left font-mono text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer truncate block max-w-full"
                      title="İletişim kotalarını incele (Demo Veri)"
                    >
                      <span className="font-semibold">{commQuota.smsRemaining}</span> SMS
                      <span className="text-slate-300 mx-0.5">/</span>
                      <span className="font-semibold">{commQuota.whatsappRemaining}</span> WP
                    </button>
                  </td>

                  {/* 8. İşlemler */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => onToggleFreeze(group, e)}
                        disabled={actionGroupId === group.id}
                        className={`p-1 rounded-md border transition-colors cursor-pointer disabled:opacity-50 ${
                          group.isFrozen
                            ? 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                            : 'text-slate-400 border-slate-200 hover:text-amber-700 hover:bg-amber-50'
                        }`}
                        title={group.isFrozen ? 'Siteyi Aktifleştir' : 'Siteyi Dondur'}
                      >
                        {group.isFrozen ? <Unlock size={12} /> : <Lock size={12} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => window.open(targetSiteOverviewUrl, '_blank')}
                        className="p-1 rounded-md border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                        title="Site Paneline Git (Yeni Sekme)"
                      >
                        <ExternalLink size={12} />
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(detailUrl)}
                        className="inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                        title="Site Yönetim Detayları"
                      >
                        <span>Detay</span>
                        <ChevronRight size={11} />
                      </button>
                    </div>

                    {actionGroupId === group.id && actionFeedback && (
                      <div
                        className={`mt-1 text-[10px] text-right font-medium ${
                          actionFeedback.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {actionFeedback.text}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
