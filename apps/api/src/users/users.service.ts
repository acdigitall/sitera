import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { UserEntity } from './user.entity';
import { CreateUserDto, UpdateUserDto, formatFullName, User, PaginatedResult } from '@sitera/shared';
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
    if (typeof queryRunner.startTransaction === 'function') {
      await queryRunner.startTransaction();
    }

    try {
      if (groupId) {
        // Set PostgreSQL session local variable for RLS policy enforcement
        await queryRunner.query(`SET LOCAL app.current_group_id = '${groupId}'`);
      } else {
        await queryRunner.query(`SET LOCAL app.current_group_id = 'bypass_rls'`);
      }

      const scopedRepo = queryRunner.manager.getRepository(UserEntity);
      const result = await operation(scopedRepo);
      if (typeof queryRunner.commitTransaction === 'function') {
        const isActive = queryRunner.isTransactionActive ?? true;
        if (isActive) await queryRunner.commitTransaction();
      }
      return result;
    } catch (error) {
      if (typeof queryRunner.rollbackTransaction === 'function') {
        const isActive = queryRunner.isTransactionActive ?? true;
        if (isActive) await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    tenantGroupId?: string,
    options?: { page?: number; limit?: number; search?: string; role?: string },
  ): Promise<UserEntity[] | PaginatedResult<UserEntity>> {
    const activeGroupId = tenantGroupId || TenantContext.getGroupId();
    const currentUserRole = TenantContext.getUserRole();
    const isSuperAdmin = currentUserRole === 'superadmin';
    const isPaginated = options?.page !== undefined || options?.limit !== undefined;

    const page = Math.max(1, options?.page || 1);
    const limit = Math.max(1, Math.min(100, options?.limit || 50));
    const search = options?.search?.trim();
    const filterRole = options?.role?.trim();

    const cacheKey = activeGroupId
      ? `users:group:${activeGroupId}:${isSuperAdmin ? 'super' : 'admin'}:${isPaginated ? `p_${page}_l_${limit}_s_${search || ''}_r_${filterRole || ''}` : 'all'}`
      : `users:all:${isSuperAdmin ? 'super' : 'admin'}:${isPaginated ? `p_${page}_l_${limit}_s_${search || ''}_r_${filterRole || ''}` : 'all'}`;

    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const resultData = await this.executeWithRLS(activeGroupId, async (repo) => {
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

      if (filterRole && filterRole !== 'all') {
        qb.andWhere('user.role = :filterRole', { filterRole });
      }

      if (search) {
        qb.andWhere(
          '(LOWER(user.name) LIKE :q OR LOWER(user.email) LIKE :q OR user.phone LIKE :q OR LOWER(user.units) LIKE :q)',
          { q: `%${search.toLowerCase()}%` }
        );
      }

      if (isPaginated) {
        qb.skip((page - 1) * limit).take(limit);
        const [items, total] = await qb.getManyAndCount();

        const adminsMap = new Map<string, { id: string; name: string; email: string }>();
        items.forEach((u) => {
          if (u.role === 'admin' && u.groupId) {
            adminsMap.set(u.groupId, { id: u.id, name: u.name, email: u.email });
          }
        });

        items.forEach((u: any) => {
          if (u.role !== 'admin' && u.role !== 'superadmin' && u.groupId) {
            u.admin = adminsMap.get(u.groupId) || null;
          }
        });

        return {
          items,
          total,
          page,
          pageSize: limit,
          totalPages: Math.ceil(total / limit),
        };
      }

      const users = await qb.getMany();

      // Find and map the admin of each organization group
      const adminsMap = new Map<string, { id: string; name: string; email: string }>();
      users.forEach((u) => {
        if (u.role === 'admin' && u.groupId) {
          adminsMap.set(u.groupId, { id: u.id, name: u.name, email: u.email });
        }
      });

      users.forEach((u: any) => {
        if (u.role !== 'admin' && u.role !== 'superadmin' && u.groupId) {
          u.admin = adminsMap.get(u.groupId) || null;
        }
      });

      return users;
    });

    await this.redis.set(cacheKey, resultData, 60);
    return resultData;
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

  private async invalidateCaches(groupId?: string | null, userId?: string) {
    if (userId) await this.redis.del(`users:${userId}`);
    if (groupId) {
      await this.redis.delByPattern(`users:group:${groupId}:*`);
    }
    await this.redis.delByPattern('users:*');
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
      // Admin can create staff, security, accountant, auditor, editor, or members (cannot create superadmin)
      const allowedAdminRoles = ['member', 'staff', 'security', 'accountant', 'auditor', 'editor', 'admin'];
      role = dto.role && allowedAdminRoles.includes(dto.role) ? dto.role : 'member';
    } else if (currentUserRole === 'superadmin') {
      role = dto.role || 'admin';

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

    const targetEmail = dto.email.toLowerCase().trim();

    // =========================================================================
    // KURAL 1: Site Yöneticisi e-postası ile Daire Sakini kaydedilemez!
    // =========================================================================
    if (role === 'member') {
      const adminExists = await this.dataSource.query(
        `SELECT id, role, email FROM users WHERE LOWER(email) = $1 AND role IN ('admin', 'superadmin') LIMIT 1`,
        [targetEmail]
      );
      if (adminExists && adminExists.length > 0) {
        throw new BadRequestException(
          `Bu e-posta adresi (${targetEmail}) site yöneticisi olarak kayıtlıdır. Yönetici hesabı daire sakini olarak kaydedilemez.`
        );
      }

      // =========================================================================
      // KURAL 2: Aynı e-postaya birden fazla daire atanabilir (Bir kişinin birden fazla dairesi olabilir)
      // =========================================================================
      const existingResidents = await this.dataSource.query(
        `SELECT id, name, email, phone, units, "residentType" FROM users WHERE LOWER(email) = $1 AND group_id = $2 AND role = 'member' LIMIT 1`,
        [targetEmail, activeGroupId]
      );

      if (existingResidents && existingResidents.length > 0) {
        const existingResident = existingResidents[0];
        const existingUnits: string[] = existingResident.units
          ? (typeof existingResident.units === 'string' ? existingResident.units.split(',') : existingResident.units)
          : [];
        const incomingUnits: string[] = dto.units && dto.units.length > 0 ? dto.units : [dto.name];
        const mergedUnits = Array.from(new Set([...existingUnits, ...incomingUnits].map((u) => u.trim()).filter(Boolean)));

        const newName = dto.name && !dto.name.toLowerCase().startsWith('daire') ? formatFullName(dto.name) : existingResident.name;
        const newPhone = dto.phone ? dto.phone.trim() : existingResident.phone;
        const newResidentType = dto.residentType || existingResident.residentType || 'owner';

        await this.dataSource.query(
          `UPDATE users SET name = $1, phone = $2, "residentType" = $3, units = $4, "updatedAt" = NOW() WHERE id = $5`,
          [newName, newPhone, newResidentType, mergedUnits.join(','), existingResident.id]
        );

        await this.invalidateCaches(activeGroupId, existingResident.id);
        return await this.findOne(existingResident.id, activeGroupId);
      }
    } else if (role === 'admin') {
      const adminExists = await this.dataSource.query(
        `SELECT id FROM users WHERE LOWER(email) = $1 AND role IN ('admin', 'superadmin') LIMIT 1`,
        [targetEmail]
      );
      if (adminExists && adminExists.length > 0) {
        throw new BadRequestException(
          `Bu e-posta adresi (${targetEmail}) zaten bir yönetici hesabı olarak kayıtlıdır.`
        );
      }
    }

    // Default password if none provided so they can log in
    const rawPassword = dto.password || (role === 'admin' ? 'Admin123!' : 'User123!');

    const newUser = await this.executeWithRLS(activeGroupId, async (repo) => {
      const user = repo.create({
        groupId: activeGroupId,
        name: formatFullName(dto.name),
        email: targetEmail,
        phone: dto.phone,
        units: dto.units && dto.units.length > 0 ? dto.units : (role === 'member' ? [dto.name] : undefined),
        residentType: role === 'member' ? (dto.residentType || 'owner') : undefined,
        password: this.hashPassword(rawPassword),
        role,
        isActive: true,
      });
      return await repo.save(user);
    });

    await this.invalidateCaches(activeGroupId, newUser.id);
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

    // Pre-check for any admin emails
    const emails = dtos.map((d) => d.email.toLowerCase().trim());
    if (emails.length > 0) {
      const adminMatches = await this.dataSource.query(
        `SELECT email FROM users WHERE LOWER(email) = ANY($1) AND role IN ('admin', 'superadmin')`,
        [emails]
      );
      if (adminMatches && adminMatches.length > 0) {
        const found = adminMatches.map((m: any) => m.email).join(', ');
        throw new BadRequestException(
          `Belirtilen e-posta(lar) (${found}) site yöneticisi olarak kayıtlıdır. Yönetici hesabı daire sakini olarak eklenemez.`
        );
      }
    }

    // Merge multiple units per resident email in memory
    const groupedByEmail = new Map<string, CreateUserDto>();
    for (const dto of dtos) {
      const normEmail = dto.email.toLowerCase().trim();
      if (groupedByEmail.has(normEmail)) {
        const existing = groupedByEmail.get(normEmail)!;
        const currentUnits = existing.units && existing.units.length > 0 ? existing.units : [existing.name];
        const newUnits = dto.units && dto.units.length > 0 ? dto.units : [dto.name];
        existing.units = Array.from(new Set([...currentUnits, ...newUnits]));
        if (!existing.phone && dto.phone) existing.phone = dto.phone;
      } else {
        groupedByEmail.set(normEmail, {
          ...dto,
          email: normEmail,
          units: dto.units && dto.units.length > 0 ? dto.units : [dto.name],
        });
      }
    }

    const mergedDtos = Array.from(groupedByEmail.values());

    const createdUsers = await this.executeWithRLS(activeGroupId, async (repo) => {
      const entities = mergedDtos.map((dto) => {
        const rawPassword = dto.password || 'User123!';
        return repo.create({
          groupId: activeGroupId,
          name: formatFullName(dto.name),
          email: dto.email,
          phone: dto.phone,
          units: dto.units,
          residentType: dto.residentType || 'owner',
          password: this.hashPassword(rawPassword),
          role: 'member',
          isActive: true,
        });
      });
      return await repo.save(entities);
    });

    await this.invalidateCaches(activeGroupId);
    return createdUsers;
  }

  async update(id: string, dto: UpdateUserDto, tenantGroupId?: string): Promise<UserEntity> {
    const user = await this.findOne(id, tenantGroupId);
    const activeGroupId = user.groupId || undefined;

    if (dto.email !== undefined && dto.email.trim()) {
      const targetEmail = dto.email.toLowerCase().trim();

      if (user.role === 'member') {
        // KURAL 1: Yönetici e-postası daire sakini olarak atanamaz
        const adminExists = await this.dataSource.query(
          `SELECT id, role FROM users WHERE LOWER(email) = $1 AND role IN ('admin', 'superadmin') LIMIT 1`,
          [targetEmail]
        );
        if (adminExists && adminExists.length > 0) {
          throw new BadRequestException(
            `Bu e-posta adresi (${targetEmail}) site yöneticisi olarak kayıtlıdır. Yönetici hesabı daire sakini olarak atanamaz.`
          );
        }

        // KURAL 2: Aynı e-postaya birden fazla daire atanabilir (Aynı sakin sitede başka bir daireye de sahipse birleştirilir)
        const otherResidents = await this.dataSource.query(
          `SELECT id, name, email, phone, units, "residentType" FROM users WHERE LOWER(email) = $1 AND group_id = $2 AND role = 'member' AND id != $3 LIMIT 1`,
          [targetEmail, activeGroupId, id]
        );

        if (otherResidents && otherResidents.length > 0) {
          const targetResident = otherResidents[0];
          const targetUnits: string[] = targetResident.units
            ? (typeof targetResident.units === 'string' ? targetResident.units.split(',') : targetResident.units)
            : [];
          const currentUnits: string[] = user.units && user.units.length > 0 ? user.units : [user.name];
          const mergedUnits = Array.from(new Set([...targetUnits, ...currentUnits].map((u) => u.trim()).filter(Boolean)));

          const newName = dto.name && !dto.name.toLowerCase().startsWith('daire') ? formatFullName(dto.name) : targetResident.name;
          const newPhone = dto.phone ? dto.phone.trim() : (targetResident.phone || user.phone);
          const newResidentType = dto.residentType || targetResident.residentType || 'owner';

          // 1. Hedef sakin kaydına bu daireyi de ekle
          if (dto.password && dto.password.trim()) {
            await this.dataSource.query(
              `UPDATE users SET name = $1, phone = $2, "residentType" = $3, units = $4, password = $5, "updatedAt" = NOW() WHERE id = $6`,
              [newName, newPhone, newResidentType, mergedUnits.join(','), this.hashPassword(dto.password.trim()), targetResident.id]
            );
          } else {
            await this.dataSource.query(
              `UPDATE users SET name = $1, phone = $2, "residentType" = $3, units = $4, "updatedAt" = NOW() WHERE id = $5`,
              [newName, newPhone, newResidentType, mergedUnits.join(','), targetResident.id]
            );
          }

          // 2. Bu boş daireye ait geçmiş borç ve ödeme kayıtlarını asıl sakine devret
          await this.dataSource.query(
            `UPDATE debts SET user_id = $1 WHERE user_id = $2`,
            [targetResident.id, user.id]
          );
          await this.dataSource.query(
            `UPDATE payments SET user_id = $1 WHERE user_id = $2`,
            [targetResident.id, user.id]
          );

          // 3. Birleştirilen boş placeholder kaydı sil
          await this.dataSource.query(`DELETE FROM users WHERE id = $1`, [user.id]);

          await this.invalidateCaches(activeGroupId, targetResident.id);
          await this.invalidateCaches(activeGroupId, user.id);

          return await this.findOne(targetResident.id, activeGroupId);
        }
      }

      user.email = targetEmail;
    }

    if (dto.name !== undefined && dto.name.trim()) user.name = formatFullName(dto.name.trim());
    if (dto.phone !== undefined) user.phone = dto.phone.trim() || undefined;
    if (dto.password !== undefined && dto.password.trim()) {
      user.password = this.hashPassword(dto.password.trim());
    }
    if (dto.residentType !== undefined) user.residentType = dto.residentType;
    if (dto.units !== undefined && dto.units.length > 0) user.units = dto.units;
    if (dto.role && user.role !== 'superadmin') user.role = dto.role;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    const saved = await this.usersRepo.save(user);
    await this.invalidateCaches(activeGroupId, id);
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

    await this.invalidateCaches(user.groupId, user.id);
    return (res.affected ?? 0) > 0;
  }
}
