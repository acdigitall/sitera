import React from 'react';
import { Search } from 'lucide-react';

export interface AnnouncementFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  totalCount: number;
  importantCount: number;
}

export const AnnouncementFilterBar: React.FC<AnnouncementFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  totalCount,
  importantCount,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200/80 shrink-0 text-xs overflow-x-auto max-w-full">
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap ${
            selectedCategory === 'all'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tümü ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => onSelectCategory('important')}
          className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap ${
            selectedCategory === 'important'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'text-rose-700 hover:text-rose-900'
          }`}
        >
          Önemli ({importantCount})
        </button>
        <button
          type="button"
          onClick={() => onSelectCategory('Bakım')}
          className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap ${
            selectedCategory === 'Bakım'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Bakım
        </button>
        <button
          type="button"
          onClick={() => onSelectCategory('Aidat')}
          className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap ${
            selectedCategory === 'Aidat'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Aidat
        </button>
        <button
          type="button"
          onClick={() => onSelectCategory('Toplantı')}
          className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap ${
            selectedCategory === 'Toplantı'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Toplantı
        </button>
        <button
          type="button"
          onClick={() => onSelectCategory('Genel')}
          className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap ${
            selectedCategory === 'Genel'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Genel
        </button>
      </div>

      <div className="relative w-full sm:w-72">
        <Search size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Duyurularda ara..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-white border border-slate-200/90 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-teal-600 transition-all font-medium"
        />
      </div>
    </div>
  );
};
