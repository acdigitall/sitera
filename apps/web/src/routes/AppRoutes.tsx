import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, LoginView } from '../features/auth';
import { useTenants, CreateGroupModal } from '../features/tenants';
import {
  useUsers,
  UserList,
  CreateUserDrawer,
  BulkGeneratorDrawer,
  ExcelImportDrawer,
  AssignResidentDrawer,
} from '../features/users';
import { User } from '@sitera/shared';
import { useHealth, ArchitectureView } from '../features/architecture';
import {
  PortalHomeView,
  PortalAnnouncementsView,
  PortalPaymentsView,
  PortalProfileView,
} from '../features/portal';
import { AdminDashboardView, SuperAdminDashboardView } from '../features/dashboard';
import { DashboardLayout } from '../components/layout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import {
  Calendar,
  Receipt,
  CheckCircle2,
  BarChart3,
  Scale,
  Clock,
  Megaphone,
  ShieldCheck,
  Building2,
  Sparkles,
  Search,
  Filter,
  Download,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

// Root Index Redirector based on user role and tenant slug
const RootRedirect: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const tenantSlug =
    user.group?.slug ||
    (user.group?.name
      ? user.group.name
          .toLowerCase()
          .replace(/ğ/g, 'g')
          .replace(/ü/g, 'u')
          .replace(/ş/g, 's')
          .replace(/ı/g, 'i')
          .replace(/ö/g, 'o')
          .replace(/ç/g, 'c')
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
      : 'site');

  if (user.role === 'member') {
    return <Navigate to={`/${tenantSlug}/portal/home`} replace />;
  }

  return <Navigate to={`/${tenantSlug}/admin/overview`} replace />;
};

// Login Route Guard: If already logged in, redirect to home
const PublicLoginRoute: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    return <RootRedirect />;
  }

  return <LoginView />;
};

// Generic Admin Feature Shell with rich mockup data
interface AdminModuleCardProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badgeText?: string;
  children: React.ReactNode;
}

const AdminModuleCard: React.FC<AdminModuleCardProps> = ({
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

// Main Authenticated Dashboard Shell
const DashboardShell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'superadmin';

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isBulkGeneratorOpen, setIsBulkGeneratorOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState<User | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // Custom Feature Hooks
  const {
    groups,
    selectedGroupId,
    activeGroup,
    createGroup,
    refetch: refetchGroups,
  } = useTenants();

  const {
    users,
    loading: loadingUsers,
    createUser,
    createBulkUsers,
    updateUser,
    deleteUser,
    refetch: refetchUsers,
  } = useUsers(selectedGroupId);

  const {
    health,
    loading: loadingHealth,
    refetch: refetchHealth,
  } = useHealth();

  const handleRefreshAll = () => {
    refetchHealth();
    refetchGroups();
    refetchUsers();
  };

  const visibleUsersCount = users.filter((u) =>
    isSuperAdmin ? u.role !== 'superadmin' : u.role === 'member'
  ).length;

  return (
    <>
      <DashboardLayout
        onOpenCreateUser={() => setIsUserModalOpen(true)}
        userCount={visibleUsersCount}
        loading={loadingHealth || loadingUsers}
        onRefresh={handleRefreshAll}
      >
        <Routes>
          {/* Default Root */}
          <Route index element={<RootRedirect />} />

          {/* ========================================================= */}
          {/* SAKİN / KULLANICI PORTAL ROTASI                           */}
          {/* ========================================================= */}
          <Route element={<RoleRoute allowedRoles={['member']} />}>
            <Route path="portal" element={<Navigate to="/portal/home" replace />} />
            <Route
              path="portal/home"
              element={
                <PortalHomeView
                  onNavigate={(tab) => {
                    const pathTo =
                      tab === 'portal_payments'
                        ? '/portal/payments'
                        : tab === 'portal_announcements'
                        ? '/portal/announcements'
                        : tab === 'portal_profile'
                        ? '/portal/profile'
                        : '/portal/home';
                    navigate(pathTo);
                  }}
                />
              }
            />
            <Route path="portal/announcements" element={<PortalAnnouncementsView />} />
            <Route path="portal/payments" element={<PortalPaymentsView />} />
            <Route path="portal/profile" element={<PortalProfileView />} />
          </Route>

          {/* ========================================================= */}
          {/* YÖNETİCİ & SÜPER ADMİN YÖNETİM ROTASI                     */}
          {/* ========================================================= */}
          <Route element={<RoleRoute allowedRoles={['superadmin', 'admin']} />}>
            <Route path="admin" element={<Navigate to="/admin/overview" replace />} />

            {/* 1. Dashboard */}
            <Route
              path="admin/overview"
              element={
                <div className="animate-fade-in">
                  {isSuperAdmin ? (
                    <SuperAdminDashboardView
                      groups={groups}
                      health={health}
                      loading={loadingHealth}
                      onOpenCreateAdmin={() => setIsUserModalOpen(true)}
                    />
                  ) : (
                    <AdminDashboardView />
                  )}
                </div>
              }
            />

            {/* 2. Daireler */}
            <Route
              path="admin/users"
              element={
                <div className="animate-fade-in">
                  <UserList
                    users={users}
                    loading={loadingUsers}
                    activeGroup={activeGroup}
                    onOpenCreate={() => setIsUserModalOpen(true)}
                    onOpenBulkGenerator={() => setIsBulkGeneratorOpen(true)}
                    onOpenExcelImport={() => setIsExcelImportOpen(true)}
                    onAssignResident={(u) => setSelectedUserForAssignment(u)}
                    onDelete={deleteUser}
                  />
                </div>
              }
            />

            {/* 3. Dönemler */}
            <Route
              path="admin/periods"
              element={
                <AdminModuleCard
                  title="Aidat & Bütçe Dönemleri"
                  subtitle="Aylık aidat tarifeleri, demirbaş tahakkukları ve aktif dönem takvimi"
                  icon={Calendar}
                  badgeText="2026 Dönemi Aktif"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded bg-slate-50 border border-slate-200">
                        <div className="text-xs text-slate-500 font-bold">Aktif Dönem</div>
                        <div className="text-base font-bold font-mono text-slate-900 mt-0.5">Ağustos 2026</div>
                        <div className="text-xs text-emerald-600 font-semibold mt-0.5">Tahakkuk Tamamlandı</div>
                      </div>
                      <div className="p-3.5 rounded bg-slate-50 border border-slate-200">
                        <div className="text-xs text-slate-500 font-bold">Gelecek Dönem</div>
                        <div className="text-base font-bold font-mono text-slate-900 mt-0.5">Eylül 2026</div>
                        <div className="text-xs text-indigo-600 font-semibold mt-0.5">Planlandı (15 Eylül)</div>
                      </div>
                      <div className="p-3.5 rounded bg-slate-50 border border-slate-200">
                        <div className="text-xs text-slate-500 font-bold">Toplam Daire</div>
                        <div className="text-base font-bold text-slate-900 mt-0.5 font-mono">{visibleUsersCount} Daire</div>
                        <div className="text-xs text-slate-500 mt-0.5">Birim Başı: 1.250 ₺</div>
                      </div>
                    </div>
                  </div>
                </AdminModuleCard>
              }
            />

            {/* 4. Borçlar */}
            <Route
              path="admin/debts"
              element={
                <AdminModuleCard
                  title="Borç & Tahakkuk Listesi"
                  subtitle="Dairelerin geçmiş ve güncel aidat borçları, gecikme faizleri"
                  icon={Receipt}
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-500 pb-3 border-b border-slate-100">
                      <div>Toplam Tahakkuk: <strong className="text-slate-900 block sm:inline font-mono">25.000 ₺</strong></div>
                      <div>Tahsil Edilen: <strong className="text-emerald-600 block sm:inline font-mono">23.750 ₺ (%95)</strong></div>
                      <div>Kalan Bakiye: <strong className="text-rose-600 block sm:inline font-mono">1.250 ₺</strong></div>
                    </div>
                    <div className="p-3.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <strong className="text-slate-900">Daire 1 (daire1@gmail.com)</strong>
                        <div className="text-[11px] text-slate-400">Ağustos 2026 Aidat Borcu</div>
                      </div>
                      <span className="font-mono font-bold text-rose-600 self-start sm:self-auto">1.250 ₺ (Bekliyor)</span>
                    </div>
                  </div>
                </AdminModuleCard>
              }
            />

            {/* 5. Ödeme Onayları */}
            <Route
              path="admin/payment-approvals"
              element={
                <AdminModuleCard
                  title="Ödeme & Havale Onayları"
                  subtitle="Sakinler tarafından iletilen banka dekontları ve online ödeme onay kuyruğu"
                  icon={CheckCircle2}
                  badgeText="3 Bekleyen Onay"
                >
                  <div className="space-y-3">
                    <div className="p-3.5 rounded bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-xs text-slate-900">Daire 1 — 1.250 ₺</div>
                        <div className="text-[11px] text-slate-400 font-mono">Banka Havalesi • 30 Ağustos 2026</div>
                      </div>
                      <div className="flex gap-2 self-start sm:self-auto">
                        <button className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors">
                          Onayla
                        </button>
                        <button className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold transition-colors">
                          Reddet
                        </button>
                      </div>
                    </div>
                  </div>
                </AdminModuleCard>
              }
            />

            {/* 6. Raporlar */}
            <Route
              path="admin/reports"
              element={
                <AdminModuleCard
                  title="Finansal Raporlar & Analiz"
                  subtitle="Gelir-gider tabloları, kasa hareketleri ve yıllık bütçe gerçekleşme oranları"
                  icon={BarChart3}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-xs font-bold text-slate-500">Aylık Tahsilat Performansı</div>
                      <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">%95.2</div>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-xs font-bold text-slate-500">Ortak Alan Gider Toplamı</div>
                      <div className="text-xl font-bold text-slate-900 mt-1 font-mono">18.420 ₺</div>
                    </div>
                  </div>
                </AdminModuleCard>
              }
            />

            {/* 7. İcra Takip */}
            <Route
              path="admin/legal"
              element={
                <AdminModuleCard
                  title="İcra & Hukuki Takip"
                  subtitle="3 aydan fazla geciken borçlar, noter ihtarnameleri ve avukat takip süreçleri"
                  icon={Scale}
                >
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded border border-slate-200">
                    <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-600" />
                    <div className="font-bold text-slate-900 text-sm">İcrada Bulunan Dosya Yok</div>
                    <p className="mt-0.5 text-slate-500">Tüm dairelerin ödeme performansı yasal takip sınırları içerisindedir.</p>
                  </div>
                </AdminModuleCard>
              }
            />

            {/* 8. Hatırlatmalar */}
            <Route
              path="admin/reminders"
              element={
                <AdminModuleCard
                  title="Otomatik Hatırlatmalar & SMS"
                  subtitle="Son ödeme tarihi yaklaşan dairelere otomatik SMS ve E-Posta bildirim şablonları"
                  icon={Clock}
                >
                  <div className="space-y-3">
                    <div className="p-3.5 rounded bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">Vade Öncesi 3 Gün SMS Hatırlatması</div>
                        <div className="text-[11px] text-slate-400">Her ayın 12'sinde otomatik gönderilir</div>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 self-start sm:self-auto">Aktif</span>
                    </div>
                  </div>
                </AdminModuleCard>
              }
            />

            {/* 9. Duyurular */}
            <Route
              path="admin/announcements"
              element={<PortalAnnouncementsView />}
            />

            {/* 10. Audit Log */}
            <Route
              path="admin/audit-logs"
              element={
                <AdminModuleCard
                  title="Audit Log & Güvenlik Denetimi"
                  subtitle="Kullanıcı girişleri, veri değişiklikleri ve PostgreSQL RLS erişim kayıtları"
                  icon={ShieldCheck}
                >
                  <div className="space-y-2 font-mono text-xs">
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex flex-col sm:flex-row sm:justify-between gap-1 text-slate-700">
                      <span>[AUTH] Kullanıcı girişi: {user?.email}</span>
                      <span className="text-slate-400">Bugün 15:40</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex flex-col sm:flex-row sm:justify-between gap-1 text-slate-700">
                      <span>[RLS] Session context aktif ({user?.groupId || 'global'})</span>
                      <span className="text-slate-400">Bugün 15:35</span>
                    </div>
                  </div>
                </AdminModuleCard>
              }
            />

            {/* 11. Profil */}
            <Route
              path="admin/profile"
              element={<PortalProfileView />}
            />
          </Route>

          {/* Yalnızca Süper Admin: Güvenlik & RLS */}
          <Route element={<RoleRoute allowedRoles={['superadmin']} />}>
            <Route
              path="admin/architecture"
              element={
                <div className="animate-fade-in">
                  <ArchitectureView
                    health={health}
                    loading={loadingHealth}
                    onRefresh={refetchHealth}
                    activeGroup={activeGroup}
                  />
                </div>
              }
            />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </DashboardLayout>

      {/* Slide-Over Drawer for adding Units / Residents / Admins */}
      <CreateUserDrawer
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={createUser}
        groups={groups}
        defaultGroupId={selectedGroupId}
      />

      {/* Batch Generator Drawer */}
      <BulkGeneratorDrawer
        isOpen={isBulkGeneratorOpen}
        onClose={() => setIsBulkGeneratorOpen(false)}
        onSubmit={createBulkUsers}
        groups={groups}
        defaultGroupId={selectedGroupId}
      />

      {/* Excel / CSV Import Drawer */}
      <ExcelImportDrawer
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        onSubmit={createBulkUsers}
        groups={groups}
        defaultGroupId={selectedGroupId}
      />

      {/* Assign Resident to Vacant Unit Drawer */}
      <AssignResidentDrawer
        isOpen={Boolean(selectedUserForAssignment)}
        onClose={() => setSelectedUserForAssignment(null)}
        user={selectedUserForAssignment}
        onUpdate={updateUser}
      />

      {isSuperAdmin && (
        <CreateGroupModal
          isOpen={isGroupModalOpen}
          onClose={() => setIsGroupModalOpen(false)}
          onSubmit={createGroup}
        />
      )}
    </>
  );
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<PublicLoginRoute />} />

      {/* Protected App Routes - Support Tenant Slug URL pattern */}
      <Route element={<ProtectedRoute />}>
        <Route path="/:tenantSlug/*" element={<DashboardShell />} />
        <Route path="/*" element={<DashboardShell />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
