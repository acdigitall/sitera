import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType;
  badge?: {
    text: string;
    variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'teal';
  };
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'teal' | 'indigo';
  footer?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  variant = 'default',
  footer,
  className = '',
  onClick,
}) => {
  const getBadgeStyle = (bVariant: string = 'neutral') => {
    switch (bVariant) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'danger':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'info':
      case 'teal':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTopBorder = () => {
    switch (variant) {
      case 'teal':
        return 'border-t-3 border-t-teal-700';
      case 'indigo':
        return 'border-t-3 border-t-indigo-600';
      case 'danger':
        return 'border-t-3 border-t-rose-600';
      case 'success':
        return 'border-t-3 border-t-emerald-600';
      case 'warning':
        return 'border-t-3 border-t-amber-500';
      default:
        return '';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between transition-all ${getTopBorder()} ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      } ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                <Icon size={16} />
              </div>
            )}
            <span className="text-sm font-bold text-slate-900 truncate">{title}</span>
          </div>
          {badge && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded border ${getBadgeStyle(
                badge.variant
              )}`}
            >
              {badge.text}
            </span>
          )}
        </div>

        {subtitle && <div className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</div>}

        <div className="mt-3.5">
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
            {value}
          </div>
        </div>
      </div>

      {footer && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          {footer}
        </div>
      )}
    </div>
  );
};
