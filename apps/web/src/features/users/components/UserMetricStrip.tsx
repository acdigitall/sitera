import React from 'react';
import { Home, AlertCircle, CheckCircle2, ShieldCheck, Briefcase, Wrench } from 'lucide-react';
import { User } from '@sitera/shared';

export interface UserMetricStripProps {
  isAdmin: boolean;
  mainTab: 'units' | 'staff';
  totalUnits: number;
  debtUnits: number;
  totalDebtAmount: number;
  paidUnits: number;
  staffUsers: User[];
}

export const UserMetricStrip: React.FC<UserMetricStripProps> = ({
  isAdmin,
  mainTab,
  totalUnits,
  debtUnits,
  totalDebtAmount,
  paidUnits,
  staffUsers,
}) => {
  if (!isAdmin) return null;

  if (mainTab === 'units') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Toplam Daire */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Home size={18} />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Toplam Daire</span>
              <div className="text-lg font-bold font-mono text-slate-900">{totalUnits} Daire</div>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
            %100 Dolu
          </span>
        </div>

        {/* Borçlu Daireler */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertCircle size={18} />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Geciken Daireler</span>
              <div className="text-lg font-bold font-mono text-rose-600">{debtUnits} Daire</div>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
            {totalDebtAmount.toLocaleString('tr-TR')} ₺ Kalan
          </span>
        </div>

        {/* Borçsuz / Düzenli Daireler */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Ödemesi Tamam</span>
              <div className="text-lg font-bold font-mono text-emerald-600">{paidUnits} Daire</div>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            {paidUnits === totalUnits ? 'Tüm Daireler Güncel' : `${paidUnits} Daire Borçsuz`}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      {/* Toplam Yetkili Kadro */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <ShieldCheck size={18} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Toplam Yetkili Kadro</span>
            <div className="text-lg font-bold font-mono text-slate-900">{staffUsers.length} Personel</div>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
          Aktif Görevde
        </span>
      </div>

      {/* Mali Müşavir & Denetim */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <Briefcase size={18} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Mali Müşavir & Denetim</span>
            <div className="text-lg font-bold font-mono text-indigo-700">
              {staffUsers.filter((u) => u.role === 'accountant' || u.role === 'auditor').length} Yetkili
            </div>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
          Mizan & Bilanço
        </span>
      </div>

      {/* Güvenlik & Teknik Ekip */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Wrench size={18} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Güvenlik & Hizmet Ekibi</span>
            <div className="text-lg font-bold font-mono text-amber-700">
              {staffUsers.filter((u) => u.role === 'security' || u.role === 'staff').length} Personel
            </div>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
          Saha ve Operasyon
        </span>
      </div>
    </div>
  );
};
