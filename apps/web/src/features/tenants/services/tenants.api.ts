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
};
