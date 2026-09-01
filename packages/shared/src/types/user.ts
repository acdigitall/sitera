import { Group } from './group.js';

export type UserRole = 'superadmin' | 'admin' | 'editor' | 'member' | 'guest';
export type ResidentType = 'owner' | 'tenant' | 'both';

export interface User {
  id: string;
  groupId: string;
  group?: Group;
  admin?: {
    id: string;
    name: string;
    email: string;
  };
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  units?: string[];
  residentType?: ResidentType;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  groupId?: string;
  groupName?: string;
  name: string;
  email: string;
  phone?: string;
  role?: UserRole;
  password?: string;
  units?: string[];
  residentType?: ResidentType;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  units?: string[];
  residentType?: ResidentType;
  isActive?: boolean;
}
