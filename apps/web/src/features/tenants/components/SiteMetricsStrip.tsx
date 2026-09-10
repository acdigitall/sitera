import React from 'react';
import { Building2, Layers, ShieldCheck } from 'lucide-react';
import { StatCard } from '../../../components/common/StatCard';

export interface SiteMetricsStripProps {
  totalSitesCount: number;
  totalUnitsAll: number;
  activePaidSitesCount: number;
  trialSitesCount: number;
}

export const SiteMetricsStrip: React.FC<SiteMetricsStripProps> = ({
  totalSitesCount,
  totalUnitsAll,
  activePaidSitesCount,
  trialSitesCount,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Kayıtlı Siteler"
        value={totalSitesCount}
        icon={Building2}
        footer={
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Tüm binalar devrede</span>
          </div>
        }
      />

      <StatCard
        title="Bağımsız Bölüm"
        value={totalUnitsAll}
        icon={Layers}
        footer={
          <div className="text-xs text-slate-500">
            Ortalama {Math.round(totalUnitsAll / Math.max(1, totalSitesCount))} daire / site
          </div>
        }
      />

      <StatCard
        title="Aktif Lisanslı"
        value={activePaidSitesCount}
        icon={ShieldCheck}
        variant="teal"
        badge={{ text: 'Düzenli', variant: 'teal' }}
        footer={<div className="text-xs text-slate-500">Düzenli tahsilat</div>}
      />

      <StatCard
        title="Lansman Kapsamında"
        value={trialSitesCount}
        variant="warning"
        badge={{ text: 'Deneme', variant: 'warning' }}
        footer={<div className="text-xs text-slate-500">Ücretsiz deneme süreci</div>}
      />
    </div>
  );
};
