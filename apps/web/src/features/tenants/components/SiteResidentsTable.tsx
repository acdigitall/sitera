import React from 'react';
import { Users, Home } from 'lucide-react';
import { User as UserType } from '@sitera/shared';

export interface SiteResidentsTableProps {
  residents: UserType[];
  totalUnits: number;
}

export const SiteResidentsTable: React.FC<SiteResidentsTableProps> = ({
  residents,
  totalUnits,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
      <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-slate-600" />
          <h2 className="font-bold text-slate-900 text-sm">
            Kayıtlı Daireler &amp; Sakin Listesi ({residents.length})
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-medium font-mono">
          {totalUnits} Dairelik Kapasite
        </span>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
              <th className="py-3 px-5">Bağımsız Bölüm (Daire)</th>
              <th className="py-3 px-5">Sakin / Kat Maliki</th>
              <th className="py-3 px-5">Mülkiyet Durumu</th>
              <th className="py-3 px-5">İletişim Telefonu</th>
              <th className="py-3 px-5">E-Posta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {residents.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                  Bu siteye henüz kat maliki veya sakin hesabı eklenmemiş.
                </td>
              </tr>
            ) : (
              residents.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-5 font-bold font-mono text-slate-900">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-900 border border-teal-200">
                      <Home size={12} className="text-teal-600" />
                      <span>{r.units?.join(', ') || 'Daire Belirtilmemiş'}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 font-bold text-slate-900">{r.name}</td>
                  <td className="py-3.5 px-5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {r.residentType === 'tenant'
                        ? 'Kiracı Sakin'
                        : r.residentType === 'both'
                        ? 'Ev Sahibi (İkamet)'
                        : 'Kat Maliki'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 font-mono text-slate-600">
                    {r.phone || '-'}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-slate-500">
                    {r.email}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
