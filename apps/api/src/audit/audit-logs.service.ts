import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AuditLogEntity } from './audit-log.entity';
import { GroupEntity } from '../groups/group.entity';
import { AuditLogCategory, AuditLogLevel } from '@sitera/shared';
import { TenantContext } from '../tenancy/tenant.context';

export interface LogParams {
  groupId?: string | null;
  userId?: string | null;
  userName?: string | null;
  userRole?: string | null;
  action: string;
  category: AuditLogCategory;
  level?: AuditLogLevel;
  resource?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditLogsService implements OnModuleInit {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupsRepo: Repository<GroupEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.seedInitialLogs();
  }

  private async resolveGroupId(providedGroupId?: string): Promise<string> {
    const activeId = providedGroupId || TenantContext.getGroupId();
    if (activeId) return activeId;
    const defaultGroup = await this.groupsRepo.findOne({ where: {} });
    return defaultGroup ? defaultGroup.id : '';
  }

  private async executeWithRLS<T>(
    groupId: string | undefined,
    operation: (qr: any) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      if (groupId) {
        await queryRunner.query(`SET LOCAL app.current_group_id = '${groupId}'`);
      } else {
        await queryRunner.query(`SET LOCAL app.current_group_id = 'bypass_rls'`);
      }
      return await operation(queryRunner);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Log any system, user, or business event
   */
  async log(params: LogParams): Promise<AuditLogEntity> {
    return this.recordLog(params);
  }

  async recordLog(params: LogParams): Promise<AuditLogEntity> {
    const gid = params.groupId ? await this.resolveGroupId(params.groupId) : undefined;

    try {
      return await this.executeWithRLS(gid, async (qr) => {
        const repo = qr.manager.getRepository(AuditLogEntity);
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validUserId = params.userId && UUID_REGEX.test(params.userId) ? params.userId : null;

        const log = repo.create({
          groupId: gid || (null as any),
          userId: validUserId,
          userName: params.userName || 'Sistem',
          userRole: params.userRole || 'admin',
          action: params.action,
          category: params.category,
          level: params.level || 'INFO',
          resource: params.resource || null,
          details: {
            ...(params.details || {}),
            ...(params.userId && !validUserId ? { rawUserId: params.userId } : {}),
          },
          ipAddress: params.ipAddress || '127.0.0.1',
          userAgent: params.userAgent || 'Sitera Client',
        });

        try {
          return await repo.save(log);
        } catch (saveErr: any) {
          if (log.userId) {
            log.details = { ...(log.details || {}), unlinkedUserId: log.userId };
            log.userId = null;
            return await repo.save(log);
          }
          throw saveErr;
        }
      });
    } catch (err: any) {
      this.logger.warn(`Audit log kaydedilirken hata oluştu (${params.action}): ${err.message}`);
      return null as any;
    }
  }

  /**
   * Fetch audit logs for a tenant group or platform
   */
  async getLogs(
    groupId?: string,
    category?: string,
    search?: string,
    limit = 100,
  ): Promise<AuditLogEntity[]> {
    const gid = groupId ? await this.resolveGroupId(groupId) : undefined;

    return await this.executeWithRLS(gid, async (qr) => {
      const repo = qr.manager.getRepository(AuditLogEntity);
      const qb = repo.createQueryBuilder('log')
        .orderBy('log.createdAt', 'DESC')
        .take(limit);

      if (gid) {
        qb.where('log.groupId = :gid', { gid });
      }

      if (category && category !== 'ALL') {
        qb.andWhere('log.category = :category', { category });
      }

      if (search && search.trim()) {
        qb.andWhere(
          '(log.action ILIKE :search OR log.userName ILIKE :search OR log.resource ILIKE :search)',
          { search: `%${search.trim()}%` },
        );
      }

      return await qb.getMany();
    });
  }

  private async seedInitialLogs() {
    try {
      const count = await this.auditRepo.count();
      if (count > 0) return;

      const group = await this.groupsRepo.findOne({ where: {} });
      if (!group) return;

      const seedEvents: Partial<AuditLogEntity>[] = [
        {
          groupId: group.id,
          userName: 'Yönetici (Çağatay Dalaman)',
          userRole: 'admin',
          action: 'RLS_ISOLATION_ENABLED',
          category: 'SECURITY',
          level: 'SECURITY',
          resource: 'PostgreSQL Sitera DB',
          details: { policy: 'tenant_isolation_policy', enforced: true },
          ipAddress: '192.168.1.102',
        },
        {
          groupId: group.id,
          userName: 'Yönetici (Çağatay Dalaman)',
          userRole: 'admin',
          action: 'AUTH_LOGIN_SUCCESS',
          category: 'AUTH',
          level: 'INFO',
          resource: 'Admin Portal',
          details: { method: 'password', browser: 'Chrome Mac OS' },
          ipAddress: '192.168.1.102',
        },
        {
          groupId: group.id,
          userName: 'Yönetici (Çağatay Dalaman)',
          userRole: 'admin',
          action: 'EXPENSE_SPLIT_CREATED',
          category: 'EXPENSE',
          level: 'INFO',
          resource: 'Gider & Masraf Dağıtımı',
          details: { title: 'Çatı İzolasyon ve Onarımı', amount: 40000, targetRole: 'owner' },
          ipAddress: '192.168.1.102',
        },
        {
          groupId: group.id,
          userName: 'Çağatay Dalaman (Daire 6)',
          userRole: 'resident',
          action: 'PAYMENT_FAST_SUBMITTED',
          category: 'FINANCE',
          level: 'INFO',
          resource: 'FAST-848264',
          details: { amount: 6666.67, channel: 'bank_transfer', unit: 'Daire 6', hasReceipt: true },
          ipAddress: '192.168.1.105',
        },
        {
          groupId: group.id,
          userName: 'Yönetici (Çağatay Dalaman)',
          userRole: 'admin',
          action: 'PAYMENT_APPROVED',
          category: 'FINANCE',
          level: 'INFO',
          resource: 'Daire 6 Tahsilatı',
          details: { referenceNo: 'FAST-848264', amount: 6666.67, account: 'Ziraat Bankası' },
          ipAddress: '192.168.1.102',
        },
      ];

      for (const ev of seedEvents) {
        await this.auditRepo.save(this.auditRepo.create(ev));
      }
      this.logger.log('✅ Audit log başlangıç güvenlik hareketleri başarıyla tohumlandı.');
    } catch (err: any) {
      this.logger.warn(`Audit log seed uyarısı: ${err.message}`);
    }
  }
}
