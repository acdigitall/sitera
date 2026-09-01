import { apiClient } from '../../../services/api-client';
import { AppHealthStatus } from '@sitera/shared';

export interface ExtendedHealthStatus extends AppHealthStatus {
  database?: string;
  redis?: string;
}

export const healthApi = {
  check: async (): Promise<ExtendedHealthStatus> => {
    return await apiClient<ExtendedHealthStatus>('/health');
  },
};
