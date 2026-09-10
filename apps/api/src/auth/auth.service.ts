import {
  Injectable,
  UnauthorizedException,
  OnApplicationBootstrap,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { UserEntity } from '../users/user.entity';
import { GroupEntity } from '../groups/group.entity';
import { RedisService } from '../redis/redis.service';
import { AuditLogsService } from '../audit/audit-logs.service';
import { LoginDto, AuthResponse, AuthUser } from '@sitera/shared';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  // In-memory session cache fallback when Redis is unavailable
  private readonly memorySessions = new Map<
    string,
    { userId: string; groupId?: string; email?: string; role?: string; name?: string; expiresAt: number }
  >();

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupsRepo: Repository<GroupEntity>,
    private readonly dataSource: DataSource,
    private readonly redis: RedisService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  /**
   * Hashes a password using PBKDF2 with a cryptographic salt
   */
  hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verifies password against stored salt:hash
   */
  verifyPassword(password: string, storedHash?: string): boolean {
    if (!storedHash) return false;
    if (!storedHash.includes(':')) {
      return password === storedHash; // legacy fallback if any
    }
    const [salt, key] = storedHash.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return key === hash;
  }

  async onApplicationBootstrap() {
    try {
      const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'admin@sitera.com').toLowerCase().trim();
      const superAdminPass = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!';

      // Query runner with bypass_rls to check super admin existence
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        await queryRunner.query(`SET LOCAL app.current_group_id = 'bypass_rls'`);
        const scopedRepo = queryRunner.manager.getRepository(UserEntity);
        const groupsRepo = queryRunner.manager.getRepository(GroupEntity);

        const existing = await scopedRepo.findOne({
          where: { email: superAdminEmail },
        });

        if (!existing) {
          this.logger.log(`👑 Süper Admin kullanıcısı tohumlanıyor (${superAdminEmail})...`);

          const superAdmin = scopedRepo.create({
            email: superAdminEmail,
            password: this.hashPassword(superAdminPass),
            name: 'Süper Yönetici',
            role: 'superadmin',
            groupId: null,
            isActive: true,
          });

          await scopedRepo.save(superAdmin);
          this.logger.log(`✅ Süper Admin başarıyla oluşturuldu! (Giriş: ${superAdminEmail})`);
        }
      } finally {
        await queryRunner.release();
      }
    } catch (err: any) {
      this.logger.warn(`Süper Admin tohumlama uyarısı: ${err.message}`);
    }
  }

  async login(
    dto: LoginDto,
    ipAddress = '127.0.0.1',
    userAgent = 'Web Client',
  ): Promise<AuthResponse> {
    const email = dto.email?.toLowerCase().trim();
    const password = dto.password || '';

    if (!email || !password) {
      throw new UnauthorizedException('E-posta ve şifre zorunludur.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    let user: UserEntity | null = null;

    try {
      await queryRunner.query(`SET LOCAL app.current_group_id = 'bypass_rls'`);
      const scopedRepo = queryRunner.manager.getRepository(UserEntity);

      user = await scopedRepo.createQueryBuilder('user')
        .addSelect('user.password')
        .leftJoinAndSelect('user.group', 'group')
        .where('LOWER(user.email) = :email', { email })
        .getOne();
    } finally {
      await queryRunner.release();
    }

    if (!user || !user.isActive) {
      await this.auditLogsService.recordLog({
        groupId: user?.groupId || undefined,
        userId: user?.id || null,
        userName: user?.name || email,
        userRole: user?.role || 'guest',
        action: 'AUTH_LOGIN_FAILED',
        category: 'AUTH',
        level: 'WARN',
        resource: email,
        details: { email, reason: !user ? 'Kullanıcı bulunamadı' : 'Hesap pasif durumda' },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    const isValid = this.verifyPassword(password, user.password);
    if (!isValid) {
      await this.auditLogsService.recordLog({
        groupId: user.groupId || undefined,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'AUTH_LOGIN_FAILED',
        category: 'AUTH',
        level: 'WARN',
        resource: email,
        details: { email, reason: 'Hatalı şifre' },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    // Generate secure session token
    const token = `sitera_tok_${crypto.randomBytes(32).toString('hex')}`;
    const sessionData = {
      userId: user.id,
      groupId: user.groupId || undefined,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    // Store in Redis (TTL: 24 hours)
    await this.redis.set(`session:${token}`, sessionData, 86400);

    // In-memory fallback
    this.memorySessions.set(token, {
      ...sessionData,
      expiresAt: Date.now() + 86400 * 1000,
    });

    // Record login success in Audit Log
    const roleLabel =
      user.role === 'admin'
        ? 'Site Yöneticisi'
        : user.role === 'superadmin'
        ? 'Süper Admin'
        : 'Sakin';

    await this.auditLogsService.recordLog({
      groupId: user.groupId || undefined,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'AUTH_LOGIN_SUCCESS',
      category: 'AUTH',
      level: 'INFO',
      resource: `${user.name} (${roleLabel})`,
      details: {
        email: user.email,
        role: user.role,
        units: user.units,
        groupName: user.group?.name || undefined,
      },
      ipAddress,
      userAgent,
    });

    const authUser: AuthUser = {
      id: user.id,
      groupId: user.groupId || null,
      group: user.group || null,
      name: user.name,
      email: user.email,
      role: user.role,
      units: user.units || [],
      residentType: user.residentType || 'owner',
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
    };

    return {
      token,
      user: authUser,
    };
  }

  async getMe(token: string): Promise<AuthUser> {
    if (!token) {
      throw new UnauthorizedException('Oturum bulunamadı.');
    }

    const cleanToken = token.replace('Bearer ', '').trim();
    let session = await this.redis.get<{ userId: string; groupId?: string }>(`session:${cleanToken}`);

    if (!session) {
      const mem = this.memorySessions.get(cleanToken);
      if (mem && mem.expiresAt > Date.now()) {
        session = { userId: mem.userId, groupId: mem.groupId || undefined };
      }
    }

    if (!session) {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş oturum.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(`SET LOCAL app.current_group_id = 'bypass_rls'`);
      const scopedRepo = queryRunner.manager.getRepository(UserEntity);

      const user = await scopedRepo.findOne({
        where: { id: session.userId },
        relations: ['group'],
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Kullanıcı hesabı aktif değil veya bulunamadı.');
      }

      return {
        id: user.id,
        groupId: user.groupId || null,
        group: user.group || null,
        name: user.name,
        email: user.email,
        role: user.role,
        units: user.units || [],
        residentType: user.residentType || 'owner',
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
      };
    } finally {
      await queryRunner.release();
    }
  }

  async logout(token: string, ipAddress = '127.0.0.1', userAgent = 'Sitera Web Client'): Promise<boolean> {
    if (!token) return true;
    const cleanToken = token.replace('Bearer ', '').trim();

    let session = await this.redis.get<any>(`session:${cleanToken}`);
    if (!session) {
      session = this.memorySessions.get(cleanToken);
    }

    if (session) {
      const roleLabel =
        session.role === 'admin'
          ? 'Site Yöneticisi'
          : session.role === 'superadmin'
          ? 'Süper Admin'
          : 'Sakin';

      await this.auditLogsService.recordLog({
        groupId: session.groupId,
        userId: session.userId,
        userName: session.name || session.email || 'Kullanıcı',
        userRole: session.role || 'user',
        action: 'AUTH_LOGOUT',
        category: 'AUTH',
        level: 'INFO',
        resource: `${session.name || session.email} (${roleLabel})`,
        details: {
          email: session.email,
          role: session.role,
          userId: session.userId,
        },
        ipAddress,
        userAgent,
      });
    }

    await this.redis.del(`session:${cleanToken}`);
    this.memorySessions.delete(cleanToken);
    return true;
  }
}
