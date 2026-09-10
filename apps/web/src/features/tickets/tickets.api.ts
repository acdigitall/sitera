import { apiClient } from '../../services/api-client';
import { IssueTicket, CreateTicketDto, UpdateTicketStatusDto } from '@sitera/shared';

export const ticketsApi = {
  getTickets: (options?: { groupId?: string; unit?: string; userId?: string; isStaff?: boolean }): Promise<IssueTicket[]> => {
    const params = new URLSearchParams();
    if (options?.unit) params.append('unit', options.unit);
    if (options?.userId) params.append('userId', options.userId);
    if (options?.isStaff) params.append('isStaff', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient<IssueTicket[]>(`/tickets${query}`, {
      groupId: options?.groupId,
    });
  },

  createTicket: (dto: CreateTicketDto, groupId?: string): Promise<IssueTicket> => {
    return apiClient<IssueTicket>('/tickets', {
      method: 'POST',
      body: JSON.stringify(dto),
      groupId,
    });
  },

  updateStatus: (id: string, dto: UpdateTicketStatusDto, groupId?: string): Promise<IssueTicket> => {
    return apiClient<IssueTicket>(`/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
      groupId,
    });
  },

  deleteTicket: (id: string, groupId?: string): Promise<{ success: boolean }> => {
    return apiClient<{ success: boolean }>(`/tickets/${id}`, {
      method: 'DELETE',
      groupId,
    });
  },
};
