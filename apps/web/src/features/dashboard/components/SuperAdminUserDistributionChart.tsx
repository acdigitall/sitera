import React, { useState, useMemo } from 'react';
import { ShieldCheck, Wrench, Home, UserCheck } from 'lucide-react';
import { Group, User } from '@sitera/shared';

interface SuperAdminUserDistributionChartProps {
  groups: Group[];
}

interface RoleSegment {
  id: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
  hoverColor: string;
  icon: React.ElementType;
}

export const SuperAdminUserDistributionChart: React.FC<SuperAdminUserDistributionChartProps> = ({
  groups,
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  // Veritabanındaki tüm kullanıcıları topla ve rollere göre sınıflandır
  const { segments, totalCount } = useMemo(() => {
    const userMap = new Map<string, User>();
    groups.forEach((g) => {
      const uList: User[] = (g as any).users || [];
      uList.forEach((u) => {
        if (!userMap.has(u.id)) {
          userMap.set(u.id, u);
        }
      });
    });

    const allUsers = Array.from(userMap.values());
    const total = allUsers.length || 1;

    const membersCount = allUsers.filter((u) => u.role === 'member').length;
    const managersCount = allUsers.filter(
      (u) => u.role === 'admin' || u.role === 'accountant' || u.role === 'auditor'
    ).length;
    const staffCount = allUsers.filter(
      (u) => u.role === 'staff' || u.role === 'security'
    ).length;
    const superAdminCount = allUsers.filter((u) => u.role === 'superadmin').length;

    const rawSegments: RoleSegment[] = [
      {
        id: 'members',
        label: 'Sakinler',
        count: membersCount,
        percentage: Math.round((membersCount / total) * 100),
        color: '#0284c7', // Sky-600
        hoverColor: '#0369a1',
        icon: Home,
      },
      {
        id: 'managers',
        label: 'Yöneticiler',
        count: managersCount,
        percentage: Math.round((managersCount / total) * 100),
        color: '#4f46e5', // Indigo-600
        hoverColor: '#4338ca',
        icon: UserCheck,
      },
      {
        id: 'staff',
        label: 'Teknik Personel',
        count: staffCount,
        percentage: Math.round((staffCount / total) * 100),
        color: '#f59e0b', // Amber-500
        hoverColor: '#d97706',
        icon: Wrench,
      },
      {
        id: 'superadmin',
        label: 'Süper Admin',
        count: superAdminCount,
        percentage: Math.max(1, Math.round((superAdminCount / total) * 100)),
        color: '#0f172a', // Slate-900
        hoverColor: '#334155',
        icon: ShieldCheck,
      },
    ].filter((s) => s.count > 0);

    return { segments: rawSegments, totalCount: allUsers.length };
  }, [groups]);

  // Donut SVG Ölçüleri (Sabit piksel, hover'da sıfır layout shift)
  const size = 140;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  const activeSegmentData = hoveredSegment
    ? segments.find((s) => s.id === hoveredSegment)
    : null;

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between select-none h-full min-h-[380px]">
      {/* 1. Başlık */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Kullanıcı Dağılımı</h3>
          <p className="text-xs text-slate-500 mt-0.5">Sistemdeki rollerin toplam oranı</p>
        </div>
        <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          {totalCount} Kullanıcı
        </span>
      </div>

      {/* 2. Donut Grafiği ve Lejant */}
      <div className="flex flex-row items-center justify-between gap-5 py-4 my-auto">
        {/* Donut Halkası */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg] block">
            {/* Arka plan halkası */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />

            {/* Pasta Dilimleri */}
            {segments.map((seg) => {
              const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += seg.percentage;

              const isHovered = hoveredSegment === seg.id;

              return (
                <circle
                  key={seg.id}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={isHovered ? seg.hoverColor : seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                  opacity={isHovered ? 1 : 0.9}
                  className="cursor-pointer transition-opacity"
                  onMouseEnter={() => setHoveredSegment(seg.id)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              );
            })}
          </svg>

          {/* Donut Merkez Metni */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none h-12 my-auto">
            {activeSegmentData ? (
              <>
                <span className="text-xl font-bold font-mono text-slate-900 leading-none">
                  %{activeSegmentData.percentage}
                </span>
                <span className="text-[11px] font-medium text-slate-600 mt-1 truncate max-w-[85px] text-center">
                  {activeSegmentData.label}
                </span>
              </>
            ) : (
              <>
                <span className="text-xl font-bold font-mono text-slate-900 leading-none">
                  {totalCount}
                </span>
                <span className="text-[11px] font-medium text-slate-400 mt-1">
                  Kişi
                </span>
              </>
            )}
          </div>
        </div>

        {/* Sağ Lejant Tablosu */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {segments.map((seg) => {
            const isHovered = hoveredSegment === seg.id;

            return (
              <div
                key={seg.id}
                onMouseEnter={() => setHoveredSegment(seg.id)}
                onMouseLeave={() => setHoveredSegment(null)}
                className={`flex items-center justify-between text-xs py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
                  isHovered ? 'bg-slate-100' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="font-medium text-slate-700 truncate">{seg.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-slate-900 font-mono">{seg.count}</span>
                  <span className="text-slate-400 font-mono text-[11px] w-8 text-right">
                    %{seg.percentage}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Alt Bilgi */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>Aktif Hesaplar</span>
        <span className="font-mono text-slate-600">{totalCount} kayıtlı kullanıcı</span>
      </div>
    </div>
  );
};
