import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnnouncementsService } from '../announcements.service';
import { AnnouncementEntity } from '../announcement.entity';
import { GroupEntity } from '../../groups/group.entity';
import { UserEntity } from '../../users/user.entity';

describe('AnnouncementsService (Hedefleme, Zamanlama ve Okundu Takibi Testleri)', () => {
  let service: AnnouncementsService;
  let announcementsRepo: any;
  let groupsRepo: any;
  let usersRepo: any;
  let dataSource: any;

  const mockGroupId = 'announcement-group-1';

  beforeEach(() => {
    const createMockRepo = () => ({
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn((dto) => ({
        id: 'ann-' + Math.random().toString(36).slice(2, 6),
        createdAt: new Date().toISOString(),
        readReceipts: [],
        ...dto,
      })),
      save: vi.fn((entity) => Promise.resolve(entity)),
      remove: vi.fn().mockResolvedValue(true),
    });

    announcementsRepo = createMockRepo();
    groupsRepo = createMockRepo();
    usersRepo = createMockRepo();

    const repoMap = new Map<any, any>([
      [AnnouncementEntity, announcementsRepo],
      [GroupEntity, groupsRepo],
      [UserEntity, usersRepo],
    ]);

    const mockQueryRunner = {
      connect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([]),
      release: vi.fn().mockResolvedValue(undefined),
      manager: {
        getRepository: vi.fn((entity) => repoMap.get(entity) || createMockRepo()),
      },
    };

    dataSource = {
      createQueryRunner: vi.fn().mockReturnValue(mockQueryRunner),
    };

    service = new AnnouncementsService(
      announcementsRepo,
      groupsRepo,
      usersRepo,
      dataSource,
    );
  });

  // ============================================================
  // 1. HEDEFLEME TESTLERİ (TARGETING FILTERING)
  // ============================================================
  describe('Hedefleme (Targeting Scope)', () => {
    it('A Blok için açılan duyuru, yalnızca A Blok sakinlerine gitmeli; B Blok sakinlerine gösterilmemelidir', async () => {
      const mockAnnouncements = [
        {
          id: 'ann-1',
          title: 'A Blok Asansör Bakımı',
          targetScope: 'block',
          targetBlocks: ['A Blok'],
          status: 'published',
          readReceipts: [],
        },
        {
          id: 'ann-2',
          title: 'Genel Bahçe İlaçlaması',
          targetScope: 'all',
          status: 'published',
          readReceipts: [],
        },
      ];
      announcementsRepo.find.mockResolvedValue(mockAnnouncements);
      usersRepo.find.mockResolvedValue([]);

      // 1. B Blok sakini sorguluyor: Sadece genel duyuruyu görmeli
      const bBlockResidentAnnouncements = await service.findAll(mockGroupId, {
        userId: 'user-b',
        userRole: 'resident',
        units: ['B Blok D.4'],
        residentType: 'resident',
      });
      expect(bBlockResidentAnnouncements).toHaveLength(1);
      expect(bBlockResidentAnnouncements[0].title).toBe('Genel Bahçe İlaçlaması');

      // 2. A Blok sakini sorguluyor: Her iki duyuruyu da görmeli
      const aBlockResidentAnnouncements = await service.findAll(mockGroupId, {
        userId: 'user-a',
        userRole: 'resident',
        units: ['A Blok D.2'],
        residentType: 'resident',
      });
      expect(aBlockResidentAnnouncements).toHaveLength(2);
    });

    it('Yalnızca Kat Malikleri (Ev Sahipleri) için açılan duyuru kiracılara gösterilmemelidir', async () => {
      const mockAnnouncements = [
        {
          id: 'ann-meeting',
          title: 'Olağan Kat Malikleri Genel Kurulu Toplantısı',
          targetScope: 'role',
          targetRole: 'owner',
          status: 'published',
          readReceipts: [],
        },
      ];
      announcementsRepo.find.mockResolvedValue(mockAnnouncements);
      usersRepo.find.mockResolvedValue([]);

      // Kiracı (resident) sorguluyor -> 0 duyuru
      const tenantResults = await service.findAll(mockGroupId, {
        userId: 'tenant-1',
        userRole: 'resident',
        units: ['Daire 3'],
        residentType: 'resident',
      });
      expect(tenantResults).toHaveLength(0);

      // Ev Sahibi (owner) sorguluyor -> Duyuruyu görmeli
      const ownerResults = await service.findAll(mockGroupId, {
        userId: 'owner-1',
        userRole: 'resident',
        units: ['Daire 3'],
        residentType: 'owner',
      });
      expect(ownerResults).toHaveLength(1);
      expect(ownerResults[0].title).toContain('Genel Kurul');
    });

    it('Yönetici sorguladığında hedef kitle veya zamanlama fark etmeksizin tüm duyuruları görmelidir', async () => {
      const mockAnnouncements = [
        { id: 'ann-1', targetScope: 'block', targetBlocks: ['A Blok'], status: 'published' },
        { id: 'ann-2', targetScope: 'role', targetRole: 'owner', status: 'published' },
        { id: 'ann-3', targetScope: 'all', status: 'draft' },
        { id: 'ann-4', targetScope: 'all', status: 'scheduled', publishAt: '2099-01-01' },
      ];
      announcementsRepo.find.mockResolvedValue(mockAnnouncements);
      usersRepo.find.mockResolvedValue([]);

      const adminResults = await service.findAll(mockGroupId, {
        userId: 'admin-1',
        userRole: 'admin',
      });
      expect(adminResults).toHaveLength(4);
    });
  });

  // ============================================================
  // 2. ZAMANLANMIŞ YAYINLAMA TESTLERİ (SCHEDULED PUBLISHING)
  // ============================================================
  describe('Zamanlanmış Yayınlama (Scheduled Publishing)', () => {
    it('ileri tarihli zamanlanmış duyuru, yayın tarihi gelmeden önce sakinlere gösterilmemelidir', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const mockAnnouncements = [
        {
          id: 'ann-future',
          title: 'Gelecek Ay Havuz Açılışı',
          targetScope: 'all',
          status: 'scheduled',
          publishAt: futureDate,
          readReceipts: [],
        },
      ];
      announcementsRepo.find.mockResolvedValue(mockAnnouncements);
      usersRepo.find.mockResolvedValue([]);

      const residentResults = await service.findAll(mockGroupId, {
        userId: 'res-1',
        userRole: 'resident',
        units: ['Daire 1'],
      });

      expect(residentResults).toHaveLength(0);
    });

    it('yeni duyuru oluşturulurken ileri tarih verilmişse otomatik olarak scheduled statüsü almalıdır', async () => {
      const futureDate = '2028-10-01T10:00:00Z';
      const created = await service.create(
        {
          title: 'İleri Tarihli Duyuru',
          content: 'Detaylar...',
          publishAt: futureDate,
        },
        'Yönetici',
        'admin-1',
        mockGroupId,
      );

      expect(created.status).toBe('scheduled');
      expect(created.publishAt).toBe(futureDate);
      expect(announcementsRepo.save).toHaveBeenCalled();
    });
  });

  // ============================================================
  // 3. SUNUCU TARAFLI OKUNDU TAKİBİ TESTLERİ (READ RECEIPTS)
  // ============================================================
  describe('Okundu Takibi (Read Receipts & Stats)', () => {
    it('markAsRead: sakinin okuduğunu kaydetmeli ve mükerrer kayıt yapmamalıdır (idempotency)', async () => {
      const announcement = {
        id: 'ann-read-test',
        groupId: mockGroupId,
        title: 'Önemli Duyuru',
        readReceipts: [],
      };
      announcementsRepo.findOne.mockResolvedValue(announcement);

      // İlk okuma
      const res1 = await service.markAsRead(
        'ann-read-test',
        { userId: 'user-10', userName: 'Mehmet Öz', unit: 'A Blok D.1' },
        mockGroupId,
      );

      expect(res1.success).toBe(true);
      expect(res1.readCount).toBe(1);
      expect(announcement.readReceipts).toHaveLength(1);
      expect(announcementsRepo.save).toHaveBeenCalledTimes(1);

      // İkinci okuma (Aynı kullanıcı tekrar okursa mükerrer olmamalı)
      const res2 = await service.markAsRead(
        'ann-read-test',
        { userId: 'user-10', userName: 'Mehmet Öz', unit: 'A Blok D.1' },
        mockGroupId,
      );

      expect(res2.readCount).toBe(1);
      expect(announcement.readReceipts).toHaveLength(1);
    });

    it('getReadStats: hedef daireler üzerinden okuma oranı (% percentage) ve okunmayan daireleri doğru hesaplamalıdır', async () => {
      const announcement = {
        id: 'ann-stats',
        groupId: mockGroupId,
        targetScope: 'all',
        readReceipts: [
          { userId: 'u1', userName: 'Ahmet', unit: 'Daire 1', readAt: '2026-09-01T10:00:00Z' },
          { userId: 'u2', userName: 'Burak', unit: 'Daire 2', readAt: '2026-09-01T11:00:00Z' },
        ],
      };
      announcementsRepo.findOne.mockResolvedValue(announcement);

      // Sitede 4 daire tanımlı olsun: Daire 1, 2, 3, 4
      usersRepo.find.mockResolvedValue([
        { units: ['Daire 1'] },
        { units: ['Daire 2'] },
        { units: ['Daire 3'] },
        { units: ['Daire 4'] },
      ]);

      const stats = await service.getReadStats('ann-stats', mockGroupId);

      expect(stats.totalTargetUnits).toBe(4);
      expect(stats.readCount).toBe(2);
      expect(stats.readPercentage).toBe(50); // 2/4 = %50
      expect(stats.reads).toHaveLength(2);
      expect(stats.unreadUnits).toEqual(['Daire 3', 'Daire 4']);
    });
  });
});
