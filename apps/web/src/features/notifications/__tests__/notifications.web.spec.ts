import { describe, it, expect, vi } from 'vitest';
import { notificationsApi } from '../notifications.api';

describe('Web Notifications API & In-App Notification Center', () => {
  it('1. getNotifications query parametrelerini ve x-user-id başlığını doğru iletmelidir', async () => {
    const mockData = {
      notifications: [
        {
          id: 'n-1',
          title: 'Yönetici Çözüm Notu Yazdı',
          message: 'Çimler biçilecek',
          type: 'ticket_update',
          isRead: false,
        },
      ],
      unreadCount: 1,
    };

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockData }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    const result = await notificationsApi.getNotifications('group-1', {
      userId: 'user-100',
      unreadOnly: true,
      limit: 20,
    });

    expect(fetchSpy).toHaveBeenCalled();
    const [calledUrl, options] = fetchSpy.mock.calls[0];
    expect(calledUrl).toContain('/api/notifications');
    expect(calledUrl).toContain('userId=user-100');
    expect(calledUrl).toContain('unreadOnly=true');
    expect(calledUrl).toContain('limit=20');
    expect(options.headers['x-group-id']).toBe('group-1');
    expect(options.headers['x-user-id']).toBe('user-100');

    expect(result.notifications.length).toBe(1);
    expect(result.unreadCount).toBe(1);

    vi.unstubAllGlobals();
  });

  it('2. markAsRead doğru uç noktaya PATCH isteği atmalıdır', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: { id: 'n-1', isRead: true, readAt: new Date().toISOString() },
        }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    const updated = await notificationsApi.markAsRead('n-1', 'group-1', 'user-100');

    expect(fetchSpy).toHaveBeenCalled();
    const [calledUrl, options] = fetchSpy.mock.calls[0];
    expect(calledUrl).toContain('/api/notifications/n-1/read');
    expect(options.method).toBe('PATCH');
    expect(updated.isRead).toBe(true);

    vi.unstubAllGlobals();
  });

  it('3. markAllAsRead tüm bildirimleri okundu yapmak için PATCH isteği atmalıdır', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { affected: 3 } }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    const res = await notificationsApi.markAllAsRead('group-1', 'user-100');

    expect(fetchSpy).toHaveBeenCalled();
    const [calledUrl, options] = fetchSpy.mock.calls[0];
    expect(calledUrl).toContain('/api/notifications/read-all');
    expect(options.method).toBe('PATCH');
    expect(res.affected).toBe(3);

    vi.unstubAllGlobals();
  });

  it('4. getUnreadCount canlı rozet için sayaç uç noktasını çağırmalıdır', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { count: 5 } }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    const count = await notificationsApi.getUnreadCount('group-1', 'user-100');

    expect(fetchSpy).toHaveBeenCalled();
    const [calledUrl] = fetchSpy.mock.calls[0];
    expect(calledUrl).toContain('/api/notifications/unread-count?userId=user-100');
    expect(count).toBe(5);

    vi.unstubAllGlobals();
  });

  it('5. Ağ hatası durumunda fallback mağazadan kesintisiz veri sağlayabilmeli', async () => {
    // Simulate network error
    const fetchSpy = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', fetchSpy);

    const result = await notificationsApi.getNotifications('group-1', {
      userId: 'test-user-offline',
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.notifications)).toBe(true);
    expect(result.notifications.length).toBeGreaterThan(0);
    expect(typeof result.unreadCount).toBe('number');

    vi.unstubAllGlobals();
  });
});
