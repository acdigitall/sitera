import React from 'react';
import { Search, List, Network } from 'lucide-react';

export interface UserFilterBarProps {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  mainTab: 'units' | 'staff';
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: 'all' | 'debt' | 'paid';
  setStatusFilter: (f: 'all' | 'debt' | 'paid') => void;
  roleFilter: string;
  setRoleFilter: (r: string) => void;
  viewMode: 'table' | 'tree';
  setViewMode: (m: 'table' | 'tree') => void;
  totalUnits: number;
  debtUnits: number;
  paidUnits: number;
  staffUsersCount: number;
}

export const UserFilterBar: React.FC<UserFilterBarProps> = ({
  isAdmin,
  isSuperAdmin,
  mainTab,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  roleFilter,
  setRoleFilter,
  viewMode,
  setViewMode,
  totalUnits,
  debtUnits,
  paidUnits,
  staffUsersCount,
}) => {
  return (
    <div className="p-3 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2.5 bg-slate-50/40">
      {/* Left: Quick Status Filters + Search */}
      <div className="flex items-center gap-3 flex-1 min-w-[280px]">
        {isAdmin && mainTab === 'units' && (
          <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tümü ({totalUnits})
            </button>
            <button
              onClick={() => setStatusFilter('debt')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'debt'
                  ? 'bg-white text-rose-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Borçlu ({debtUnits})
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'paid'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ödeyenler ({paidUnits})
            </button>
          </div>
        )}

        {/* Staff Role Filter */}
        {isAdmin && mainTab === 'staff' && (
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">Tüm Görevler ({staffUsersCount})</option>
            <option value="accountant">💼 Mali Müşavir</option>
            <option value="auditor">⚖️ Denetçi</option>
            <option value="security">🛡️ Güvenlik Görevlisi</option>
            <option value="staff">🔧 Teknik Personel</option>
          </select>
        )}

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search
            size={14}
            className="text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all"
            placeholder={
              isSuperAdmin
                ? 'Yönetici veya e-posta ara...'
                : mainTab === 'staff'
                ? 'Personel adı, e-posta veya telefon...'
                : 'Daire no veya sakin ara...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Super Admin View Mode Switcher */}
      {isSuperAdmin && (
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">Tüm Roller</option>
            <option value="superadmin">Süper Admin</option>
            <option value="admin">Site Yöneticisi</option>
            <option value="accountant">Mali Müşavir / Muhasebeci</option>
            <option value="auditor">Denetçi</option>
            <option value="security">Güvenlik Görevlisi</option>
            <option value="staff">Teknik Personel</option>
            <option value="member">Kat Maliki / Sakin</option>
          </select>

          <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <List size={13} />
              <span>Liste</span>
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                viewMode === 'tree' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <Network size={13} />
              <span>Ağaç</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
