import { apiClient } from '../../services/api-client';
import { AuditLog, CreateAuditLogDto } from '@sitera/shared';

export const auditApi = {
  getLogs: (options?: { groupId?: string | null; category?: string; search?: string; limit?: number }): Promise<AuditLog[]> => {
    const params = new URLSearchParams();
    if (options?.category && options.category !== 'ALL') params.append('category', options.category);
    if (options?.search) params.append('search', options.search);
    if (options?.limit) params.append('limit', String(options.limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient<AuditLog[]>(`/audit-logs${query}`, {
      groupId: options?.groupId,
    });
  },

  createLog: (dto: CreateAuditLogDto, groupId?: string | null): Promise<AuditLog> => {
    return apiClient<AuditLog>('/audit-logs', {
      method: 'POST',
      body: JSON.stringify(dto),
      groupId,
    });
  },
};
