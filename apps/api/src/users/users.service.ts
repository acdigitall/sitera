import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserEntity } from './user.entity';
import { CreateUserDto, UpdateUserDto, formatFullName, User } from '@sitera/shared';
import { RedisService } from '../redis/redis.service';
import { TenantContext } from '../tenancy/tenant.context';

import { GroupEntity } from '../groups/group.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupsRepo: Repository<GroupEntity>,
    private readonly dataSource: DataSource,
    private readonly redis: RedisService,
  ) { }

  /**
   * Helper to execute queries with PostgreSQL Row-Level Security (RLS) context
   */
  private async executeWithRLS<T>(
    groupId: string | undefined,
    operation: (repo: Repository<UserEntity>) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      if (groupId) {
        // Set PostgreSQL session local variable for RLS policy enforcement
        await queryRunner.query(`SET LOCAL app.current_group_id = '${groupId}'`);
      } else {
        await queryRunner.query(`SET LOCAL app.current_group_id = 'bypass_rls'`);
      }

      const scopedRepo = queryRunner.manager.getRepository(UserEntity);
      return await operation(scopedRepo);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(tenantGroupId?: string): Promise<UserEntity[]> {
    const activeGroupId = tenantGroupId || TenantContext.getGroupId();
    const currentUserRole = TenantContext.getUserRole();
    const isSuperAdmin = currentUserRole === 'superadmin';

    const cacheKey = activeGroupId
      ? `users:group:${activeGroupId}:${isSuperAdmin ? 'super' : 'admin'}`
      : `users:all:${isSuperAdmin ? 'super' : 'admin'}`;

    const cached = await this.redis.get<UserEntity[]>(cacheKey);
    if (cached) return cached;

    const users = await this.executeWithRLS(activeGroupId, async (repo) => {
      const qb = repo.createQueryBuilder('user')
        .leftJoinAndSelect('user.group', 'group')
        .orderBy('user.createdAt', 'DESC');

      if (activeGroupId) {
        qb.andWhere('user.groupId = :activeGroupId', { activeGroupId });
      }

      // If requester is not superadmin, hide superadmin account completely
      if (!isSuperAdmin) {
        qb.andWhere("user.role != 'superadmin'");
      }

      const result = await qb.getMany();

      // Find and map the admin of each organization group
      const adminsMap = new Map<string, { id: string; name: string; email: string }>();
      result.forEach((u) => {
        if (u.role === 'admin') {
          adminsMap.set(u.groupId, { id: u.id, name: u.name, email: u.email });
        }
      });

      result.forEach((u: any) => {
        if (u.role !== 'admin' && u.role !== 'superadmin' && u.groupId) {
          u.admin = adminsMap.get(u.groupId) || null;
        }
      });

      return result;
    });

    await this.redis.set(cacheKey, users, 60);
    return users;
  }

  async findOne(id: string, tenantGroupId?: string): Promise<UserEntity> {
    const activeGroupId = tenantGroupId || TenantContext.getGroupId();
    const cacheKey = `users:${id}`;

    const cached = await this.redis.get<UserEntity>(cacheKey);
    if (cached) return cached;

    const user = await this.executeWithRLS(activeGroupId, async (repo) => {
      const qb = repo.createQueryBuilder('user')
        .leftJoinAndSelect('user.group', 'group')
        .where('user.id = :id', { id });

      if (activeGroupId) {
        qb.andWhere('user.groupId = :activeGroupId', { activeGroupId });
      }

      return await qb.getOne();
    });

    if (!user) {
      throw new NotFoundException(`Kullanıcı bulunamadı veya bu gruba erişim yetkiniz yok: ${id}`);
    }

    await this.redis.set(cacheKey, user, 180);
    return user;
  }

  private hashPassword(password: string): string {
    const crypto = require('crypto');
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  async create(dto: CreateUserDto, tenantGroupId?: string): Promise<UserEntity> {
    const currentUserRole = TenantContext.getUserRole();
    const contextGroupId = TenantContext.getGroupId();

    // Regular users (member) are strictly forbidden from creating users
    if (currentUserRole !== 'superadmin' && currentUserRole !== 'admin') {
      throw new ForbiddenException('Kullanıcı tanımlama yetkiniz bulunmamaktadır.');
    }

    // If requester is a regular Admin, force groupId to their own group and restrict role
    let activeGroupId = dto.groupId || tenantGroupId || contextGroupId;
    let role = dto.role || 'member';

    if (currentUserRole === 'admin') {
      if (contextGroupId) {
        activeGroupId = contextGroupId;
      }
      role = 'member'; // Admin always creates standard users (member)
    } else if (currentUserRole === 'superadmin') {
      role = 'admin'; // Super admin creates admins

      // If Super Admin provided a new Organization / Site name directly:
      if (dto.groupName && dto.groupName.trim()) {
        const cleanName = dto.groupName.trim();
        const baseSlug = cleanName
          .toLowerCase()
          .replace(/ğ/g, 'g')
          .replace(/ü/g, 'u')
          .replace(/ş/g, 's')
          .replace(/ı/g, 'i')
          .replace(/ö/g, 'o')
          .replace(/ç/g, 'c')
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        let group = await this.groupsRepo.findOne({ where: { slug: baseSlug } });
        if (!group) {
          group = this.groupsRepo.create({
            name: cleanName,
            slug: baseSlug || `site-${Date.now().toString().slice(-4)}`,
            plan: 'pro',
            isActive: true,
          });
          group = await this.groupsRepo.save(group);
        }
        activeGroupId = group.id;
      }
    }

    if (!activeGroupId) {
      throw new Error('Kullanıcı oluşturmak için geçerli bir groupId veya Site Adı gereklidir.');
    }

    // Default password if none provided so they can log in
    const rawPassword = dto.password || (role === 'admin' ? 'Admin123!' : 'User123!');

    const newUser = await this.executeWithRLS(activeGroupId, async (repo) => {
      const user = repo.create({
        groupId: activeGroupId,
        name: formatFullName(dto.name),
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone,
        units: dto.units && dto.units.length > 0 ? dto.units : [dto.name],
        residentType: dto.residentType || 'owner',
        password: this.hashPassword(rawPassword),
        role,
        isActive: true,
      });
      return await repo.save(user);
    });

    // Invalidate Redis caches
    await this.redis.del(`users:group:${activeGroupId}:all`);
    await this.redis.del(`users:group:${activeGroupId}:super`);
    await this.redis.del(`users:group:${activeGroupId}:admin`);
    await this.redis.del('users:all:super');
    await this.redis.del('users:all:admin');
    return newUser;
  }

  async createBulk(dtos: CreateUserDto[], tenantGroupId?: string): Promise<UserEntity[]> {
    const currentUserRole = TenantContext.getUserRole();
    const contextGroupId = TenantContext.getGroupId();

    if (currentUserRole !== 'superadmin' && currentUserRole !== 'admin') {
      throw new ForbiddenException('Toplu kullanıcı tanımlama yetkiniz bulunmamaktadır.');
    }

    const activeGroupId = tenantGroupId || contextGroupId;
    if (!activeGroupId) {
      throw new Error('Toplu oluşturma için geçerli bir groupId gereklidir.');
    }

    const createdUsers = await this.executeWithRLS(activeGroupId, async (repo) => {
      const entities = dtos.map((dto) => {
        const rawPassword = dto.password || 'User123!';
        return repo.create({
          groupId: activeGroupId,
          name: formatFullName(dto.name),
          email: dto.email.toLowerCase().trim(),
          phone: dto.phone,
          units: dto.units && dto.units.length > 0 ? dto.units : [dto.name],
          residentType: dto.residentType || 'owner',
          password: this.hashPassword(rawPassword),
          role: 'member',
          isActive: true,
        });
      });
      return await repo.save(entities);
    });

    // Invalidate Redis caches
    await this.redis.del(`users:group:${activeGroupId}:all`);
    await this.redis.del(`users:group:${activeGroupId}:super`);
    await this.redis.del(`users:group:${activeGroupId}:admin`);
    await this.redis.del('users:all:super');
    await this.redis.del('users:all:admin');

    return createdUsers;
  }

  async update(id: string, dto: UpdateUserDto, tenantGroupId?: string): Promise<UserEntity> {
    const user = await this.findOne(id, tenantGroupId);
    if (dto.name !== undefined && dto.name.trim()) user.name = formatFullName(dto.name.trim());
    if (dto.email !== undefined && dto.email.trim()) user.email = dto.email.toLowerCase().trim();
    if (dto.phone !== undefined) user.phone = dto.phone.trim() || undefined;
    if (dto.residentType !== undefined) user.residentType = dto.residentType;
    if (dto.units !== undefined && dto.units.length > 0) user.units = dto.units;
    if (dto.role && user.role !== 'superadmin') user.role = dto.role;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    const saved = await this.usersRepo.save(user);

    await this.redis.del(`users:${id}`);
    await this.redis.del(`users:group:${user.groupId}:all`);
    await this.redis.del(`users:group:${user.groupId}:super`);
    await this.redis.del(`users:group:${user.groupId}:admin`);
    await this.redis.del('users:all');
    await this.redis.del('users:all:super');
    await this.redis.del('users:all:admin');
    return saved;
  }

  async remove(id: string, tenantGroupId?: string): Promise<boolean> {
    const currentUserRole = TenantContext.getUserRole();

    // Regular users cannot delete anyone
    if (currentUserRole !== 'superadmin' && currentUserRole !== 'admin') {
      throw new ForbiddenException('Kullanıcı silme yetkiniz bulunmamaktadır.');
    }

    const user = await this.findOne(id, tenantGroupId);

    // Protect Super Admin from deletion
    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'admin@sitera.com').toLowerCase().trim();
    if (user.role === 'superadmin' || user.email.toLowerCase() === superAdminEmail) {
      throw new ForbiddenException('Süper Yönetici hesabı sistem yöneticisidir ve silinemez.');
    }

    // Normal Admin cannot delete other Admins
    if (currentUserRole === 'admin' && user.role === 'admin') {
      throw new ForbiddenException('Yöneticileri yalnızca Süper Yönetici silebilir.');
    }

    const res = await this.usersRepo.delete(user.id);

    await this.redis.del(`users:${id}`);
    await this.redis.del(`users:group:${user.groupId}:all`);
    await this.redis.del(`users:group:${user.groupId}:super`);
    await this.redis.del(`users:group:${user.groupId}:admin`);
    await this.redis.del('users:all:super');
    await this.redis.del('users:all:admin');
    return (res.affected ?? 0) > 0;
  }
}
