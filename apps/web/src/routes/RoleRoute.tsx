import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth';
import { UserRole } from '@sitera/shared';

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = allowedRoles.includes(user.role);

  if (!hasAccess) {
    // If regular user tries to access admin routes, redirect to portal
    if (user.role === 'member') {
      return <Navigate to="/portal/home" replace />;
    }
    // If admin tries to access unauthorized routes, redirect to overview
    return <Navigate to="/admin/overview" replace />;
  }

  return <Outlet />;
};
