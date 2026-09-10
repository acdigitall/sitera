import { Group } from './group.js';

export type UserRole =
  | 'superadmin'
  | 'admin'
  | 'accountant'
  | 'auditor'
  | 'security'
  | 'staff'
  | 'member'
  | 'editor'
  | 'guest';

export type ResidentType = 'owner' | 'tenant' | 'both';

export type Permission =
  | 'finance:view'
  | 'finance:manage'
  | 'finance:approve'
  | 'reports:view'
  | 'reports:export'
  | 'users:view'
  | 'users:manage'
  | 'announcements:view'
  | 'announcements:manage'
  | 'tickets:view'
  | 'tickets:manage'
  | 'audit:view'
  | 'system:manage';

export const ALL_PERMISSIONS: Permission[] = [
  'finance:view',
  'finance:manage',
  'finance:approve',
  'reports:view',
  'reports:export',
  'users:view',
  'users:manage',
  'announcements:view',
  'announcements:manage',
  'tickets:view',
  'tickets:manage',
  'audit:view',
  'system:manage',
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  superadmin: [...ALL_PERMISSIONS],
  admin: [
    'finance:view',
    'finance:manage',
    'finance:approve',
    'reports:view',
    'reports:export',
    'users:view',
    'users:manage',
    'announcements:view',
    'announcements:manage',
    'tickets:view',
    'tickets:manage',
    'audit:view',
  ],
  accountant: [
    'finance:view',
    'finance:manage',
    'finance:approve',
    'reports:view',
    'reports:export',
    'users:view',
    'audit:view',
  ],
  auditor: [
    'finance:view',
    'reports:view',
    'reports:export',
    'users:view',
    'audit:view',
  ],
  security: [
    'users:view',
    'announcements:view',
    'tickets:view',
    'tickets:manage',
  ],
  staff: [
    'announcements:view',
    'tickets:view',
    'tickets:manage',
  ],
  member: [
    'announcements:view',
    'tickets:view',
    'tickets:manage',
  ],
  editor: [
    'announcements:view',
    'announcements:manage',
    'tickets:view',
    'tickets:manage',
    'users:view',
  ],
  guest: [],
};

export function getRoleLabel(role?: string): string {
  switch (role) {
    case 'superadmin':
      return 'Süper Admin';
    case 'admin':
      return 'Site Yöneticisi';
    case 'accountant':
      return 'Mali Müşavir / Muhasebeci';
    case 'auditor':
      return 'Denetçi / Denetim Kurulu';
    case 'security':
      return 'Güvenlik Görevlisi / Danışma';
    case 'staff':
      return 'Teknik Personel';
    case 'member':
      return 'Kat Maliki / Sakin';
    case 'editor':
      return 'Site Editörü';
    case 'guest':
      return 'Misafir';
    default:
      return role || 'Kullanıcı';
  }
}

export function hasPermission(
  user: { role?: string; customPermissions?: Permission[] } | null | undefined,
  permission: Permission,
): boolean {
  if (!user || !user.role) return false;
  if (user.role === 'superadmin') return true;

  // 1. Check custom permissions override
  if (user.customPermissions && user.customPermissions.includes(permission)) {
    return true;
  }

  // 2. Check role default permissions
  const role = user.role as UserRole;
  const rolePerms = ROLE_PERMISSIONS[role] || [];
  return rolePerms.includes(permission);
}

export function hasAnyPermission(
  user: { role?: string; customPermissions?: Permission[] } | null | undefined,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => hasPermission(user, p));
}

export function hasAllPermissions(
  user: { role?: string; customPermissions?: Permission[] } | null | undefined,
  permissions: Permission[],
): boolean {
  return permissions.every((p) => hasPermission(user, p));
}

export interface User {
  id: string;
  groupId?: string | null;
  group?: Group | null;
  admin?: {
    id: string;
    name: string;
    email: string;
  };
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  customPermissions?: Permission[];
  units?: string[];
  residentType?: ResidentType;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  groupId?: string | null;
  groupName?: string;
  name: string;
  email: string;
  phone?: string;
  role?: UserRole;
  customPermissions?: Permission[];
  password?: string;
  units?: string[];
  residentType?: ResidentType;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: UserRole;
  customPermissions?: Permission[];
  units?: string[];
  residentType?: ResidentType;
  isActive?: boolean;
}
