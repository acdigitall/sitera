import React, { useState } from 'react';
import { Group } from '@sitera/shared';
import { Building2, Plus, Users, CheckCircle2, ArrowUpRight, Search, Copy, Check } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';

interface GroupsViewProps {
  groups: Group[];
  selectedGroupId: string;
  onSelectGroup: (groupId: string) => void;
  onOpenCreateGroup: () => void;
  userCounts?: Record<string, number>;
}

export const GroupsView: React.FC<GroupsViewProps> = ({
  groups,
  selectedGroupId,
  onSelectGroup,
  onOpenCreateGroup,
  userCounts = {},
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Search & Actions Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={15}
            className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            placeholder="Organizasyon veya slug ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button onClick={onOpenCreateGroup} className="btn btn-primary text-xs py-2 px-4">
          <Plus size={15} /> Yeni Organizasyon (Tenant) Ekle
        </button>
      </div>

      {/* Grid of Tenant Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.map((group) => {
          const isSelected = group.id === selectedGroupId;
          const planColor =
            group.plan === 'enterprise'
              ? 'pink'
              : group.plan === 'pro'
              ? 'secondary'
              : 'primary';

          return (
            <div
              key={group.id}
              onClick={() => onSelectGroup(isSelected ? '' : group.id)}
              className={`rounded-xl p-5 cursor-pointer transition-all border shadow-sm ${
                isSelected
                  ? 'bg-indigo-50/50 border-indigo-600 ring-2 ring-indigo-600/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-slate-100 text-indigo-600'
                    }`}
                  >
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{group.name}</h3>
                    <span className="text-xs text-slate-500 font-mono">
                      slug: {group.slug}
                    </span>
                  </div>
                </div>

                <Badge variant={planColor as any} size="sm">
                  {group.plan.toUpperCase()}
                </Badge>
              </div>

              {/* ID Bar with Copy */}
              <div
                onClick={(e) => handleCopy(group.id, e)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 flex justify-between items-center mb-4 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <span className="text-slate-500">Tenant ID:</span>
                <span className="font-mono text-slate-900 font-medium flex items-center gap-1.5">
                  {group.id.slice(0, 8)}...{group.id.slice(-6)}
                  {copiedId === group.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                </span>
              </div>

              {/* Footer row */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <Users size={14} className="text-indigo-600" />
                  <span>{userCounts[group.id] ?? 0} Kayıtlı Kullanıcı</span>
                </div>

                <div
                  className={`flex items-center gap-1 font-semibold ${
                    isSelected ? 'text-emerald-700' : 'text-slate-500 hover:text-indigo-600'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span>Seçili Kapsam</span>
                    </>
                  ) : (
                    <>
                      <span>Filtrele</span>
                      <ArrowUpRight size={14} />
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
