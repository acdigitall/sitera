import { describe, it, expect, vi } from 'vitest';
import { announcementsApi } from '../announcements.api';

describe('Web Announcements API & Targeting Helpers', () => {
  it('findAll query parametrelerini doğru oluşturmalıdır', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    await announcementsApi.findAll('group-1', {
      userId: 'user-1',
      userRole: 'resident',
      units: ['A Blok D.1', 'A Blok D.2'],
      residentType: 'owner',
    });

    expect(fetchSpy).toHaveBeenCalled();
    const calledUrl = fetchSpy.mock.calls[0][0];
    expect(calledUrl).toContain('/api/announcements');
    expect(calledUrl).toContain('userId=user-1');
    expect(calledUrl).toContain('userRole=resident');
    expect(calledUrl).toContain('units=A+Blok+D.1%2CA+Blok+D.2');
    expect(calledUrl).toContain('residentType=owner');

    vi.unstubAllGlobals();
  });

  it('markAsRead doğru payload ile sunucuya POST isteği atmalıdır', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { success: true, readCount: 3, readPercentage: 60 } }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    await announcementsApi.markAsRead('ann-100', {
      userId: 'u-1',
      userName: 'Mehmet Yılmaz',
      unit: 'Daire 3',
    }, 'group-1');

    expect(fetchSpy).toHaveBeenCalled();
    const [calledUrl, options] = fetchSpy.mock.calls[0];
    expect(calledUrl).toContain('/api/announcements/ann-100/read');
    expect(options.method).toBe('POST');
    const body = JSON.parse(options.body);
    expect(body.userId).toBe('u-1');
    expect(body.userName).toBe('Mehmet Yılmaz');

    vi.unstubAllGlobals();
  });
});
