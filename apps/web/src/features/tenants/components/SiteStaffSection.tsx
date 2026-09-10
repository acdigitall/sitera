import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Wrench, Plus, Mail, Phone, Check, Copy } from 'lucide-react';
import { User as UserType } from '@sitera/shared';

export interface SiteStaffSectionProps {
  managers: UserType[];
  technicians: UserType[];
  tenantSlug: string;
  copiedText: string | null;
  onCopy: (text: string, e: React.MouseEvent) => void;
}

export const SiteStaffSection: React.FC<SiteStaffSectionProps> = ({
  managers,
  technicians,
  tenantSlug,
  copiedText,
  onCopy,
}) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* [A] Yönetim Kurulu */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Briefcase size={15} />
            </div>
            <h2 className="font-bold text-slate-900 text-sm">
              Yönetim Kurulu ({managers.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/${tenantSlug}/admin/users/new?role=admin`)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
          >
            <Plus size={13} />
            <span>Yönetici Ata</span>
          </button>
        </div>

        {managers.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Bu sitede henüz atanmış yönetici bulunmuyor.
          </div>
        ) : (
          <div className="space-y-3">
            {managers.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                  <div className="text-slate-500 font-mono mt-1 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Mail size={12} className="text-slate-400" />
                      {m.email}
                    </span>
                    {m.phone && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" />
                          {m.phone}
                          <button
                            type="button"
                            onClick={(e) => onCopy(m.phone || '', e)}
                            className="text-slate-400 hover:text-slate-700 p-0.5"
                            title="Telefonu Kopyala"
                          >
                            {copiedText === m.phone ? (
                              <Check size={11} className="text-teal-600" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider shrink-0">
                  {m.role === 'admin' ? 'Site Yöneticisi' : 'Muhasebe'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* [B] Teknik Servis & Hizmet Personeli */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
              <Wrench size={15} />
            </div>
            <h2 className="font-bold text-slate-900 text-sm">
              Teknik Servis & Saha Personeli ({technicians.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/${tenantSlug}/admin/users/new?role=staff`)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 cursor-pointer"
          >
            <Plus size={13} />
            <span>Personel Ata</span>
          </button>
        </div>

        {technicians.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Bu sitede henüz tanımlanmış teknik personel bulunmuyor.
          </div>
        ) : (
          <div className="space-y-3">
            {technicians.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                  <div className="text-slate-500 font-mono mt-1 flex items-center gap-2 flex-wrap">
                    {t.phone ? (
                      <span className="flex items-center gap-1">
                        <Phone size={12} className="text-slate-400" />
                        {t.phone}
                        <button
                          type="button"
                          onClick={(e) => onCopy(t.phone || '', e)}
                          className="text-slate-400 hover:text-slate-700 p-0.5"
                          title="Telefonu Kopyala"
                        >
                          {copiedText === t.phone ? (
                            <Check size={11} className="text-teal-600" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Mail size={12} className="text-slate-400" />
                        {t.email}
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                  {t.units?.[0] || 'Teknik Personel'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
