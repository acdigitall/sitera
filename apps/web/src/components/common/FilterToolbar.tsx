import React from 'react';
import { Search } from 'lucide-react';

export interface FilterToolbarProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  searchPlaceholder?: string;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Arama yapın...',
  leftContent,
  rightContent,
  className = '',
}) => {
  return (
    <div
      className={`p-3 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2.5 bg-slate-50/40 ${className}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-[260px]">
        {leftContent}

        {onSearchChange !== undefined && (
          <div className="relative flex-1 max-w-xs">
            <Search
              size={14}
              className="text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              type="text"
              className="w-full bg-white border border-slate-200 rounded pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all"
              placeholder={searchPlaceholder}
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}
      </div>

      {rightContent && <div className="flex items-center gap-2">{rightContent}</div>}
    </div>
  );
};
