import { User, UserRole } from './user.js';
import { Group } from './group.js';

export interface LoginDto {
  email: string;
  password?: string;
}

export interface AuthUser {
  id: string;
  groupId: string;
  group?: Group;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
