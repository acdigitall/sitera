import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Plus,
} from 'lucide-react';
import { Group } from '@sitera/shared';

export interface SiteDetailHeaderProps {
  group: Group;
  tenantSlug: string;
}

export const SiteDetailHeader: React.FC<SiteDetailHeaderProps> = ({
  group,
  tenantSlug,
}) => {
  const navigate = useNavigate();
  const siteUrl = `/${group.slug}/admin/overview`;

  return (
    <div>
      {/* 1. Üst Navigasyon */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => navigate(`/${tenantSlug}/admin/overview`)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-3 cursor-pointer p-1 -ml-1 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft size={16} />
          <span>Platform Yönetim Merkezine Dön</span>
        </button>
      </div>

      {/* 2. Site Başlık & Eylem Kartı */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
            <Building2 size={28} className="text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {group.name}
              </h1>
              {group.isActive && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={12} />
                  Aktif
                </span>
              )}
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                /{group.slug}
              </span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 uppercase">
                {group.plan || 'PRO'} PLAN
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium flex items-center gap-2">
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-slate-400" />
                {group.district || 'Kadıköy'}, {group.city || 'İstanbul'}
              </span>
              <span>·</span>
              <span className="font-mono text-slate-400">ID: {group.id}</span>
            </p>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center gap-3 self-start md:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => navigate(`/${tenantSlug}/admin/users/new?role=admin`)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>Kadro Ekle</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(siteUrl)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-teal-700 rounded-xl transition-all shadow-md cursor-pointer"
          >
            <span>Site Yönetici Paneline Git</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
