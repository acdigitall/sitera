import React from 'react';
import { Scale, CheckCircle2 } from 'lucide-react';
import { AdminModuleCard } from '../../../components/common/AdminModuleCard';

export const AdminLegalView: React.FC = () => {
  return (
    <div className="animate-fade-in">
      <AdminModuleCard
        title="İcra & Hukuki Takip"
        subtitle="3 aydan fazla geciken borçlar, noter ihtarnameleri ve avukat takip süreçleri"
        icon={Scale}
      >
        <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded border border-slate-200">
          <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-600" />
          <div className="font-bold text-slate-900 text-sm">İcrada Bulunan Dosya Yok</div>
          <p className="mt-0.5 text-slate-500">
            Tüm dairelerin ödeme performansı yasal takip sınırları içerisindedir.
          </p>
        </div>
      </AdminModuleCard>
    </div>
  );
};
