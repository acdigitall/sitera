import React from 'react';
import { Clock } from 'lucide-react';
import { AdminModuleCard } from '../../../components/common/AdminModuleCard';

export const AdminRemindersView: React.FC = () => {
  return (
    <div className="animate-fade-in">
      <AdminModuleCard
        title="Otomatik Hatırlatmalar & SMS"
        subtitle="Son ödeme tarihi yaklaşan dairelere otomatik SMS ve E-Posta bildirim şablonları"
        icon={Clock}
      >
        <div className="space-y-3">
          <div className="p-3.5 rounded bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-slate-900">Vade Öncesi 3 Gün SMS Hatırlatması</div>
              <div className="text-[11px] text-slate-400">Her ayın 12&apos;sinde otomatik gönderilir</div>
            </div>
            <span className="text-xs font-bold text-emerald-600 self-start sm:self-auto">Aktif</span>
          </div>
        </div>
      </AdminModuleCard>
    </div>
  );
};
