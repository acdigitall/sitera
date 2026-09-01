import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'pink' | 'custom';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  className = '',
  size = 'md',
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'secondary':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'danger':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'pink':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded border leading-none tracking-wide ${sizeClasses} ${getVariantClasses()} ${className}`}
    >
      {children}
    </span>
  );
};
