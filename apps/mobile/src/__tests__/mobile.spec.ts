import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatFullName, formatRoleBadge, APP_NAME } from '@sitera/shared';
import { getMobileUsers } from '../services/api';

// Mock react-native for Node/Vitest environment
vi.mock('react-native', () => ({
  Platform: {
    select: (obj: any) => obj.default || obj.ios || 'http://localhost:4000/api',
  },
}));

describe('Mobile App & Services (@sitera/mobile)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Shared Model & Formatting Integration', () => {
    it('Uygulama adı ve temel sabitlerin mobil projede erişilebilir olduğunu doğrulamalıdır', () => {
      expect(APP_NAME).toBe('Sitera');
    });

    it('formatFullName fonksiyonu isimleri uygun şekilde biçimlendirmelidir', () => {
      expect(formatFullName('ahmet yilmaz')).toBe('Ahmet Yilmaz');
      expect(formatFullName('can tekin')).toBe('Can Tekin');
    });

    it('formatRoleBadge fonksiyonu roller için doğru etiket üretmelidir', () => {
      const superBadge = formatRoleBadge('superadmin');
      expect(superBadge.label).toBe('Süper Admin');

      const adminBadge = formatRoleBadge('admin');
      expect(adminBadge.label).toBe('Site Yöneticisi');

      const memberBadge = formatRoleBadge('member');
      expect(memberBadge.label).toBe('Kat Maliki / Sakin');
    });
  });

  describe('getMobileUsers API İstemcisi ve Dayanıklılık (Resilience)', () => {
    it('Sunucu bağlantısı koptuğunda (ağ hatası) uygulamanın çökmemesi için varsayılan sakin dönmelidir', async () => {
      // Mock network failure fetch
      (globalThis as any).fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

      const users = await getMobileUsers('grp_offline');

      expect(users).toBeDefined();
      expect(users.length).toBeGreaterThan(0);
      expect(users[0].name).toBe('Mobil Kullanıcı');
      expect(users[0].role).toBe('member');
    });

    it('Sunucu başarılı yanıt verdiğinde gerçek kullanıcı listesini parse etmelidir', async () => {
      const mockApiUsers = [
        { id: 'usr-1', name: 'Can Tekin', role: 'member', email: 'can@site.com' },
        { id: 'usr-2', name: 'Ayşe Kaya', role: 'admin', email: 'ayse@site.com' },
      ];

      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockApiUsers,
        }),
      });

      const users = await getMobileUsers('grp-123');

      expect(users.length).toBe(2);
      expect(users[0].name).toBe('Can Tekin');
      expect(users[1].role).toBe('admin');
    });
  });
});
