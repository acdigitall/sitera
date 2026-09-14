import React, { useState, useMemo } from 'react';
import { User, Group, Debt, UpdateUserDto } from '@sitera/shared';
import {
  Building2,
  ShieldCheck,
  ChevronRight,
  Download,
  Layers,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../auth';
import { UserMetricStrip } from './UserMetricStrip';
import { UserFilterBar } from './UserFilterBar';
import { UserUnitsTable } from './UserUnitsTable';
import { UserStaffTable } from './UserStaffTable';
import { UserDetailModal } from './UserDetailModal';
import { UserPasswordResetModal } from './UserPasswordResetModal';
import { UserDischargeModal } from './UserDischargeModal';
import { UserDeleteConfirmModal } from './UserDeleteConfirmModal';

export interface UserListProps {
  users: User[];
  debts?: Debt[];
  loading: boolean;
  activeGroup?: Group | undefined;
  onOpenCreate: (isStaff?: boolean) => void;
  onOpenBulkGenerator?: () => void;
  onOpenExcelImport?: () => void;
  onAssignResident?: (user: User) => void;
  onUpdate?: (id: string, dto: UpdateUserDto) => Promise<any>;
  onDischarge?: (userId: string, unit: string) => Promise<any>;
  onDelete: (id: string) => void;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  debts = [],
  loading,
  activeGroup,
  onOpenCreate,
  onOpenBulkGenerator,
  onOpenExcelImport,
  onAssignResident,
  onUpdate,
  onDischarge,
  onDelete,
}) => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isAdmin = currentUser?.role === 'admin';
  const isRegularUser = !isSuperAdmin && !isAdmin;

  const [mainTab, setMainTab] = useState<'units' | 'staff'>('units');
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'debt' | 'paid'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);
  const [remindedIds, setRemindedIds] = useState<string[]>([]);

  // Modal states
  const [selectedUserForPasswordReset, setSelectedUserForPasswordReset] = useState<User | null>(null);
  const [selectedUserForDischarge, setSelectedUserForDischarge] = useState<User | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<User | null>(null);

  const handleSendReminder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRemindedIds((prev) => [...prev, id]);
  };

  const visibleUsers = useMemo(() => {
    return users.filter((u) => {
      if (isSuperAdmin) return true;
      return u.role === 'member';
    });
  }, [users, isSuperAdmin]);

  const staffUsers = useMemo(() => {
    return users.filter((u) => {
      if (isSuperAdmin) return u.role !== 'member';
      return u.role !== 'member' && u.role !== 'superadmin';
    });
  }, [users, isSuperAdmin]);

  const filteredStaffUsers = useMemo(() => {
    return staffUsers.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q));
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [staffUsers, searchQuery, roleFilter]);

  const getUserDebtInfo = (u: User) => {
    const userDebts =
      debts.filter((d) => {
        if (d.userId && d.userId === u.id) return true;
        if (u.units && u.units.length > 0 && u.units.includes(d.unit)) return true;
        if (d.unit === u.name) return true;
        return false;
      }) || [];
    const unpaid = userDebts.filter((d) => d.status !== 'paid');
    const totalDebt = unpaid.reduce(
      (sum, d) => sum + (Number(d.amount) - Number(d.paidAmount)),
      0
    );
    return {
      hasDebt: totalDebt > 0,
      totalDebt,
      unpaidCount: unpaid.length,
      unpaidPeriods: unpaid.map((d) => d.title).join(', '),
    };
  };

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

      const debtInfo = getUserDebtInfo(u);
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'debt'
          ? debtInfo.hasDebt
          : !debtInfo.hasDebt;

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [visibleUsers, searchQuery, statusFilter, roleFilter, debts]);

  // Metric computations
  const totalUnits = visibleUsers.length;
  const debtUnits = visibleUsers.filter((u) => getUserDebtInfo(u).hasDebt).length;
  const totalDebtAmount = visibleUsers.reduce((sum, u) => sum + getUserDebtInfo(u).totalDebt, 0);
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
      {/* 0. ANA KATEGORİ SEKMELERİ (Daireler vs. Site Personeli) */}
      {!isSuperAdmin && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => {
              setMainTab('units');
              setSearchQuery('');
              setRoleFilter('all');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mainTab === 'units'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 size={15} />
            <span>Daireler &amp; Sakinler</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                mainTab === 'units' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {totalUnits}
            </span>
          </button>

          <button
            onClick={() => {
              setMainTab('staff');
              setSearchQuery('');
              setRoleFilter('all');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mainTab === 'staff'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck size={15} className={mainTab === 'staff' ? 'text-teal-400' : 'text-teal-600'} />
            <span>Site Ekibi &amp; Yetkililer</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                mainTab === 'staff' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {staffUsers.length}
            </span>
          </button>
        </div>
      )}

      {/* 1. HEADER & ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {isSuperAdmin
                ? 'Yöneticiler & Kullanıcılar'
                : mainTab === 'staff'
                ? 'Site Ekibi & Yetkili Kadrosu'
                : 'Daireler ve Sakinler'}
            </h1>
            <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold text-xs">
              {isSuperAdmin
                ? `${totalUnits} Daire`
                : mainTab === 'staff'
                ? `${staffUsers.length} Personel`
                : `${totalUnits} Daire`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSuperAdmin
              ? 'Tüm organizasyon yöneticileri, yetki hiyerarşisi ve bağlı daireler'
              : mainTab === 'staff'
              ? `${activeGroup?.name || currentUser?.group?.name || 'Site Yönetimi'} mali müşavir, denetçi, güvenlik ve teknik personel kadrosu`
              : `${activeGroup?.name || currentUser?.group?.name || 'Site Yönetimi'} bünyesindeki daireler, sakinler ve aidat durumları`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!isRegularUser && !isSuperAdmin && mainTab === 'units' && onOpenExcelImport && (
            <button
              onClick={onOpenExcelImport}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-1.5 rounded transition-colors shadow-2xs cursor-pointer"
            >
              <Download size={13} />
              <span>Excel İçe Aktar</span>
            </button>
          )}

          {!isRegularUser && !isSuperAdmin && mainTab === 'units' && onOpenBulkGenerator && (
            <button
              onClick={onOpenBulkGenerator}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-1.5 rounded transition-colors shadow-2xs cursor-pointer"
            >
              <Layers size={13} className="text-indigo-600" />
              <span>Daire Üreteci</span>
            </button>
          )}

          {!isRegularUser && (
            <button
              onClick={() => onOpenCreate(mainTab === 'staff')}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>
                {isSuperAdmin
                  ? 'Yeni Yönetici Ekle'
                  : mainTab === 'staff'
                  ? 'Yeni Personel / Yetkili Ekle'
                  : 'Yeni Daire Ekle'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 2. RELEVANT METRIC SUMMARY STRIP */}
      <UserMetricStrip
        isAdmin={isAdmin}
        mainTab={mainTab}
        totalUnits={totalUnits}
        debtUnits={debtUnits}
        totalDebtAmount={totalDebtAmount}
        paidUnits={paidUnits}
        staffUsers={staffUsers}
      />

      {/* 3. TOOLBAR & CONTENT */}
      <div className="bg-white border border-slate-200/90 rounded-lg shadow-2xs overflow-hidden">
        <UserFilterBar
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
          mainTab={mainTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          viewMode={viewMode}
          setViewMode={setViewMode}
          totalUnits={totalUnits}
          debtUnits={debtUnits}
          paidUnits={paidUnits}
          staffUsersCount={staffUsers.length}
        />

        {/* Content Views */}
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
        ) : !isSuperAdmin && mainTab === 'staff' ? (
          <UserStaffTable
            loading={loading}
            staffUsers={filteredStaffUsers}
            searchQuery={searchQuery}
            roleFilter={roleFilter}
            currentUserId={currentUser?.id}
            onOpenCreate={onOpenCreate}
            onOpenPasswordReset={(staff) => setSelectedUserForPasswordReset(staff)}
            onRequestDelete={(staff) => setSelectedUserForDelete(staff)}
            onDelete={onDelete}
          />
        ) : (
          <UserUnitsTable
            loading={loading}
            filteredUsers={filteredUsers}
            searchQuery={searchQuery}
            isSuperAdmin={isSuperAdmin}
            isAdmin={isAdmin}
            currentUserId={currentUser?.id}
            debts={debts}
            remindedIds={remindedIds}
            onSelectUserDetail={(u) => setSelectedUserDetail(u)}
            onSendReminder={handleSendReminder}
            onAssignResident={onAssignResident}
            onOpenPasswordReset={(u) => setSelectedUserForPasswordReset(u)}
            onOpenDischarge={(u) => setSelectedUserForDischarge(u)}
            onRequestDelete={(u) => setSelectedUserForDelete(u)}
            onDelete={onDelete}
          />
        )}
      </div>

      {/* 4. Inspection Modal */}
      <UserDetailModal
        user={selectedUserDetail}
        onClose={() => setSelectedUserDetail(null)}
      />

      {/* 5. Sakin Giriş Şifresi Belirleme & Sıfırlama Modalı */}
      <UserPasswordResetModal
        user={selectedUserForPasswordReset}
        activeGroupName={activeGroup?.name}
        onClose={() => setSelectedUserForPasswordReset(null)}
        onUpdate={onUpdate}
      />

      {/* 6. Sakin İlişik Kesme / Tahliye Modalı */}
      <UserDischargeModal
        user={selectedUserForDischarge}
        debts={debts}
        onClose={() => setSelectedUserForDischarge(null)}
        onDischarge={onDischarge}
      />

      {/* 7. Daire / Kullanıcı Silme Onay Modalı */}
      <UserDeleteConfirmModal
        user={selectedUserForDelete}
        debts={debts}
        onClose={() => setSelectedUserForDelete(null)}
        onConfirm={async (userId) => {
          await onDelete(userId);
          setSelectedUserForDelete(null);
        }}
      />
    </div>
  );
};
