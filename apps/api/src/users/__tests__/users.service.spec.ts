import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsersService } from '../users.service';
import { UserEntity } from '../user.entity';
import { GroupEntity } from '../../groups/group.entity';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TenantContext } from '../../tenancy/tenant.context';

describe('UsersService (Birim & İş Mantığı Testleri)', () => {
  let service: UsersService;
  let usersRepo: any;
  let groupsRepo: any;
  let dataSource: any;
  let redis: any;

  const mockGroupId = 'grp-123';
  const mockAdminUser = {
    id: 'admin-1',
    email: 'admin@gencosman.com',
    name: 'Ahmet Yönetici',
    role: 'admin',
    groupId: mockGroupId,
  };

  const createMockRepo = () => ({
    find: vi.fn().mockResolvedValue([]),
    findOne: vi.fn().mockResolvedValue(null),
    create: vi.fn((dto) => ({ id: `usr-${Date.now()}`, ...dto })),
    save: vi.fn((entity) => Promise.resolve(entity)),
    update: vi.fn().mockResolvedValue({ affected: 1 }),
    delete: vi.fn().mockResolvedValue({ affected: 1 }),
    count: vi.fn().mockResolvedValue(0),
    createQueryBuilder: vi.fn(() => ({
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      addOrderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([]),
      getManyAndCount: vi.fn().mockResolvedValue([[], 0]),
      getOne: vi.fn().mockResolvedValue({
        id: 'usr-1',
        groupId: mockGroupId,
        name: 'Test User',
        email: 'test@site.com',
        units: ['A Blok D.1', 'A Blok D.2'],
      }),
    })),
  });

  beforeEach(() => {
    usersRepo = createMockRepo();
    groupsRepo = createMockRepo();

    const mockQueryRunner = {
      connect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([]),
      release: vi.fn().mockResolvedValue(undefined),
      manager: {
        getRepository: vi.fn(() => usersRepo),
      },
    };

    dataSource = {
      createQueryRunner: vi.fn().mockReturnValue(mockQueryRunner),
      query: vi.fn().mockResolvedValue([]),
    };

    redis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      delByPattern: vi.fn().mockResolvedValue(1),
    };

    service = new UsersService(usersRepo, groupsRepo, dataSource, redis);
  });

  describe('create (Tekil Sakin & Yönetici Oluşturma)', () => {
    it('Site yöneticisi e-postası ile daire sakini oluşturulmasını engellemelidir (KURAL 1)', async () => {
      // Simüle: bu e-posta zaten admin olarak kayıtlı
      dataSource.query.mockResolvedValueOnce([
        { id: 'adm-1', email: 'yonetici@site.com', role: 'admin' },
      ]);

      TenantContext.run(
        { groupId: mockGroupId, userRole: 'admin', timestamp: Date.now() },
        async () => {
          await expect(
            service.create(
              {
                name: 'Ahmet Yılmaz',
                email: 'yonetici@site.com',
                phone: '+905551112233',
                units: ['D.1'],
                groupId: mockGroupId,
              },
              mockGroupId,
            ),
          ).rejects.toThrow(BadRequestException);
        },
      );
    });

    it('Aynı e-postaya birden fazla daire atandığında daireleri birleştirmelidir (KURAL 2)', async () => {
      // 1. query: admin kontrolü (boş)
      dataSource.query.mockResolvedValueOnce([]);
      // 2. query: mevcut sakin kontrolü (D.1 dairesi var)
      dataSource.query.mockResolvedValueOnce([
        {
          id: 'usr-1',
          name: 'Mehmet Çokdaireli',
          email: 'mehmet@gmail.com',
          phone: '+905552223344',
          units: ['A Blok D.1'],
          residentType: 'owner',
        },
      ]);
      // 3. update query
      dataSource.query.mockResolvedValueOnce({ affected: 1 });

      usersRepo.findOne.mockResolvedValueOnce({
        id: 'usr-1',
        name: 'Mehmet Çokdaireli',
        email: 'mehmet@gmail.com',
        units: ['A Blok D.1', 'A Blok D.2'],
      });

      TenantContext.run(
        { groupId: mockGroupId, userRole: 'admin', timestamp: Date.now() },
        async () => {
          const result = await service.create(
            {
              name: 'Mehmet Çokdaireli',
              email: 'mehmet@gmail.com',
              units: ['A Blok D.2'],
              groupId: mockGroupId,
            },
            mockGroupId,
          );

          expect(dataSource.query).toHaveBeenCalledTimes(3);
          expect(result.units).toContain('A Blok D.2');
        },
      );
    });

    it('Yeni sakin için varsayılan şifre oluşturup kaydetmelidir', async () => {
      dataSource.query.mockResolvedValueOnce([]); // admin değil
      dataSource.query.mockResolvedValueOnce([]); // henüz kaydı yok

      usersRepo.create.mockImplementation((dto: any) => dto);
      usersRepo.save.mockImplementation((dto: any) => Promise.resolve({ id: 'new-1', ...dto }));

      TenantContext.run(
        { groupId: mockGroupId, userRole: 'admin', timestamp: Date.now() },
        async () => {
          const user = await service.create(
            {
              name: 'Ayşe Kaya',
              email: 'ayse@gmail.com',
              phone: '+905553334455',
              units: ['B Blok D.5'],
              residentType: 'tenant',
              groupId: mockGroupId,
            },
            mockGroupId,
          );

          expect(user).toBeDefined();
          expect(user.role).toBe('member');
          expect(user.email).toBe('ayse@gmail.com');
          expect(user.password).toBeDefined();
        },
      );
    });
  });

  describe('createBulk (Excel ve Toplu Daire Aktarımı)', () => {
    it('Yetkisiz rol (member) toplu kullanıcı eklemeye çalışırsa ForbiddenException fırlatmalıdır', async () => {
      TenantContext.run(
        { groupId: mockGroupId, userRole: 'member', timestamp: Date.now() },
        async () => {
          await expect(
            service.createBulk([
              { name: 'Daire 1', email: 'd1@site.com', groupId: mockGroupId },
            ]),
          ).rejects.toThrow(ForbiddenException);
        },
      );
    });

    it('Excel listesinde admin e-postası varsa BadRequestException fırlatmalıdır', async () => {
      dataSource.query.mockResolvedValueOnce([{ email: 'admin@site.com' }]);

      TenantContext.run(
        { groupId: mockGroupId, userRole: 'admin', timestamp: Date.now() },
        async () => {
          await expect(
            service.createBulk(
              [
                { name: 'Daire 1', email: 'admin@site.com', groupId: mockGroupId },
                { name: 'Daire 2', email: 'd2@site.com', groupId: mockGroupId },
              ],
              mockGroupId,
            ),
          ).rejects.toThrow(BadRequestException);
        },
      );
    });

    it('Aynı kişinin birden fazla dairesi olan Excel satırlarını tekil kullanıcıda birleştirmelidir', async () => {
      dataSource.query.mockResolvedValueOnce([]); // admin yok
      usersRepo.find.mockResolvedValueOnce([]); // veritabanı boş

      usersRepo.create.mockImplementation((dto: any) => dto);
      usersRepo.save.mockImplementation((dto: any) => Promise.resolve(dto));

      TenantContext.run(
        { groupId: mockGroupId, userRole: 'admin', timestamp: Date.now() },
        async () => {
          const dtos = [
            { name: 'Can Tekin', email: 'can@site.com', units: ['D.1'], groupId: mockGroupId },
            { name: 'Can Tekin', email: 'can@site.com', units: ['D.2'], groupId: mockGroupId },
          ];

          const created = await service.createBulk(dtos, mockGroupId);
          expect(created.length).toBe(1);
          expect(created[0].units).toEqual(['D.1', 'D.2']);
        },
      );
    });
  });

  describe('remove (Kullanıcı Silme)', () => {
    it('Var olan kullanıcıyı silmeli ve önbelleği temizlemelidir', async () => {
      usersRepo.findOne.mockResolvedValueOnce({ id: 'usr-del-1', groupId: mockGroupId });
      usersRepo.delete.mockResolvedValueOnce({ affected: 1 });

      TenantContext.run(
        { groupId: mockGroupId, userRole: 'admin', timestamp: Date.now() },
        async () => {
          const res = await service.remove('usr-del-1', mockGroupId);
          expect(res).toBe(true);
          expect(redis.del).toHaveBeenCalled();
        },
      );
    });
  });
});
