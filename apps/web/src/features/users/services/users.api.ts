import { apiClient } from '../../../services/api-client';
import { User, CreateUserDto, UpdateUserDto } from '@sitera/shared';

export const usersApi = {
  getAll: async (groupId?: string): Promise<User[]> => {
    return await apiClient<User[]>('/users', { groupId });
  },

  getById: async (id: string, groupId?: string): Promise<User> => {
    return await apiClient<User>(`/users/${id}`, { groupId });
  },

  create: async (dto: CreateUserDto, groupId?: string): Promise<User> => {
    const targetGroupId = dto.groupId || groupId;
    return await apiClient<User>('/users', {
      method: 'POST',
      groupId: targetGroupId,
      body: JSON.stringify({ ...dto, groupId: targetGroupId }),
    });
  },

  createBulk: async (dtos: CreateUserDto[], groupId?: string): Promise<User[]> => {
    const targetGroupId = dtos[0]?.groupId || groupId;
    return await apiClient<User[]>('/users/bulk', {
      method: 'POST',
      groupId: targetGroupId,
      body: JSON.stringify(dtos),
    });
  },

  update: async (id: string, dto: UpdateUserDto, groupId?: string): Promise<User> => {
    return await apiClient<User>(`/users/${id}`, {
      method: 'PATCH',
      groupId,
      body: JSON.stringify(dto),
    });
  },

  delete: async (id: string, groupId?: string): Promise<boolean> => {
    await apiClient<{ deleted: boolean }>(`/users/${id}`, {
      method: 'DELETE',
      groupId,
    });
    return true;
  },
};
