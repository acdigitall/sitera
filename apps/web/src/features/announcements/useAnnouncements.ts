import { useState, useEffect, useCallback, useMemo } from 'react';
import { Announcement, CreateAnnouncementDto, AnnouncementReadStats } from '@sitera/shared';
import { announcementsApi } from './announcements.api';

export const ANNOUNCEMENTS_READ_EVENT = 'sitera:announcements-read-updated';

export interface UserContextForAnnouncements {
  id?: string;
  name?: string;
  role?: string;
  units?: string[];
  residentType?: string;
}

export function useAnnouncements(
  groupId?: string | null,
  userOrId?: string | UserContextForAnnouncements | null,
) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userContext: UserContextForAnnouncements | undefined = useMemo(() => {
    if (!userOrId) return undefined;
    if (typeof userOrId === 'string') return { id: userOrId };
    return userOrId;
  }, [userOrId]);

  const userId = userContext?.id;
  const storageKey = useMemo(() => {
    return `sitera:read_announcements:${userId || 'default'}`;
  }, [userId]);

  const [localReadIds, setLocalReadIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(`sitera:read_announcements:${userId || 'default'}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync with storageKey
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(storageKey);
      setLocalReadIds(stored ? JSON.parse(stored) : []);
    } catch {
      setLocalReadIds([]);
    }
  }, [storageKey]);

  // Listen to cross-component read updates
  useEffect(() => {
    const handleSync = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        setLocalReadIds(stored ? JSON.parse(stored) : []);
      } catch {
        // ignore
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(ANNOUNCEMENTS_READ_EVENT, handleSync);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(ANNOUNCEMENTS_READ_EVENT, handleSync);
      }
    };
  }, [storageKey]);

  const saveLocalReadIds = useCallback((newIds: string[]) => {
    setLocalReadIds(newIds);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newIds));
        window.dispatchEvent(new CustomEvent(ANNOUNCEMENTS_READ_EVENT));
      } catch {
        // ignore
      }
    }
  }, [storageKey]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await announcementsApi.findAll(groupId, {
        userId: userContext?.id,
        userRole: userContext?.role,
        units: userContext?.units,
        residentType: userContext?.residentType,
      });
      setAnnouncements(data);
    } catch (err: any) {
      setError(err.message || 'Duyurular yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [groupId, userContext]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Duyuru okundu mu? (Hem sunucu readReceipts listesine hem de yerel hafızaya bakar)
  const isRead = useCallback(
    (id: string) => {
      const ann = announcements.find((a) => a.id === id);
      if (ann && ann.readReceipts && Array.isArray(ann.readReceipts) && userId) {
        const hasServerReceipt = ann.readReceipts.some((r) => r.userId === userId);
        if (hasServerReceipt) return true;
      }
      return localReadIds.includes(id);
    },
    [announcements, localReadIds, userId],
  );

  // Okundu olarak işaretle (Sunucu + Yerel)
  const markAsRead = useCallback(
    async (id: string) => {
      // 1. Yerel hafızaya anında işle (hızlı UI tepkisi)
      if (!localReadIds.includes(id)) {
        saveLocalReadIds([...localReadIds, id]);
      }

      // 2. Sunucuya bildir (arka planda)
      if (userId) {
        try {
          const userUnit =
            userContext?.units && userContext.units.length > 0
              ? userContext.units[0]
              : 'Daire';
          await announcementsApi.markAsRead(
            id,
            {
              userId: userContext?.id,
              userName: userContext?.name || 'Site Sakini',
              unit: userUnit,
            },
            groupId,
          );
        } catch {
          // background sync fails silently
        }
      }
    },
    [localReadIds, saveLocalReadIds, userId, userContext, groupId],
  );

  const markAsUnread = useCallback(
    (id: string) => {
      saveLocalReadIds(localReadIds.filter((item) => item !== id));
    },
    [localReadIds, saveLocalReadIds],
  );

  const toggleRead = useCallback(
    (id: string) => {
      if (isRead(id)) {
        markAsUnread(id);
      } else {
        markAsRead(id);
      }
    },
    [isRead, markAsRead, markAsUnread],
  );

  const markAllAsRead = useCallback(() => {
    const allIds = announcements.map((a) => a.id);
    const combined = Array.from(new Set([...localReadIds, ...allIds]));
    saveLocalReadIds(combined);
    allIds.forEach((id) => markAsRead(id));
  }, [announcements, localReadIds, saveLocalReadIds, markAsRead]);

  const unreadCount = useMemo(() => {
    return announcements.filter((a) => !isRead(a.id)).length;
  }, [announcements, isRead]);

  const createAnnouncement = async (
    dto: CreateAnnouncementDto,
    authorName?: string,
    authorId?: string,
  ) => {
    const created = await announcementsApi.create(dto, authorName, authorId, groupId);
    await fetchAll();
    return created;
  };

  const deleteAnnouncement = async (id: string) => {
    await announcementsApi.delete(id, groupId);
    await fetchAll();
  };

  const getReadStats = async (id: string): Promise<AnnouncementReadStats> => {
    return await announcementsApi.getReadStats(id, groupId);
  };

  return {
    announcements,
    loading,
    error,
    refetch: fetchAll,
    createAnnouncement,
    deleteAnnouncement,
    getReadStats,
    readIds: localReadIds,
    isRead,
    markAsRead,
    markAsUnread,
    toggleRead,
    markAllAsRead,
    unreadCount,
    readCount: announcements.length - unreadCount,
  };
}
