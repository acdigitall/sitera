import { useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import {
  Permission,
  UserRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRoleLabel,
} from '@sitera/shared';

export function usePermissions() {
  const { user } = useAuth();

  const role = (user?.role || 'guest') as UserRole;
  const roleTitle = useMemo(() => getRoleLabel(role), [role]);

  const can = (permission: Permission) => hasPermission(user, permission);
  const canAny = (permissions: Permission[]) => hasAnyPermission(user, permissions);
  const canAll = (permissions: Permission[]) => hasAllPermissions(user, permissions);

  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin';
  const isAccountant = role === 'accountant';
  const isAuditor = role === 'auditor';
  const isSecurity = role === 'security';
  const isStaff = role === 'staff';
  const isResident = role === 'member';

  return {
    user,
    role,
    roleTitle,
    can,
    canAny,
    canAll,
    isSuperAdmin,
    isAdmin,
    isAccountant,
    isAuditor,
    isSecurity,
    isStaff,
    isResident,
  };
}
