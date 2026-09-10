import { apiClient } from '../../services/api-client';
import { AppNotification, NotificationType } from '@sitera/shared';

export interface GetNotificationsParams {
  userId?: string;
  unreadOnly?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

// Fallback seed for offline / client demo
const getInitialFallbackNotifications = (userId: string): AppNotification[] => [
  {
    id: 'fallback-notif-1',
    groupId: 'default',
    userId,
    title: 'Yönetici Çözüm Notu Yazdı',
    message:
      '"Arka bahçe çimleri çok uzadı" başlıklı talebinize bina yönetimi çözüm notu ekledi: "Bahçıvana ve peyzaj firmasına talimat verildi, Cumartesi günü sabah çimler biçilecek."',
    type: 'ticket_update',
    priority: 'normal',
    isRead: false,
    linkUrl: '/portal/tickets',
    metadata: { ticketCategory: 'Peyzaj & Bahçe' },
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'fallback-notif-2',
    groupId: 'default',
    userId,
    title: 'Ödemeniz Onaylandı',
    message:
      'Mart 2026 dönemi için ilettiğiniz 1.250 ₺ tutarındaki aidat ödeme dekontu yönetim tarafından incelenmiş ve onaylanmıştır.',
    type: 'payment_approval',
    priority: 'normal',
    isRead: false,
    linkUrl: '/portal/payments',
    metadata: { amount: 1250 },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'fallback-notif-3',
    groupId: 'default',
    userId,
    title: 'Yeni Duyuru: Aylık Bina & Tesis Bakımı',
    message:
      'Perşembe günü 10:00 - 13:00 saatleri arasında hidrofor ve asansör sistemlerinin rutin bakımı gerçekleştirilecektir.',
    type: 'announcement',
    priority: 'high',
    isRead: true,
    readAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    linkUrl: '/portal/announcements',
    metadata: { isImportant: true },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
];

const LOCAL_STORAGE_KEY = 'sitera:notifications_cache:';

const inMemoryCache: Record<string, AppNotification[]> = {};

function getLocalStore(userId: string): AppNotification[] {
  if (typeof window === 'undefined') {
    if (!inMemoryCache[userId]) {
      inMemoryCache[userId] = getInitialFallbackNotifications(userId);
    }
    return inMemoryCache[userId];
  }
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}${userId}`);
    if (raw) return JSON.parse(raw);
    const initial = getInitialFallbackNotifications(userId);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}${userId}`, JSON.stringify(initial));
    return initial;
  } catch {
    return getInitialFallbackNotifications(userId);
  }
}

function setLocalStore(userId: string, notifs: AppNotification[]): void {
  if (typeof window === 'undefined') {
    inMemoryCache[userId] = notifs;
    return;
  }
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}${userId}`, JSON.stringify(notifs));
  } catch {
    // ignore
  }
}

export const notificationsApi = {
  getNotifications: async (
    groupId?: string,
    params?: GetNotificationsParams,
  ): Promise<NotificationsResponse> => {
    const query = new URLSearchParams();
    if (params?.userId) query.set('userId', params.userId);
    if (params?.unreadOnly !== undefined) query.set('unreadOnly', String(params.unreadOnly));
    if (params?.type) query.set('type', params.type);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    const queryString = query.toString();
    const endpoint = queryString ? `/notifications?${queryString}` : '/notifications';

    try {
      return await apiClient<NotificationsResponse>(endpoint, {
        groupId,
        headers: params?.userId ? { 'x-user-id': params.userId } : undefined,
      });
    } catch {
      // Offline / mock fallback
      const userId = params?.userId || 'default';
      let list = getLocalStore(userId);
      if (params?.unreadOnly) {
        list = list.filter((n) => !n.isRead);
      }
      if (params?.type) {
        list = list.filter((n) => n.type === params.type);
      }
      const unreadCount = getLocalStore(userId).filter((n) => !n.isRead).length;
      return {
        notifications: list,
        unreadCount,
      };
    }
  },

  getUnreadCount: async (groupId?: string, userId?: string): Promise<number> => {
    try {
      const res = await apiClient<{ count: number }>(
        userId ? `/notifications/unread-count?userId=${encodeURIComponent(userId)}` : '/notifications/unread-count',
        {
          groupId,
          headers: userId ? { 'x-user-id': userId } : undefined,
        },
      );
      return res.count;
    } catch {
      const uid = userId || 'default';
      return getLocalStore(uid).filter((n) => !n.isRead).length;
    }
  },

  markAsRead: async (id: string, groupId?: string, userId?: string): Promise<AppNotification> => {
    try {
      return await apiClient<AppNotification>(`/notifications/${id}/read`, {
        method: 'PATCH',
        groupId,
        headers: userId ? { 'x-user-id': userId } : undefined,
      });
    } catch {
      const uid = userId || 'default';
      const list = getLocalStore(uid);
      const updated = list.map((n) =>
        n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n,
      );
      setLocalStore(uid, updated);
      return updated.find((n) => n.id === id) || ({} as AppNotification);
    }
  },

  markAllAsRead: async (groupId?: string, userId?: string): Promise<{ affected: number }> => {
    try {
      return await apiClient<{ affected: number }>('/notifications/read-all', {
        method: 'PATCH',
        groupId,
        headers: userId ? { 'x-user-id': userId } : undefined,
      });
    } catch {
      const uid = userId || 'default';
      const list = getLocalStore(uid);
      const unreadCount = list.filter((n) => !n.isRead).length;
      const updated = list.map((n) => ({
        ...n,
        isRead: true,
        readAt: n.readAt || new Date().toISOString(),
      }));
      setLocalStore(uid, updated);
      return { affected: unreadCount };
    }
  },

  deleteNotification: async (
    id: string,
    groupId?: string,
    userId?: string,
  ): Promise<{ success: boolean }> => {
    try {
      return await apiClient<{ success: boolean }>(`/notifications/${id}`, {
        method: 'DELETE',
        groupId,
        headers: userId ? { 'x-user-id': userId } : undefined,
      });
    } catch {
      const uid = userId || 'default';
      const list = getLocalStore(uid);
      setLocalStore(
        uid,
        list.filter((n) => n.id !== id),
      );
      return { success: true };
    }
  },
};
