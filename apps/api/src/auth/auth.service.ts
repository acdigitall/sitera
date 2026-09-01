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
import { LoginDto, AuthResponse, AuthUser } from '@sitera/shared';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  // In-memory session cache fallback when Redis is unavailable
  private readonly memorySessions = new Map<string, { userId: string; expiresAt: number }>();

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupsRepo: Repository<GroupEntity>,
    private readonly dataSource: DataSource,
    private readonly redis: RedisService,
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

          // Ensure default group exists
          let defaultGroup = await groupsRepo.findOne({ where: { slug: 'sitera-tech' } });
          if (!defaultGroup) {
            defaultGroup = await groupsRepo.findOne({ order: { createdAt: 'ASC' } });
          }

          if (!defaultGroup) {
            defaultGroup = await groupsRepo.save({
              name: 'Sitera Teknoloji',
              slug: 'sitera-tech',
              plan: 'enterprise',
              isActive: true,
            });
          }

          const superAdmin = scopedRepo.create({
            email: superAdminEmail,
            password: this.hashPassword(superAdminPass),
            name: 'Süper Yönetici',
            role: 'superadmin',
            groupId: defaultGroup.id,
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

  async login(dto: LoginDto): Promise<AuthResponse> {
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
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    const isValid = this.verifyPassword(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    // Generate secure session token
    const token = `sitera_tok_${crypto.randomBytes(32).toString('hex')}`;
    const sessionData = {
      userId: user.id,
      groupId: user.groupId,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    // Store in Redis (TTL: 24 hours)
    await this.redis.set(`session:${token}`, sessionData, 86400);

    // In-memory fallback
    this.memorySessions.set(token, {
      userId: user.id,
      expiresAt: Date.now() + 86400 * 1000,
    });

    const authUser: AuthUser = {
      id: user.id,
      groupId: user.groupId,
      group: user.group,
      name: user.name,
      email: user.email,
      role: user.role,
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
    let session = await this.redis.get<{ userId: string; groupId: string }>(`session:${cleanToken}`);

    if (!session) {
      const mem = this.memorySessions.get(cleanToken);
      if (mem && mem.expiresAt > Date.now()) {
        session = { userId: mem.userId, groupId: '' };
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
        groupId: user.groupId,
        group: user.group,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
      };
    } finally {
      await queryRunner.release();
    }
  }

  async logout(token: string): Promise<boolean> {
    if (!token) return true;
    const cleanToken = token.replace('Bearer ', '').trim();
    await this.redis.del(`session:${cleanToken}`);
    this.memorySessions.delete(cleanToken);
    return true;
  }
}
