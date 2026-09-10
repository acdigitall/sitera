import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationsService } from '../notifications.service';
import { NotificationEntity } from '../notification.entity';
import { GroupEntity } from '../../groups/group.entity';
import { UserEntity } from '../../users/user.entity';

describe('NotificationsService (Uygulama İçi Bildirim Merkezi Servis Testleri)', () => {
  let service: NotificationsService;
  let notificationsRepo: any;
  let groupsRepo: any;
  let usersRepo: any;
  let dataSource: any;

  const mockGroupId = 'test-group-id-1';
  const mockUserId = 'test-user-id-1';

  beforeEach(() => {
    const createMockRepo = () => ({
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn((dto) => ({
        id: 'notif-' + Math.random().toString(36).slice(2, 6),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isRead: false,
        ...dto,
      })),
      save: vi.fn((entity) => Promise.resolve(entity)),
      remove: vi.fn().mockResolvedValue(true),
      createQueryBuilder: vi.fn(),
    });

    notificationsRepo = createMockRepo();
    groupsRepo = createMockRepo();
    usersRepo = createMockRepo();

    const repoMap = new Map<any, any>([
      [NotificationEntity, notificationsRepo],
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

    service = new NotificationsService(
      notificationsRepo,
      groupsRepo,
      usersRepo,
      dataSource,
    );
  });

  it('1. Sakin için yeni bir arıza/talep güncelleme bildirimi oluşturabilmeli', async () => {
    const notif = await service.createNotification(
      {
        userId: mockUserId,
        title: 'Yönetici Çözüm Notu Yazdı',
        message: 'Arka bahçe çimleri için bahçıvana talimat verildi.',
        type: 'ticket_update',
        priority: 'normal',
        linkUrl: '/portal/tickets',
      },
      mockGroupId,
    );

    expect(notif).toBeDefined();
    expect(notif.userId).toBe(mockUserId);
    expect(notif.title).toBe('Yönetici Çözüm Notu Yazdı');
    expect(notif.type).toBe('ticket_update');
    expect(notif.isRead).toBe(false);
  });

  it('2. Toplu bildirim (ör. hedefli duyuru yayını) oluşturabilmeli', async () => {
    const list = await service.createBulkNotifications(
      [
        {
          userId: 'user-1',
          title: 'Yeni Duyuru',
          message: 'Asansör bakımı duyurusu',
          type: 'announcement',
        },
        {
          userId: 'user-2',
          title: 'Yeni Duyuru',
          message: 'Asansör bakımı duyurusu',
          type: 'announcement',
        },
      ],
      mockGroupId,
    );

    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(2);
  });

  it('3. Okunmamış rozet sayacını (unread count) doğru hesaplamalı', async () => {
    notificationsRepo.count.mockResolvedValueOnce(4);

    const unreadCount = await service.getUnreadCount(mockUserId, mockGroupId);

    expect(unreadCount).toBe(4);
  });

  it('4. Tekil bir bildirimi okundu olarak işaretleyebilmeli', async () => {
    const existingNotif = {
      id: 'notif-123',
      userId: mockUserId,
      groupId: mockGroupId,
      isRead: false,
      readAt: null,
    };

    notificationsRepo.findOne.mockResolvedValueOnce(existingNotif);

    const updated = await service.markAsRead('notif-123', mockUserId, mockGroupId);

    expect(updated.isRead).toBe(true);
    expect(updated.readAt).toBeDefined();
    expect(notificationsRepo.save).toHaveBeenCalled();
  });

  it('5. Tüm okunmamış bildirimleri tek seferde okundu yapabilmeli (markAllAsRead)', async () => {
    const mockUpdateQueryBuilder = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ affected: 5 }),
    };

    notificationsRepo.createQueryBuilder.mockReturnValue(mockUpdateQueryBuilder);

    const res = await service.markAllAsRead(mockUserId, mockGroupId);

    expect(res.affected).toBe(5);
  });

  it('6. Kullanıcının bildirimlerini sayfalama ve filtreyle getirebilmeli', async () => {
    const mockList = [
      { id: 'n1', title: 'Talep güncellendi', isRead: false },
      { id: 'n2', title: 'Ödeme onaylandı', isRead: true },
    ];

    const mockQB = {
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue(mockList),
    };

    notificationsRepo.createQueryBuilder.mockReturnValue(mockQB);
    notificationsRepo.count.mockResolvedValue(1);

    const result = await service.getUserNotifications(mockUserId, mockGroupId, {
      limit: 10,
    });

    expect(result.notifications.length).toBe(2);
    expect(result.unreadCount).toBe(1);
  });
});
