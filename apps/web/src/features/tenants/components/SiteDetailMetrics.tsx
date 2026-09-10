import React from 'react';
import { Layers, Users, Briefcase, Wrench } from 'lucide-react';
import { User as UserType } from '@sitera/shared';

export interface SiteDetailMetricsProps {
  totalUnits: number;
  residents: UserType[];
  managers: UserType[];
  technicians: UserType[];
}

export const SiteDetailMetrics: React.FC<SiteDetailMetricsProps> = ({
  totalUnits,
  residents,
  managers,
  technicians,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
          <span>Bağımsız Bölüm</span>
          <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
            <Layers size={16} />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
            {totalUnits} <span className="text-xs font-normal text-slate-400 font-sans">Daire</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Bina toplam kapasitesi</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
          <span>Kayıtlı Sakinler</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700">
            <Users size={16} />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold font-mono text-indigo-950 tabular-nums">
            {residents.length} <span className="text-xs font-normal text-slate-400 font-sans">Kat Maliki / Sakin</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Sistemde hesabı olan sakinler</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
          <span>Yönetim Kurulu</span>
          <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700">
            <Briefcase size={16} />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold font-mono text-purple-950 tabular-nums">
            {managers.length} <span className="text-xs font-normal text-slate-400 font-sans">Yönetici</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Site yöneticisi & muhasebe</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
          <span>Tekniker & Hizmet</span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800">
            <Wrench size={16} />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold font-mono text-amber-900 tabular-nums">
            {technicians.length} <span className="text-xs font-normal text-slate-400 font-sans">Personel</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Asansör, elektrik & bakım</div>
        </div>
      </div>
    </div>
  );
};
