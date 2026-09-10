import React, { useState, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, LoginView } from '../features/auth';
import {
  useTenants,
  CreateGroupModal,
  CreateSitePage,
  SiteDetailPage,
  SitesManagementPage,
  LicenseRenewalsPage,
  CommunicationPackagesPage,
  PlatformModulesPage,
} from '../features/tenants';
import { TenantMarketplacePage } from '../features/marketplace';
import {
  useUsers,
  UserList,
  CreateUserDrawer,
  CreateUserPage,
  BulkGeneratorDrawer,
  ExcelImportDrawer,
  AssignResidentDrawer,
} from '../features/users';
import { User } from '@sitera/shared';
import { useHealth, ArchitectureView } from '../features/architecture';
import {
  useFinance,
  AdminPaymentApprovalsView,
  AdminExpenseSplitView,
  AdminFinancialReportsView,
  AdminDebtsView,
  AdminLegalView,
  AdminRemindersView,
} from '../features/finance';
import { AdminAnnouncementsView } from '../features/announcements';
import { PortalTicketsView, AdminTicketsView } from '../features/tickets';
import { AdminAuditLogsView } from '../features/audit';
import {
  PortalHomeView,
  PortalAnnouncementsView,
  PortalPaymentsView,
  PortalProfileView,
} from '../features/portal';
import { AdminDashboardView, SuperAdminDashboardView } from '../features/dashboard';
import { SuperAdminSupportPage, useSupport } from '../features/support';
import { SuperAdminLegalSettingsPage } from '../features/legal';
import { DashboardLayout } from '../components/layout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { Spinner } from '../components/common/Spinner';

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

  return <LoginView />;
};

// Main Authenticated Dashboard Shell
const DashboardShell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'superadmin';
  const { isInSupportMode } = useSupport();

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
    selectedGroupId,
    activeGroup,
    loading: loadingGroups,
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

  const visibleUsersCount = users.filter((u) =>
    isSuperAdmin ? u.role !== 'superadmin' : u.role === 'member'
  ).length;

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
        groupsCount={groups.length}
        upcomingRenewalsCount={upcomingRenewalsCount}
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
                  {isSuperAdmin && !isInSupportMode ? (
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
                  groups={groups}
                  activeGroup={activeGroup}
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
                  debts={debts}
                  periods={periods}
                  onRecordCash={recordCashCollection}
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
      </DashboardLayout>

      {/* Slide-Over Drawer for adding Units / Residents / Admins */}
      <CreateUserDrawer
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={createUser}
        groups={groups}
        defaultGroupId={selectedGroupId}
        existingUsers={users}
        isStaffMode={isStaffDrawerMode}
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
        existingUsers={users}
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
        <Route path="/platform/*" element={<DashboardShell />} />
        <Route path="/:tenantSlug/*" element={<DashboardShell />} />
        <Route path="/*" element={<DashboardShell />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
