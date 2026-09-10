import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppNotification, NotificationType } from '@sitera/shared';
import { notificationsApi } from './notifications.api';

export const NOTIFICATIONS_UPDATED_EVENT = 'sitera:notifications-updated';

export interface UseNotificationsOptions {
  groupId?: string | null;
  userId?: string | null;
  autoPollIntervalMs?: number; // default 30000ms
}

export function useNotifications({
  groupId,
  userId,
  autoPollIntervalMs = 30000,
}: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      setError(null);

      try {
        const res = await notificationsApi.getNotifications(groupId, {
          userId,
          limit: 40,
        });
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      } catch (err: any) {
        setError(err.message || 'Bildirimler alınamadı.');
      } finally {
        if (!isSilent) setLoading(false);
      }
    },
    [groupId, userId],
  );

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Periodic polling
  useEffect(() => {
    if (!autoPollIntervalMs || autoPollIntervalMs <= 0) return;
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, autoPollIntervalMs);

    return () => clearInterval(interval);
  }, [fetchNotifications, autoPollIntervalMs]);

  // Cross-component event listener
  useEffect(() => {
    const handleUpdate = () => {
      fetchNotifications(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdate);
      }
    };
  }, [fetchNotifications]);

  const triggerGlobalUpdate = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
    }
  };

  // Mark single notification as read
  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await notificationsApi.markAsRead(id, groupId, userId);
        triggerGlobalUpdate();
      } catch {
        // Rollback on failure
        fetchNotifications(true);
      }
    },
    [groupId, userId, fetchNotifications],
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt || new Date().toISOString() })),
    );
    setUnreadCount(0);

    try {
      await notificationsApi.markAllAsRead(groupId, userId);
      triggerGlobalUpdate();
    } catch {
      fetchNotifications(true);
    }
  }, [groupId, userId, fetchNotifications]);

  // Delete notification
  const deleteNotification = useCallback(
    async (id: string) => {
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        await notificationsApi.deleteNotification(id, groupId, userId);
        triggerGlobalUpdate();
      } catch {
        fetchNotifications(true);
      }
    },
    [notifications, groupId, userId, fetchNotifications],
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.isRead),
    [notifications],
  );

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
