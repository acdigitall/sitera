import { apiClient } from '../../../services/api-client';
import { Group, CreateGroupDto, UpdateGroupDto } from '@sitera/shared';

export const tenantsApi = {
  getAll: async (): Promise<Group[]> => {
    return await apiClient<Group[]>('/groups');
  },

  getById: async (id: string): Promise<Group> => {
    return await apiClient<Group>(`/groups/${id}`);
  },

  create: async (dto: CreateGroupDto): Promise<Group> => {
    return await apiClient<Group>('/groups', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  update: async (id: string, dto: UpdateGroupDto): Promise<Group> => {
    return await apiClient<Group>(`/groups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  delete: async (id: string): Promise<boolean> => {
    await apiClient<{ deleted: boolean }>(`/groups/${id}`, {
      method: 'DELETE',
    });
    return true;
  },

  applyTrial: async (id: string, months: number = 3): Promise<Group> => {
    return await apiClient<Group>(`/groups/${id}/trial`, {
      method: 'POST',
      body: JSON.stringify({ months }),
    });
  },

  extendLicense: async (id: string, months: number = 12): Promise<Group> => {
    return await apiClient<Group>(`/groups/${id}/extend`, {
      method: 'POST',
      body: JSON.stringify({ months }),
    });
  },

  toggleFreeze: async (id: string, isFrozen: boolean, reason?: string): Promise<Group> => {
    return await apiClient<Group>(`/groups/${id}/freeze`, {
      method: 'POST',
      body: JSON.stringify({ isFrozen, reason }),
    });
  },

  exportData: async (id: string): Promise<any> => {
    return await apiClient<any>(`/groups/${id}/export`);
  },
};
