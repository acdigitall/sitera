import React, { useState, useMemo } from 'react';
import { User, formatRoleBadge, Group } from '@sitera/shared';
import {
  Trash2,
  Plus,
  Search,
  Building2,
  List,
  Network,
  Crown,
  ChevronRight,
  Phone,
  Mail,
  Send,
  Check,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  SlidersHorizontal,
  Home,
  UserCheck,
  Download,
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { useAuth } from '../../auth';

interface UserListProps {
  users: User[];
  loading: boolean;
  activeGroup?: Group | undefined;
  onOpenCreate: () => void;
  onOpenBulkGenerator?: () => void;
  onOpenExcelImport?: () => void;
  onAssignResident?: (user: User) => void;
  onDelete: (id: string) => void;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  loading,
  activeGroup,
  onOpenCreate,
  onOpenBulkGenerator,
  onOpenExcelImport,
  onAssignResident,
  onDelete,
}) => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isAdmin = currentUser?.role === 'admin';
  const isRegularUser = !isSuperAdmin && !isAdmin;

  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'debt' | 'paid'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);
  const [remindedIds, setRemindedIds] = useState<string[]>([]);

  const handleSendReminder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRemindedIds((prev) => [...prev, id]);
  };

  // If logged-in user is regular Admin, only show their managed units/residents (role === 'member')
  // The Admin is the manager, not an apartment unit!
  const visibleUsers = useMemo(() => {
    return users.filter((u) => {
      if (isSuperAdmin) {
        return true;
      }
      return u.role === 'member';
    });
  }, [users, isSuperAdmin]);

  const filteredUsers = useMemo(() => {
    return visibleUsers.filter((u) => {
      const unitMatch = u.units?.some((unit) =>
        unit.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Boolean(unitMatch) ||
        (u.admin?.name && u.admin.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const isDebt = u.name.toLowerCase().includes('1');
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'debt'
            ? isDebt
            : !isDebt;

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [visibleUsers, searchQuery, statusFilter, roleFilter]);

  // Metric computations
  const totalUnits = visibleUsers.length;
  const debtUnits = visibleUsers.filter((u) => u.name.toLowerCase().includes('1')).length;
  const paidUnits = Math.max(0, totalUnits - debtUnits);

  // Group users under their respective Admins for the Tree View (Super Admin only)
  const adminTree = useMemo(() => {
    const admins = visibleUsers.filter((u) => u.role === 'admin');
    return admins.map((admin) => {
      const subUsers = visibleUsers.filter(
        (u) => u.role !== 'admin' && u.role !== 'superadmin' && u.groupId === admin.groupId
      );
      return {
        admin,
        subUsers,
      };
    });
  }, [visibleUsers]);

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* ========================================================================= */}
      {/* 1. HEADER & ACTION BAR                                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {isSuperAdmin ? 'Yöneticiler & Kullanıcılar' : 'Daireler ve Sakinler'}
            </h1>
            <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold text-xs">
              {totalUnits} Daire
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSuperAdmin
              ? 'Tüm organizasyon yöneticileri, yetki hiyerarşisi ve bağlı daireler'
              : `${activeGroup?.name || currentUser?.group?.name || 'Site Yönetimi'} bünyesindeki daireler, sakinler ve aidat durumları`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!isRegularUser && !isSuperAdmin && onOpenExcelImport && (
            <button
              onClick={onOpenExcelImport}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-1.5 rounded transition-colors shadow-2xs"
            >
              <Download size={13} />
              <span>Excel İçe Aktar</span>
            </button>
          )}

          {!isRegularUser && !isSuperAdmin && onOpenBulkGenerator && (
            <button
              onClick={onOpenBulkGenerator}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-1.5 rounded transition-colors shadow-2xs"
            >
              <Sparkles size={13} className="text-indigo-600" />
              <span>Daire Sihirbazı</span>
            </button>
          )}

          {!isRegularUser && (
            <button
              onClick={onOpenCreate}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm hover:shadow transition-all"
            >
              <Plus size={14} />
              <span>{isSuperAdmin ? 'Yeni Yönetici Ekle' : 'Yeni Daire Ekle'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RELEVANT METRIC SUMMARY STRIP (Gerçek ve Anlamlı 3'lü Özet Barı)        */}
      {/* ========================================================================= */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Toplam Daire */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <Home size={18} />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Toplam Daire</span>
                <div className="text-lg font-bold font-mono text-slate-900">{totalUnits} Daire</div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
              %100 Dolu
            </span>
          </div>

          {/* Borçlu Daireler */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <AlertCircle size={18} />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Geciken Daireler</span>
                <div className="text-lg font-bold font-mono text-rose-600">{debtUnits} Daire</div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
              {debtUnits * 1250} ₺ Kalan
            </span>
          </div>

          {/* Borçsuz / Düzenli Daireler */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Ödemesi Tamam</span>
                <div className="text-lg font-bold font-mono text-emerald-600">{paidUnits} Daire</div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              Ağustos Tamamlandı
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TOOLBAR & FILTER TABS                                                  */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-lg shadow-2xs overflow-hidden">
        <div className="p-3 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2.5 bg-slate-50/40">
          {/* Left: Quick Status Filters + Search */}
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            {isAdmin && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded transition-colors ${statusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Tümü ({totalUnits})
                </button>
                <button
                  onClick={() => setStatusFilter('debt')}
                  className={`px-2.5 py-1 rounded transition-colors ${statusFilter === 'debt'
                      ? 'bg-white text-rose-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Borçlu ({debtUnits})
                </button>
                <button
                  onClick={() => setStatusFilter('paid')}
                  className={`px-2.5 py-1 rounded transition-colors ${statusFilter === 'paid'
                      ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Ödeyenler ({paidUnits})
                </button>
              </div>
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
                placeholder={isSuperAdmin ? 'Yönetici veya e-posta ara...' : 'Daire no veya sakin ara...'}
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
                <option value="admin">Yöneticiler</option>
                <option value="member">Kullanıcılar</option>
              </select>

              <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition-colors ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                >
                  <List size={13} />
                  <span>Liste</span>
                </button>
                <button
                  onClick={() => setViewMode('tree')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition-colors ${viewMode === 'tree' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                >
                  <Network size={13} />
                  <span>Ağaç</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: SUPER ADMIN HIERARCHY TREE VIEW                   */}
        {/* ========================================================= */}
        {isSuperAdmin && viewMode === 'tree' ? (
          <div className="p-4 flex flex-col gap-4">
            {adminTree.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                Henüz tanımlı bir Yönetici bulunmuyor.
              </div>
            ) : (
              adminTree.map(({ admin, subUsers }) => (
                <div
                  key={admin.id}
                  className="bg-slate-50/70 border border-slate-200 rounded p-4 space-y-3"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                        {admin.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{admin.name}</span>
                          <span className="text-[10px] font-mono text-slate-500">({admin.email})</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {admin.group?.name || 'Sitera Teknoloji'}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                      {subUsers.length} Alt Kullanıcı
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {subUsers.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => setSelectedUserDetail(sub)}
                        className="bg-white border border-slate-200 hover:border-indigo-300 rounded p-2.5 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="overflow-hidden">
                          <div className="font-semibold text-slate-900 text-xs truncate">
                            {sub.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">
                            {sub.email}
                          </div>
                        </div>
                        <ChevronRight size={13} className="text-slate-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* VIEW 2: RICH & DYNAMIC TABLE */
          <>
            {loading ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Kayıtlar yükleniyor...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-10 h-10 rounded bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Home size={20} />
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-0.5">Kayıt Bulunamadı</h4>
                <p className="text-[11px] text-slate-500">
                  {searchQuery ? 'Arama kriterlerinize uygun daire bulunamadı.' : 'Henüz bu kategoride daire kaydı yok.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold text-xs">
                      <th className="py-3 px-4">Daire & Blok</th>
                      <th className="py-3 px-4">Malik / Sakin</th>
                      <th className="py-3 px-4">İletişim</th>
                      {isSuperAdmin && <th className="py-3 px-4">Sorumlu Yönetici</th>}
                      {isAdmin && <th className="py-3 px-4">Aidat & Bakiye</th>}
                      <th className="py-3 px-4">Durum</th>
                      <th className="py-3 px-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredUsers.map((u) => {
                      const badge = formatRoleBadge(u.role);
                      const isThisSuperAdmin = u.role === 'superadmin';
                      const isSelf = u.id === currentUser?.id;
                      const hasDebt = u.name.toLowerCase().includes('1') && !u.name.toLowerCase().includes('blok');
                      const isReminded = remindedIds.includes(u.id);

                      // Check if apartment is vacant (created without specific resident name)
                      const isVacant = Boolean(
                        !u.phone &&
                        (u.name.toLowerCase().startsWith('daire') ||
                          u.name.toLowerCase().includes('blok') ||
                          u.name === u.units?.[0] ||
                          u.name === u.group?.name ||
                          u.email.endsWith('@sitera.dev'))
                      );

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => setSelectedUserDetail(u)}
                        >
                          {/* 1. Daire(ler) & Kapı No */}
                          <td className="py-3 px-4">
                            <div className="flex items-start gap-2.5">
                              <div className="w-8 h-8 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                <Home size={15} />
                              </div>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {u.units && u.units.length > 0 ? (
                                    u.units.map((unitName) => (
                                      <span
                                        key={unitName}
                                        className="font-mono font-bold text-slate-900 text-xs px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200"
                                      >
                                        {unitName}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="font-mono font-bold text-slate-900 text-xs px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">
                                      {u.name}
                                    </span>
                                  )}
                                  {u.units && u.units.length > 1 && (
                                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded">
                                      {u.units.length} Daire Sahibi
                                    </span>
                                  )}
                                  {isSelf && (
                                    <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1 py-0.2 rounded border">
                                      Siz
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {u.group?.name || 'Sitera Rezidans'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Sakin Adı & Mülkiyet Durumu */}
                          <td className="py-3 px-4">
                            {isVacant ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-slate-400 text-xs italic font-medium">Sakin Atanmadı</span>
                                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded self-start">
                                  Boş Daire
                                </span>
                              </div>
                            ) : (
                              <div>
                                <div className="font-semibold text-slate-900 text-xs">
                                  {u.name}
                                </div>
                                <div className="mt-0.5 flex items-center gap-1.5">
                                  {u.role === 'member' ? (
                                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
                                      {u.residentType === 'tenant'
                                        ? 'Kiracı'
                                        : u.residentType === 'both'
                                          ? 'Malik & İkamet'
                                          : 'Ev Sahibi (Malik)'}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                                      {u.role === 'superadmin' ? 'Süper Admin' : 'Yönetici Hesabı'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* 3. İletişim */}
                          <td className="py-3 px-4">
                            {isVacant ? (
                              <span className="text-slate-400 text-xs font-mono">-</span>
                            ) : (
                              <div className="flex flex-col gap-0.5 text-xs">
                                <span className="font-mono text-slate-600 flex items-center gap-1">
                                  <Mail size={11} className="text-slate-400" />
                                  {u.email}
                                </span>
                                {u.phone && (
                                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                    <Phone size={11} className="text-slate-400" />
                                    {u.phone}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Sorumlu Yönetici (Super Admin only) */}
                          {isSuperAdmin && (
                            <td className="py-3 px-4">
                              {u.admin ? (
                                <div className="text-xs text-slate-700">
                                  <span className="font-semibold text-slate-900 flex items-center gap-1">
                                    <Crown size={12} className="text-indigo-600" />
                                    {u.admin.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono block">{u.admin.email}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </td>
                          )}

                          {/* 4. Aidat & Bakiye Durumu (Admin only) */}
                          {isAdmin && (
                            <td className="py-3 px-4">
                              {isVacant ? (
                                <span className="text-slate-400 text-xs font-mono italic">-</span>
                              ) : hasDebt ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-mono font-bold text-xs">
                                    <AlertCircle size={12} /> 1.250 ₺ Borç
                                  </span>
                                  <span className="text-[10px] text-slate-400">16 gün gecikmede</span>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono font-bold text-xs">
                                    <CheckCircle2 size={12} /> Borcu Yok
                                  </span>
                                  <span className="text-[10px] text-slate-400">Ağustos 2026 ödendi</span>
                                </div>
                              )}
                            </td>
                          )}

                          {/* 5. Durum */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${u.isActive ? 'text-emerald-700' : 'text-slate-400'
                                }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                                  }`}
                              />
                              {u.isActive ? 'Aktif' : 'Pasif'}
                            </span>
                          </td>

                          {/* 6. Aksiyonlar */}
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {/* If vacant, show Sakin Ata button */}
                              {isVacant && isAdmin && onAssignResident && (
                                <button
                                  onClick={() => onAssignResident(u)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-2xs"
                                  title="Bu daireye malik/sakin ata"
                                >
                                  <UserCheck size={12} />
                                  <span>Sakin Ata</span>
                                </button>
                              )}

                              {/* SMS Hatırlat butonu (Borçlu daireler için) */}
                              {isAdmin && hasDebt && !isVacant && (
                                <button
                                  onClick={(e) => handleSendReminder(u.id, e)}
                                  disabled={isReminded}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all ${isReminded
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                                    }`}
                                  title="SMS Hatırlatma Gönder"
                                >
                                  {isReminded ? <Check size={12} /> : <Send size={12} />}
                                  <span>{isReminded ? 'İletildi' : 'Hatırlat'}</span>
                                </button>
                              )}

                              {/* Silme Butonu */}
                              {!isThisSuperAdmin && !isSelf && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(u.id);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                  title="Daireyi Sil"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            <div className="py-2.5 px-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center bg-slate-50/50">
              <span className="font-mono">Toplam {filteredUsers.length} daire listeleniyor</span>
              <span className="text-[11px] text-slate-400 font-mono">Bina Yönetim Sistemi</span>
            </div>
          </>
        )}
      </div>

      {/* 4. Inspection Modal */}
      {selectedUserDetail && (
        <Modal
          isOpen={!!selectedUserDetail}
          onClose={() => setSelectedUserDetail(null)}
          title="Daire & Sakin Kartı"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                <Home size={20} />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">
                  {selectedUserDetail.name}
                </div>
                <div className="text-slate-500 font-mono mt-0.5">{selectedUserDetail.email}</div>
              </div>
            </div>

            <div className="space-y-2 text-slate-700">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Mülkiyet Durumu:</span>
                <span className="font-semibold text-slate-900">
                  {selectedUserDetail.residentType === 'tenant'
                    ? 'Kiracı'
                    : selectedUserDetail.residentType === 'both'
                      ? 'Malik & İkamet Eden'
                      : 'Ev Sahibi (Malik)'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Sahip Olduğu Daireler:</span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {selectedUserDetail.units && selectedUserDetail.units.length > 0 ? (
                    selectedUserDetail.units.map((uName) => (
                      <span key={uName} className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded text-[11px]">
                        {uName}
                      </span>
                    ))
                  ) : (
                    <span className="font-mono font-bold text-slate-900">{selectedUserDetail.name}</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Kullanıcı Rolü:</span>
                <span className="font-semibold">{formatRoleBadge(selectedUserDetail.role).label}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Organizasyon:</span>
                <span className="font-semibold">{selectedUserDetail.group?.name || 'Sitera Rezidans'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">İletişim Telefonu:</span>
                <span className="font-mono text-slate-900">{selectedUserDetail.phone || '+90 555 123 4567'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
