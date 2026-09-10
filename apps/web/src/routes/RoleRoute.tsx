import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth';
import { UserRole, Permission, hasPermission } from '@sitera/shared';
import { Spinner } from '../components/common';

interface RoleRouteProps {
  allowedRoles?: UserRole[];
  requiredPermission?: Permission;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, requiredPermission }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Spinner fullScreen text="Yetkiler kontrol ediliyor..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 1. Role membership check
  const roleMatches = !allowedRoles || allowedRoles.includes(user.role);

  // 2. Permission check
  const permissionMatches = !requiredPermission || hasPermission(user, requiredPermission);

  const hasAccess = roleMatches && permissionMatches;

  if (!hasAccess) {
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

    // If regular resident tries to access admin routes, redirect to portal
    if (user.role === 'member') {
      return <Navigate to={`/${tenantSlug}/portal/home`} replace />;
    }
    // If staff/admin tries to access unauthorized route, redirect to overview
    return <Navigate to={`/${tenantSlug}/admin/overview`} replace />;
  }

  return <Outlet />;
};
