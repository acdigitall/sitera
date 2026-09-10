import { apiClient } from '../../../services/api-client';
import {
  PlatformModuleDefinition,
  PlatformModuleCode,
  GroupModuleSubscription,
  Group,
} from '@sitera/shared';

export interface GroupModulesResponse {
  modules: GroupModuleSubscription[];
  catalog: PlatformModuleDefinition[];
}

export const modulesApi = {
  getCatalog: async (): Promise<PlatformModuleDefinition[]> => {
    return await apiClient<PlatformModuleDefinition[]>('/groups/modules/catalog');
  },

  getGroupModules: async (groupId: string): Promise<GroupModulesResponse> => {
    return await apiClient<GroupModulesResponse>(`/groups/${groupId}/modules`);
  },

  toggleModule: async (
    groupId: string,
    data: {
      moduleCode: PlatformModuleCode;
      status: 'active' | 'trial' | 'inactive';
      durationDays?: number;
      customPrice?: number;
    },
  ): Promise<Group> => {
    return await apiClient<Group>(`/groups/${groupId}/modules/toggle`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  subscribeModule: async (
    groupId: string,
    data: {
      moduleCode: PlatformModuleCode;
      isTrial?: boolean;
    },
  ): Promise<Group> => {
    return await apiClient<Group>(`/groups/${groupId}/modules/subscribe`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
