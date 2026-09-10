import { apiClient } from '../../services/api-client';
import {
  Announcement,
  CreateAnnouncementDto,
  AnnouncementReadStats,
  MarkAnnouncementReadDto,
} from '@sitera/shared';

export interface FindAnnouncementsParams {
  userId?: string;
  userRole?: string;
  units?: string[];
  residentType?: string;
}

export const announcementsApi = {
  findAll: (
    groupId?: string | null,
    params?: FindAnnouncementsParams,
  ): Promise<Announcement[]> => {
    const query = new URLSearchParams();
    if (params?.userId) query.set('userId', params.userId);
    if (params?.userRole) query.set('userRole', params.userRole);
    if (params?.units && params.units.length > 0) {
      query.set('units', params.units.join(','));
    }
    if (params?.residentType) query.set('residentType', params.residentType);

    const queryString = query.toString();
    const endpoint = queryString ? `/announcements?${queryString}` : '/announcements';

    return apiClient<Announcement[]>(endpoint, { groupId });
  },

  create: (
    dto: CreateAnnouncementDto,
    authorName?: string,
    authorId?: string,
    groupId?: string | null,
  ): Promise<Announcement> => {
    return apiClient<Announcement>('/announcements', {
      method: 'POST',
      body: JSON.stringify({ ...dto, authorName, authorId }),
      groupId,
    });
  },

  markAsRead: (
    id: string,
    dto: MarkAnnouncementReadDto,
    groupId?: string | null,
  ): Promise<{ success: boolean; readCount: number; readPercentage: number }> => {
    return apiClient<{ success: boolean; readCount: number; readPercentage: number }>(
      `/announcements/${id}/read`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
        groupId,
      },
    );
  },

  getReadStats: (
    id: string,
    groupId?: string | null,
  ): Promise<AnnouncementReadStats> => {
    return apiClient<AnnouncementReadStats>(`/announcements/${id}/reads`, {
      groupId,
    });
  },

  delete: (id: string, groupId?: string | null): Promise<boolean> => {
    return apiClient<boolean>(`/announcements/${id}`, {
      method: 'DELETE',
      groupId,
    });
  },
};
