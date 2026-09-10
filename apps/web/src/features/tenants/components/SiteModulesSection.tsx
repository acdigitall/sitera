import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Group, PlatformModuleCode, PLATFORM_MODULE_CATALOG } from '@sitera/shared';

export interface SiteModulesSectionProps {
  group: Group;
  totalUnits: number;
  tenantSlug: string;
  savingModule: boolean;
  onToggleModule: (
    moduleCode: PlatformModuleCode,
    status: 'active' | 'trial' | 'inactive',
    durationDays?: number
  ) => void;
}

export const SiteModulesSection: React.FC<SiteModulesSectionProps> = ({
  group,
  totalUnits,
  tenantSlug,
  savingModule,
  onToggleModule,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <Sparkles size={15} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>Aktif Eklenti &amp; IoT Paketleri</span>
              <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Feature Entitlements
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Bu siteye özel lisanslanan plaka tanıma, misafir QR ve akıllı interkom yetkileri
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => navigate(`/${tenantSlug}/admin/modules`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <span>Tüm Siteler Matrisi</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Modül Rozetleri Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PLATFORM_MODULE_CATALOG.map((mod) => {
          const sub = (group.modules || []).find((s) => s.moduleCode === mod.code);
          const isActive = sub?.status === 'active';
          const isTrial = sub?.status === 'trial';
          const cost = mod.pricingModel === 'per_unit' ? totalUnits * mod.defaultPrice : mod.defaultPrice;

          return (
            <div
              key={mod.code}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                isActive
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : isTrial
                  ? 'border-purple-200 bg-purple-50/40'
                  : 'border-slate-200 bg-slate-50/30'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-1.5 mb-2">
                  <span className="text-xs font-bold text-slate-900">{mod.name.split('&')[0].trim()}</span>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Aktif (₺{cost}/ay)
                    </span>
                  ) : isTrial ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                      Deneme
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[10px] text-slate-400 bg-slate-100 border border-slate-200 font-mono">
                      Kapalı
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">
                  {mod.shortDescription}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400 font-mono">
                  {mod.pricingModel === 'per_unit' ? `₺${mod.defaultPrice}/daire` : `₺${mod.defaultPrice} Sabit`}
                </span>
                {/* Doğrudan Kart Üzerinde Segmented Kontrol */}
                <div className="inline-flex items-center bg-slate-200/80 p-0.5 rounded-md text-[10px] border border-slate-300/60 shrink-0">
                  <button
                    type="button"
                    disabled={savingModule}
                    onClick={() => onToggleModule(mod.code, 'inactive')}
                    className={`px-1.5 py-0.5 rounded font-medium transition-all cursor-pointer ${
                      !isActive && !isTrial
                        ? 'bg-white text-slate-900 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pasif
                  </button>
                  <button
                    type="button"
                    disabled={savingModule}
                    onClick={() => onToggleModule(mod.code, 'trial', 30)}
                    className={`px-1.5 py-0.5 rounded font-medium transition-all cursor-pointer ${
                      isTrial
                        ? 'bg-purple-600 text-white font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-purple-700'
                    }`}
                  >
                    Deneme
                  </button>
                  <button
                    type="button"
                    disabled={savingModule}
                    onClick={() => onToggleModule(mod.code, 'active', 365)}
                    className={`px-1.5 py-0.5 rounded font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-emerald-700'
                    }`}
                  >
                    Aktif
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
