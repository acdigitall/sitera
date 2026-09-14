import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GroupsService } from '../groups.service';
import { GroupEntity } from '../group.entity';

describe('GroupsService (Site & SaaS Lisanslama Testleri)', () => {
  let service: GroupsService;
  let groupsRepo: any;
  let redis: any;
  let currentGroup: any;

  beforeEach(() => {
    currentGroup = {
      id: 'grp-1',
      name: 'Gencosman Apartmanı',
      slug: 'gencosman-apartmani',
      plan: 'pro',
      isActive: true,
      totalUnits: 24,
      city: 'İstanbul',
      district: 'Kadıköy',
      subscriptionStatus: 'trial',
      paymentStatus: 'free_trial',
      unitFee: 20,
      monthlyFee: 480,
      isFrozen: false,
      modules: [],
    };

    groupsRepo = {
      find: vi.fn().mockResolvedValue([currentGroup]),
      findOne: vi.fn().mockImplementation(() => Promise.resolve({ ...currentGroup })),
      create: vi.fn((dto) => ({ id: `grp-${Date.now()}`, ...dto })),
      save: vi.fn((entity) => {
        Object.assign(currentGroup, entity);
        return Promise.resolve({ ...currentGroup });
      }),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    redis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
    };

    service = new GroupsService(groupsRepo, redis);
  });

  describe('create (Yeni Site/Apartman Kaydı)', () => {
    it('Yeni site oluşturulduğunda varsayılan lisans ve birim ücretini doğru hesaplamalıdır', async () => {
      const result = await service.create({
        name: 'Gölbaşı Rezidans',
        slug: 'golbasi-rezidans',
        totalUnits: 50,
        unitFee: 25,
      });

      expect(result.name).toBe('Gölbaşı Rezidans');
      expect(result.slug).toBe('golbasi-rezidans');
      expect(result.monthlyFee).toBe(1250); // 50 * 25
      expect(result.subscriptionStatus).toBe('trial');
      expect(redis.del).toHaveBeenCalled();
    });
  });

  describe('update & extendLicense (Lisans Uzatma & Dondurma)', () => {
    it('Site lisansı 12 ay uzatıldığında durumu active ve paid yapmalıdır', async () => {
      const updated = await service.extendLicense('grp-1', 12);

      expect(updated.subscriptionStatus).toBe('active');
      expect(updated.paymentStatus).toBe('paid');
      expect(updated.licenseExpiresAt).toBeDefined();
      expect(redis.del).toHaveBeenCalledWith('groups:grp-1');
    });

    it('Site dondurulduğunda (toggleFreeze) isFrozen, frozenReason ve paused durumuna geçmelidir', async () => {
      const updated = await service.toggleFreeze('grp-1', true, 'Yıllık lisans ödemesi 60 gün gecikti.');

      expect(updated.isFrozen).toBe(true);
      expect(updated.frozenReason).toBe('Yıllık lisans ödemesi 60 gün gecikti.');
      expect(updated.subscriptionStatus).toBe('paused');
    });

    it('Site dondurması kaldırıldığında durumu tekrar active yapmalıdır', async () => {
      currentGroup.isFrozen = true;
      currentGroup.subscriptionStatus = 'paused';

      const updated = await service.toggleFreeze('grp-1', false);

      expect(updated.isFrozen).toBe(false);
      expect(updated.frozenReason).toBeNull();
      expect(updated.subscriptionStatus).toBe('active');
    });
  });

  describe('toggleGroupModule (Pazar Modülü Aboneliği)', () => {
    it('Yeni bir eklenti modülü aktif edebilmeli ve lisans bitiş süresi tanımlamalıdır', async () => {
      const updated = await service.toggleGroupModule('grp-1', 'ANPR_PLATE_RECOGNITION', 'active', 30);

      expect(updated.modules).toBeDefined();
      const mod = updated.modules?.find((m: any) => m.moduleCode === 'ANPR_PLATE_RECOGNITION');
      expect(mod).toBeDefined();
      expect(mod?.status).toBe('active');
      expect(mod?.expiresAt).toBeDefined();
      expect(redis.del).toHaveBeenCalled();
    });
  });
});
