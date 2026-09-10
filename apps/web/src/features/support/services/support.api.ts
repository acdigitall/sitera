import { apiClient } from '../../../services/api-client';
import {
  PlatformSupportTicket,
  CreateSupportTicketDto,
  AddSupportTicketMessageDto,
  SupportTicketStatus,
} from '@sitera/shared';

export interface ImpersonateResponse {
  success: boolean;
  ticketId: string;
  targetGroupId: string;
  targetGroupSlug: string;
  targetGroupName: string;
  reason: string;
  allowSiteAccess: boolean;
}

export const supportApi = {
  getTickets: async (groupId?: string): Promise<PlatformSupportTicket[]> => {
    const url = groupId ? `/support/tickets?groupId=${groupId}` : '/support/tickets';
    return await apiClient<PlatformSupportTicket[]>(url);
  },

  getTicketById: async (id: string): Promise<PlatformSupportTicket> => {
    return await apiClient<PlatformSupportTicket>(`/support/tickets/${id}`);
  },

  createTicket: async (dto: CreateSupportTicketDto): Promise<PlatformSupportTicket> => {
    return await apiClient<PlatformSupportTicket>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  addMessage: async (
    id: string,
    dto: AddSupportTicketMessageDto,
  ): Promise<PlatformSupportTicket> => {
    return await apiClient<PlatformSupportTicket>(`/support/tickets/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  updateStatus: async (
    id: string,
    status: SupportTicketStatus,
  ): Promise<PlatformSupportTicket> => {
    return await apiClient<PlatformSupportTicket>(`/support/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  impersonateSite: async (id: string): Promise<ImpersonateResponse> => {
    return await apiClient<ImpersonateResponse>(`/support/tickets/${id}/impersonate`, {
      method: 'POST',
    });
  },

  exitImpersonation: async (id: string): Promise<{ success: boolean }> => {
    return await apiClient<{ success: boolean }>(`/support/tickets/${id}/exit`, {
      method: 'POST',
    });
  },
};
