import React, { useState, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../features/auth';
import { useTenants } from '../features/tenants';
import { useUsers } from '../features/users';
import { User, Group } from '@sitera/shared';
import { useHealth } from '../features/architecture';
import { useFinance } from '../features/finance';
import { useSupport } from '../features/support';
import { DashboardLayout } from '../components/layout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { Spinner } from '../components/common/Spinner';

// -----------------------------------------------------------------------------
// LAZY-LOADED ROUTE COMPONENTS & DRAWERS (Frontend Code-Splitting)
// -----------------------------------------------------------------------------

// Authentication
const LoginView = React.lazy(() =>
  import('../features/auth/components/LoginView').then((m) => ({ default: m.LoginView }))
);

// Tenant Management (SuperAdmin)
const SitesManagementPage = React.lazy(() =>
  import('../features/tenants/components/SitesManagementPage').then((m) => ({ default: m.SitesManagementPage }))
);
const CreateSitePage = React.lazy(() =>
  import('../features/tenants/components/CreateSitePage').then((m) => ({ default: m.CreateSitePage }))
);
const SiteDetailPage = React.lazy(() =>
  import('../features/tenants/components/SiteDetailPage').then((m) => ({ default: m.SiteDetailPage }))
);
const LicenseRenewalsPage = React.lazy(() =>
  import('../features/tenants/components/LicenseRenewalsPage').then((m) => ({ default: m.LicenseRenewalsPage }))
);
const CommunicationPackagesPage = React.lazy(() =>
  import('../features/tenants/components/CommunicationPackagesPage').then((m) => ({ default: m.CommunicationPackagesPage }))
);
const PlatformModulesPage = React.lazy(() =>
  import('../features/tenants/components/PlatformModulesPage').then((m) => ({ default: m.PlatformModulesPage }))
);
const CreateGroupModal = React.lazy(() =>
  import('../features/tenants/components/CreateGroupModal').then((m) => ({ default: m.CreateGroupModal }))
);

// Marketplace
const TenantMarketplacePage = React.lazy(() =>
  import('../features/marketplace/components/TenantMarketplacePage').then((m) => ({ default: m.TenantMarketplacePage }))
);

// Users & Residents
const UserList = React.lazy(() =>
  import('../features/users/components/UserList').then((m) => ({ default: m.UserList }))
);
const CreateUserPage = React.lazy(() =>
  import('../features/users/components/CreateUserPage').then((m) => ({ default: m.CreateUserPage }))
);
const CreateUserDrawer = React.lazy(() =>
  import('../features/users/components/CreateUserDrawer').then((m) => ({ default: m.CreateUserDrawer }))
);
const BulkGeneratorDrawer = React.lazy(() =>
  import('../features/users/components/BulkGeneratorDrawer').then((m) => ({ default: m.BulkGeneratorDrawer }))
);
const ExcelImportDrawer = React.lazy(() =>
  import('../features/users/components/ExcelImportDrawer').then((m) => ({ default: m.ExcelImportDrawer }))
);
const AssignResidentDrawer = React.lazy(() =>
  import('../features/users/components/AssignResidentDrawer').then((m) => ({ default: m.AssignResidentDrawer }))
);

// Architecture
const ArchitectureView = React.lazy(() =>
  import('../features/architecture/components/ArchitectureView').then((m) => ({ default: m.ArchitectureView }))
);

// Dashboards
const AdminDashboardView = React.lazy(() =>
  import('../features/dashboard/components/AdminDashboardView').then((m) => ({ default: m.AdminDashboardView }))
);
const SuperAdminDashboardView = React.lazy(() =>
  import('../features/dashboard/components/SuperAdminDashboardView').then((m) => ({ default: m.SuperAdminDashboardView }))
);

// Staff
const StaffDashboardView = React.lazy(() =>
  import('../features/staff/components/StaffDashboardView').then((m) => ({ default: m.StaffDashboardView }))
);

// Finance
const AdminPaymentApprovalsView = React.lazy(() =>
  import('../features/finance/components/AdminPaymentApprovalsView').then((m) => ({ default: m.AdminPaymentApprovalsView }))
);
const AdminExpenseSplitView = React.lazy(() =>
  import('../features/finance/components/AdminExpenseSplitView').then((m) => ({ default: m.AdminExpenseSplitView }))
);
const AdminFinancialReportsView = React.lazy(() =>
  import('../features/finance/components/AdminFinancialReportsView').then((m) => ({ default: m.AdminFinancialReportsView }))
);
const AdminDebtsView = React.lazy(() =>
  import('../features/finance/components/AdminDebtsView').then((m) => ({ default: m.AdminDebtsView }))
);
const AdminLegalView = React.lazy(() =>
  import('../features/finance/components/AdminLegalView').then((m) => ({ default: m.AdminLegalView }))
);
const AdminRemindersView = React.lazy(() =>
  import('../features/finance/components/AdminRemindersView').then((m) => ({ default: m.AdminRemindersView }))
);
const AdminAccountsView = React.lazy(() =>
  import('../features/finance/components/AdminAccountsView').then((m) => ({ default: m.AdminAccountsView }))
);

// Announcements & Tickets & Audit
const AdminAnnouncementsView = React.lazy(() =>
  import('../features/announcements/components/AdminAnnouncementsView').then((m) => ({ default: m.AdminAnnouncementsView }))
);
const PortalTicketsView = React.lazy(() =>
  import('../features/tickets/components/PortalTicketsView').then((m) => ({ default: m.PortalTicketsView }))
);
const AdminTicketsView = React.lazy(() =>
  import('../features/tickets/components/AdminTicketsView').then((m) => ({ default: m.AdminTicketsView }))
);
const AdminAuditLogsView = React.lazy(() =>
  import('../features/audit/components/AdminAuditLogsView').then((m) => ({ default: m.AdminAuditLogsView }))
);

// Portal (Resident)
const PortalHomeView = React.lazy(() =>
  import('../features/portal/components/PortalHomeView').then((m) => ({ default: m.PortalHomeView }))
);
const PortalAnnouncementsView = React.lazy(() =>
  import('../features/portal/components/PortalAnnouncementsView').then((m) => ({ default: m.PortalAnnouncementsView }))
);
const PortalPaymentsView = React.lazy(() =>
  import('../features/portal/components/PortalPaymentsView').then((m) => ({ default: m.PortalPaymentsView }))
);
const PortalProfileView = React.lazy(() =>
  import('../features/portal/components/PortalProfileView').then((m) => ({ default: m.PortalProfileView }))
);

// Support & Legal (SuperAdmin)
const SuperAdminSupportPage = React.lazy(() =>
  import('../features/support/components/SuperAdminSupportPage').then((m) => ({ default: m.SuperAdminSupportPage }))
);
const SuperAdminLegalSettingsPage = React.lazy(() =>
  import('../features/legal/components/SuperAdminLegalSettingsPage').then((m) => ({ default: m.SuperAdminLegalSettingsPage }))
);

// Root Index Redirector based on user role and tenant slug
const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Spinner fullScreen text="Yönlendiriliyor..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'superadmin') {
    return <Navigate to="/platform/admin/overview" replace />;
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

  if (user.role === 'staff') {
    return <Navigate to={`/${tenantSlug}/admin/staff-panel`} replace />;
  }

  return <Navigate to={`/${tenantSlug}/admin/overview`} replace />;
};

// Login Route Guard: If already logged in, redirect to home
const PublicLoginRoute: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <Spinner fullScreen text="Oturum kontrol ediliyor..." />;
  }

  if (isAuthenticated && user) {
    return <RootRedirect />;
  }

  return (
    <React.Suspense fallback={<Spinner fullScreen text="Giriş ekranı yükleniyor..." />}>
      <LoginView />
    </React.Suspense>
  );
};

// Main Authenticated Dashboard Shell
const DashboardShell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tenantSlug: urlTenantSlug } = useParams<{ tenantSlug?: string }>();
  const isSuperAdmin = user?.role === 'superadmin';
  const { isInSupportMode, supportSession } = useSupport();

  // User Management Drawers state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isStaffDrawerMode] = useState(false);
  const [isBulkGeneratorOpen, setIsBulkGeneratorOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState<User | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // Custom Feature Hooks
  const {
    groups,
    selectedGroupId: hookSelectedGroupId,
    activeGroup: hookActiveGroup,
    loading: loadingGroups,
    createGroup,
    refetch: refetchGroups,
  } = useTenants();

  // Resolve active group properly from URL slug, support mode, or logged-in user
  const activeGroup = useMemo((): Group | undefined => {
    if (isSuperAdmin && isInSupportMode && supportSession?.targetGroupId) {
      return groups.find((g) => g.id === supportSession.targetGroupId) || undefined;
    }
    if (urlTenantSlug && urlTenantSlug !== 'platform') {
      const match = groups.find((g) => g.slug === urlTenantSlug || g.id === urlTenantSlug);
      if (match) return match;
    }
    if (!isSuperAdmin && user?.groupId) {
      const match = groups.find((g) => g.id === user.groupId);
      if (match) return match;
    }
    if (user?.group) return user.group;
    return hookActiveGroup || groups[0] || undefined;
  }, [groups, urlTenantSlug, isSuperAdmin, isInSupportMode, supportSession, user, hookActiveGroup]);

  const selectedGroupId = activeGroup?.id || user?.groupId || hookSelectedGroupId || '';

  // Non-superadmins should ONLY see their own group!
  const userVisibleGroups = useMemo(() => {
    if (isSuperAdmin && !isInSupportMode) return groups;
    if (activeGroup) return [activeGroup];
    if (user?.groupId) {
      const ug = groups.filter((g) => g.id === user.groupId);
      if (ug.length > 0) return ug;
    }
    return groups.slice(0, 1);
  }, [isSuperAdmin, isInSupportMode, groups, activeGroup, user?.groupId]);

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

  const {
    periods,
    debts,
    recordCashCollection,
    dischargeResident,
    refetch: refetchFinance,
  } = useFinance(selectedGroupId);

  const handleRefreshAll = () => {
    refetchHealth();
    refetchGroups();
    refetchUsers();
    refetchFinance();
  };

  const upcomingRenewalsCount = useMemo(() => {
    return groups.filter((g) => {
      const isTrial = g.subscriptionStatus === 'trial';
      const targetExpiry =
        isTrial && g.trialEndsAt
          ? new Date(g.trialEndsAt)
          : g.licenseExpiresAt
          ? new Date(g.licenseExpiresAt)
          : null;
      if (!targetExpiry) return false;
      const diffDays = Math.ceil((targetExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return diffDays <= 60 || diffDays <= 0 || g.paymentStatus === 'overdue' || isTrial;
    }).length;
  }, [groups]);

  const memberUsers = users.filter((u) => u.role === 'member');
  const visibleUsersCount = users.filter((u) =>
    isSuperAdmin ? u.role !== 'superadmin' : u.role === 'member'
  ).length;

  // Gerçek toplam bağımsız bölüm sayısı (çoklu daire sahipliği dahil)
  const totalUnitsCount = useMemo(() => {
    let count = 0;
    memberUsers.forEach((m) => {
      if (m.units && m.units.length > 0) {
        count += m.units.length;
      } else if (m.name) {
        count += 1;
      }
    });
    return count > 0 ? count : visibleUsersCount;
  }, [memberUsers, visibleUsersCount]);

  const currentTenantSlug = isSuperAdmin
    ? isInSupportMode && activeGroup?.slug
      ? activeGroup.slug
      : 'platform'
    : activeGroup?.slug || user?.group?.slug || 'gencosman-apartmani';

  return (
    <>
      <DashboardLayout
        onOpenCreateUser={() => {
          if (isSuperAdmin) {
            navigate(`/${currentTenantSlug}/admin/sites/new`);
          } else {
            navigate(`/${currentTenantSlug}/admin/users/new`);
          }
        }}
        userCount={visibleUsersCount}
        totalUnitsCount={totalUnitsCount}
        groupsCount={isSuperAdmin ? groups.length : 1}
        upcomingRenewalsCount={upcomingRenewalsCount}
        loading={loadingHealth || loadingUsers}
        onRefresh={handleRefreshAll}
      >
        <React.Suspense fallback={<Spinner fullScreen text="Sayfa yükleniyor..." />}>
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
                  groupId={selectedGroupId}
                  onNavigate={(tab) => {
                    const subPath =
                      tab === 'portal_payments'
                        ? '/portal/payments'
                        : tab === 'portal_announcements'
                        ? '/portal/announcements'
                        : tab === 'portal_profile'
                        ? '/portal/profile'
                        : '/portal/home';
                    const slug = activeGroup?.slug || user?.group?.slug || 'gencosman-apartmani';
                    navigate(`/${slug}${subPath}`);
                  }}
                />
              }
            />
            <Route
              path="portal/announcements"
              element={<PortalAnnouncementsView groupId={selectedGroupId} />}
            />
            <Route path="portal/payments" element={<PortalPaymentsView />} />
            <Route path="portal/tickets" element={<PortalTicketsView />} />
            <Route path="portal/profile" element={<PortalProfileView />} />
          </Route>

          {/* ========================================================= */}
          {/* YÖNETİCİ & SÜPER ADMİN YÖNETİM ROTASI                     */}
          {/* ========================================================= */}
          <Route element={<RoleRoute allowedRoles={['superadmin', 'admin', 'accountant', 'auditor', 'security', 'staff', 'editor']} />}>
            <Route path="admin" element={<Navigate to="/admin/overview" replace />} />

            {/* 1. Dashboard */}
            <Route
              path="admin/overview"
              element={
                <div className="animate-fade-in">
                  {user?.role === 'staff' ? (
                    <Navigate to={`/${currentTenantSlug}/admin/staff-panel`} replace />
                  ) : isSuperAdmin && !isInSupportMode ? (
                    <SuperAdminDashboardView
                      groups={groups}
                      health={health}
                      loading={loadingGroups || loadingHealth}
                      onOpenCreateAdmin={() => {
                        navigate(`/${currentTenantSlug}/admin/sites/new`);
                      }}
                    />
                  ) : (
                    <AdminDashboardView
                      groupId={selectedGroupId}
                      users={users}
                      activeGroup={activeGroup}
                    />
                  )}
                </div>
              }
            />

            {/* Personel Görev Paneli */}
            <Route
              path="admin/staff-panel"
              element={
                <div className="animate-fade-in">
                  <StaffDashboardView />
                </div>
              }
            />

            {/* Siteler & Apartmanlar Ana Listesi */}
            <Route
              path="admin/sites"
              element={
                <div className="animate-fade-in">
                  {isSuperAdmin ? (
                    <SitesManagementPage
                      groups={groups}
                      loading={loadingGroups}
                      tenantSlug={currentTenantSlug}
                      onRefresh={handleRefreshAll}
                    />
                  ) : (
                    <Navigate to="/admin/overview" replace />
                  )}
                </div>
              }
            />

            {/* Lisans & Ödeme Takvimi Sayfası */}
            <Route
              path="admin/licenses"
              element={
                <div className="animate-fade-in">
                  {isSuperAdmin ? (
                    <LicenseRenewalsPage
                      groups={groups}
                      loading={loadingGroups}
                      tenantSlug={currentTenantSlug}
                      onRefresh={handleRefreshAll}
                    />
                  ) : (
                    <Navigate to="/admin/overview" replace />
                  )}
                </div>
              }
            />

            {/* SMS & WhatsApp İletişim Paketleri Sayfası */}
            <Route
              path="admin/messages"
              element={
                <div className="animate-fade-in">
                  {isSuperAdmin ? (
                    <CommunicationPackagesPage
                      groups={groups}
                      loading={loadingGroups}
                      tenantSlug={currentTenantSlug}
                    />
                  ) : (
                    <Navigate to="/admin/overview" replace />
                  )}
                </div>
              }
            />

            {/* Modül & Eklenti Yönetimi (Super Admin) */}
            <Route
              path="admin/modules"
              element={
                <div className="animate-fade-in">
                  {isSuperAdmin ? (
                    <PlatformModulesPage
                      groups={groups}
                      loading={loadingGroups}
                      tenantSlug={currentTenantSlug}
                      onRefresh={handleRefreshAll}
                    />
                  ) : (
                    <Navigate to="/admin/overview" replace />
                  )}
                </div>
              }
            />

            {/* Yeni Site & Apartman Ekleme Sayfası */}
            <Route
              path="admin/sites/new"
              element={
                <CreateSitePage
                  onCreateGroup={createGroup}
                  onCreateUser={createUser}
                  onRefresh={handleRefreshAll}
                  tenantSlug={currentTenantSlug}
                />
              }
            />

            {/* Site & Apartman Detay Sayfası */}
            <Route
              path="admin/sites/:siteSlug"
              element={
                <SiteDetailPage
                  groups={groups}
                  tenantSlug={currentTenantSlug}
                  onRefresh={handleRefreshAll}
                />
              }
            />

            {/* Yeni Daire & Sakin & Yönetici Ekleme Sayfası */}
            <Route
              path="admin/users/new"
              element={
                <CreateUserPage
                  onCreateUser={createUser}
                  groups={userVisibleGroups}
                  activeGroup={activeGroup || undefined}
                  existingUsers={users}
                  isSuperAdmin={isSuperAdmin}
                  tenantSlug={currentTenantSlug}
                  onRefresh={handleRefreshAll}
                />
              }
            />

            {/* 2. Daireler & Sakinler */}
            <Route
              path="admin/users"
              element={
                <div className="animate-fade-in">
                  <UserList
                    users={users}
                    debts={debts}
                    loading={loadingUsers}
                    activeGroup={activeGroup}
                    onOpenCreate={(isStaff = false) => {
                      const slug = activeGroup?.slug || user?.group?.slug || 'gencosman-apartmani';
                      navigate(`/${slug}/admin/users/new${isStaff ? '?role=staff' : ''}`);
                    }}
                    onOpenBulkGenerator={() => setIsBulkGeneratorOpen(true)}
                    onOpenExcelImport={() => setIsExcelImportOpen(true)}
                    onAssignResident={(u) => setSelectedUserForAssignment(u)}
                    onUpdate={updateUser}
                    onDischarge={(userId, unit) => dischargeResident({ userId, unit })}
                    onDelete={deleteUser}
                  />
                </div>
              }
            />

            {/* Modül Pazarı (App Store - Site Yöneticisi) */}
            <Route
              path="admin/marketplace"
              element={
                <div className="animate-fade-in">
                  <TenantMarketplacePage
                    activeGroup={activeGroup}
                    onRefresh={handleRefreshAll}
                  />
                </div>
              }
            />
            <Route
              path="admin/marketplace/:moduleCode"
              element={
                <div className="animate-fade-in">
                  <TenantMarketplacePage
                    activeGroup={activeGroup}
                    onRefresh={handleRefreshAll}
                  />
                </div>
              }
            />

            {/* 2.5 Kasa & Banka Hesapları Yönetimi */}
            <Route
              path="admin/accounts"
              element={
                <AdminAccountsView
                  groupId={selectedGroupId}
                  activeGroup={activeGroup}
                />
              }
            />
            <Route
              path="admin/finance-accounts"
              element={
                <AdminAccountsView
                  groupId={selectedGroupId}
                  activeGroup={activeGroup}
                />
              }
            />

            {/* 3. Dönemler / Gider & Masraf Dağıtımı */}
            <Route
              path="admin/periods"
              element={
                <AdminExpenseSplitView
                  groupId={selectedGroupId}
                  users={users}
                  activeGroup={activeGroup}
                />
              }
            />
            <Route
              path="admin/expense-split"
              element={
                <AdminExpenseSplitView
                  groupId={selectedGroupId}
                  users={users}
                  activeGroup={activeGroup}
                />
              }
            />

            {/* 4. Borçlar (Canlı PostgreSQL Veritabanı & Tahakkuk Listesi) */}
            <Route
              path="admin/debts"
              element={
                <AdminDebtsView
                  groupId={selectedGroupId}
                  periods={periods}
                  onRecordCash={recordCashCollection}
                  totalAccrual={debts.reduce((sum, d) => sum + Number(d.amount), 0)}
                  totalCollected={debts.reduce((sum, d) => sum + Number(d.paidAmount), 0)}
                  totalPending={debts
                    .filter((d) => d.status !== 'paid')
                    .reduce((sum, d) => sum + (Number((d as any).totalWithLateFee || d.amount) - Number(d.paidAmount)), 0)}
                  totalDebtsCount={debts.length}
                  unpaidCount={debts.filter((d) => d.status !== 'paid').length}
                  paidCount={debts.filter((d) => d.status === 'paid').length}
                  overdueCount={debts.filter((d) => (d as any).lateFee > 0 || d.status === 'overdue').length}
                />
              }
            />

            {/* 5. Ödeme Onayları */}
            <Route
              path="admin/payment-approvals"
              element={<AdminPaymentApprovalsView groupId={selectedGroupId} />}
            />

            {/* 6. Raporlar & Bilanço */}
            <Route
              path="admin/reports"
              element={<AdminFinancialReportsView groupId={selectedGroupId} />}
            />

            {/* 7. İcra Takip */}
            <Route
              path="admin/legal"
              element={<AdminLegalView />}
            />

            {/* 8. Hatırlatmalar */}
            <Route
              path="admin/reminders"
              element={<AdminRemindersView />}
            />

            {/* 9. Duyurular & Bildirim Merkezi */}
            <Route
              path="admin/announcements"
              element={
                <AdminAnnouncementsView
                  groupId={selectedGroupId}
                  activeGroup={activeGroup}
                />
              }
            />

            {/* 10. Talep & Arıza Yönetimi */}
            <Route
              path="admin/tickets"
              element={
                <AdminTicketsView
                  groupId={selectedGroupId}
                  activeGroup={activeGroup}
                />
              }
            />

            {/* 11. Audit Log & Güvenlik Denetimi (Canlı DB) */}
            <Route
              path="admin/audit-logs"
              element={
                <AdminAuditLogsView
                  groupId={selectedGroupId}
                  activeGroup={activeGroup}
                />
              }
            />

            {/* 12. Profil */}
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

            {/* Süper Admin: Platform Destek Talepleri & Müdahaleler */}
            <Route
              path="admin/support"
              element={
                <div className="animate-fade-in">
                  <SuperAdminSupportPage />
                </div>
              }
            />

            {/* Süper Admin: Sözleşme & KVKK Yönetimi */}
            <Route
              path="admin/legal-settings"
              element={
                <div className="animate-fade-in">
                  <SuperAdminLegalSettingsPage />
                </div>
              }
            />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
        </React.Suspense>
      </DashboardLayout>

      {/* User Management Drawers (Lazy loaded on-demand) */}
      <React.Suspense fallback={null}>
        {isUserModalOpen && (
          <CreateUserDrawer
            isOpen={isUserModalOpen}
            onClose={() => setIsUserModalOpen(false)}
            onSubmit={createUser}
            groups={userVisibleGroups}
            defaultGroupId={selectedGroupId}
            existingUsers={users}
            isStaffMode={isStaffDrawerMode}
          />
        )}

        {/* Batch Generator Drawer */}
        {isBulkGeneratorOpen && (
          <BulkGeneratorDrawer
            isOpen={isBulkGeneratorOpen}
            onClose={() => setIsBulkGeneratorOpen(false)}
            onSubmit={createBulkUsers}
            groups={userVisibleGroups}
            defaultGroupId={selectedGroupId}
          />
        )}

        {/* Excel / CSV Import Drawer (XLSX lazy-loaded only when opened) */}
        {isExcelImportOpen && (
          <ExcelImportDrawer
            isOpen={isExcelImportOpen}
            onClose={() => setIsExcelImportOpen(false)}
            onSubmit={createBulkUsers}
            groups={userVisibleGroups}
            defaultGroupId={selectedGroupId}
          />
        )}

        {/* Assign Resident to Vacant Unit Drawer */}
        {Boolean(selectedUserForAssignment) && (
          <AssignResidentDrawer
            isOpen={Boolean(selectedUserForAssignment)}
            onClose={() => setSelectedUserForAssignment(null)}
            user={selectedUserForAssignment}
            existingUsers={users}
            onUpdate={updateUser}
          />
        )}

        {isSuperAdmin && isGroupModalOpen && (
          <CreateGroupModal
            isOpen={isGroupModalOpen}
            onClose={() => setIsGroupModalOpen(false)}
            onSubmit={createGroup}
          />
        )}
      </React.Suspense>
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
        <Route path="/platform/*" element={<DashboardShell />} />
        <Route path="/:tenantSlug/*" element={<DashboardShell />} />
        <Route path="/*" element={<DashboardShell />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
