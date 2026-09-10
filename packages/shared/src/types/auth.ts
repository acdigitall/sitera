import { User, UserRole } from './user.js';
import { Group } from './group.js';

export interface LoginDto {
  email: string;
  password?: string;
}

export interface AuthUser {
  id: string;
  groupId?: string | null;
  group?: Group | null;
  name: string;
  email: string;
  role: UserRole;
  units?: string[];
  residentType?: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
