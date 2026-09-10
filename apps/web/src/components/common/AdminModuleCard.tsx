import React from 'react';

export interface AdminModuleCardProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badgeText?: string;
  children: React.ReactNode;
}

export const AdminModuleCard: React.FC<AdminModuleCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  badgeText,
  children,
}) => (
  <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden animate-fade-in max-w-full">
    <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 text-sm truncate">{title}</h3>
          <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>
        </div>
      </div>
      {badgeText && (
        <span className="self-start sm:self-auto px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[11px]">
          {badgeText}
        </span>
      )}
    </div>
    <div className="p-4 sm:p-6">{children}</div>
  </div>
);
