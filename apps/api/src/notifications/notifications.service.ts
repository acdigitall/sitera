import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotificationEntity } from './notification.entity';
import { GroupEntity } from '../groups/group.entity';
import { UserEntity } from '../users/user.entity';
import { CreateNotificationDto, NotificationFilterDto } from '@sitera/shared';
import { TenantContext } from '../tenancy/tenant.context';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepo: Repository<NotificationEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupsRepo: Repository<GroupEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.seedInitialNotifications();
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
    if (typeof queryRunner.startTransaction === 'function') {
      await queryRunner.startTransaction();
    }
    try {
      if (groupId) {
        await queryRunner.query(`SET LOCAL app.current_group_id = '${groupId}'`);
      } else {
        await queryRunner.query(`SET LOCAL app.current_group_id = 'bypass_rls'`);
      }
      const result = await operation(queryRunner);
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

  /**
   * Create a single in-app notification
   */
  async createNotification(
    dto: CreateNotificationDto,
    groupId?: string,
  ): Promise<NotificationEntity> {
    const gid = await this.resolveGroupId(groupId);

    return await this.executeWithRLS(gid, async (qr) => {
      const repo = qr.manager.getRepository(NotificationEntity);
      const notification = repo.create({
        groupId: gid,
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: dto.type || 'system',
        priority: dto.priority || 'normal',
        isRead: false,
        linkUrl: dto.linkUrl || null,
        metadata: dto.metadata || {},
      });

      return await repo.save(notification);
    });
  }

  /**
   * Create multiple notifications at once (e.g. for targeted broadcast)
   */
  async createBulkNotifications(
    dtos: CreateNotificationDto[],
    groupId?: string,
  ): Promise<NotificationEntity[]> {
    if (dtos.length === 0) return [];
    const gid = await this.resolveGroupId(groupId);

    return await this.executeWithRLS(gid, async (qr) => {
      const repo = qr.manager.getRepository(NotificationEntity);
      const entities = dtos.map((dto) =>
        repo.create({
          groupId: gid,
          userId: dto.userId,
          title: dto.title,
          message: dto.message,
          type: dto.type || 'system',
          priority: dto.priority || 'normal',
          isRead: false,
          linkUrl: dto.linkUrl || null,
          metadata: dto.metadata || {},
        }),
      );

      return await repo.save(entities);
    });
  }

  /**
   * Get notifications for a user with unread count
   */
  async getUserNotifications(
    userId: string,
    groupId?: string,
    filter?: NotificationFilterDto,
  ): Promise<{ notifications: NotificationEntity[]; unreadCount: number }> {
    const gid = await this.resolveGroupId(groupId);

    return await this.executeWithRLS(gid, async (qr) => {
      const repo = qr.manager.getRepository(NotificationEntity);

      const qb = repo
        .createQueryBuilder('notification')
        .where('notification.groupId = :gid', { gid })
        .andWhere('notification.userId = :userId', { userId })
        .orderBy('notification.createdAt', 'DESC');

      if (filter?.unreadOnly) {
        qb.andWhere('notification.isRead = false');
      }

      if (filter?.type) {
        qb.andWhere('notification.type = :type', { type: filter.type });
      }

      const limit = filter?.limit || 50;
      const offset = filter?.offset || 0;
      qb.take(limit).skip(offset);

      const [notifications, unreadCount] = await Promise.all([
        qb.getMany(),
        repo.count({
          where: {
            groupId: gid,
            userId,
            isRead: false,
          },
        }),
      ]);

      return { notifications, unreadCount };
    });
  }

  /**
   * Get unread count for badge
   */
  async getUnreadCount(userId: string, groupId?: string): Promise<number> {
    const gid = await this.resolveGroupId(groupId);

    return await this.executeWithRLS(gid, async (qr) => {
      const repo = qr.manager.getRepository(NotificationEntity);
      return await repo.count({
        where: {
          groupId: gid,
          userId,
          isRead: false,
        },
      });
    });
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(
    notificationId: string,
    userId: string,
    groupId?: string,
  ): Promise<NotificationEntity> {
    const gid = await this.resolveGroupId(groupId);

    return await this.executeWithRLS(gid, async (qr) => {
      const repo = qr.manager.getRepository(NotificationEntity);
      const notification = await repo.findOne({
        where: { id: notificationId, userId, groupId: gid },
      });

      if (!notification) {
        throw new NotFoundException(`Bildirim bulunamadı: ${notificationId}`);
      }

      notification.isRead = true;
      notification.readAt = new Date().toISOString();
      return await repo.save(notification);
    });
  }

  /**
   * Mark all notifications for a user as read
   */
  async markAllAsRead(
    userId: string,
    groupId?: string,
  ): Promise<{ affected: number }> {
    const gid = await this.resolveGroupId(groupId);

    return await this.executeWithRLS(gid, async (qr) => {
      const repo = qr.manager.getRepository(NotificationEntity);
      const result = await repo
        .createQueryBuilder()
        .update(NotificationEntity)
        .set({
          isRead: true,
          readAt: new Date().toISOString(),
        })
        .where('groupId = :gid', { gid })
        .andWhere('userId = :userId', { userId })
        .andWhere('isRead = false')
        .execute();

      return { affected: result.affected || 0 };
    });
  }

  /**
   * Delete a notification
   */
  async deleteNotification(
    notificationId: string,
    userId: string,
    groupId?: string,
  ): Promise<{ success: boolean }> {
    const gid = await this.resolveGroupId(groupId);

    return await this.executeWithRLS(gid, async (qr) => {
      const repo = qr.manager.getRepository(NotificationEntity);
      const notification = await repo.findOne({
        where: { id: notificationId, userId, groupId: gid },
      });

      if (!notification) {
        throw new NotFoundException(`Bildirim bulunamadı: ${notificationId}`);
      }

      await repo.remove(notification);
      return { success: true };
    });
  }

  private async seedInitialNotifications() {
    try {
      const count = await this.notificationsRepo.count();
      if (count > 0) return;

      const group = await this.groupsRepo.findOne({ where: {} });
      if (!group) return;

      // Find any resident user
      const resident = await this.usersRepo.findOne({
        where: { groupId: group.id, role: 'member' },
      });
      if (!resident) return;

      const seedNotifications: Partial<NotificationEntity>[] = [
        {
          groupId: group.id,
          userId: resident.id,
          title: 'Yönetici Çözüm Notu Yazdı',
          message:
            '"Arka bahçe çimleri çok uzadı" başlıklı talebinize bina yönetimi çözüm notu ekledi: "Bahçıvana ve peyzaj firmasına talimat verildi, Cumartesi günü sabah çimler biçilecek."',
          type: 'ticket_update',
          priority: 'normal',
          isRead: false,
          linkUrl: '/portal/tickets',
          metadata: { ticketCategory: 'Peyzaj & Bahçe' },
        },
        {
          groupId: group.id,
          userId: resident.id,
          title: 'Ödemeniz Onaylandı',
          message:
            'Mart 2026 dönemi için ilettiğiniz 1.250 ₺ tutarındaki aidat ödeme dekontu yönetim tarafından incelenmiş ve onaylanmıştır.',
          type: 'payment_approval',
          priority: 'normal',
          isRead: false,
          linkUrl: '/portal/payments',
          metadata: { amount: 1250 },
        },
        {
          groupId: group.id,
          userId: resident.id,
          title: 'Yeni Duyuru: Aylık Bina & Tesis Bakımı',
          message:
            'Perşembe günü 10:00 - 13:00 saatleri arasında hidrofor ve asansör sistemlerinin rutin bakımı gerçekleştirilecektir.',
          type: 'announcement',
          priority: 'high',
          isRead: false,
          linkUrl: '/portal/announcements',
          metadata: { isImportant: true },
        },
      ];

      for (const item of seedNotifications) {
        await this.notificationsRepo.save(this.notificationsRepo.create(item));
      }

      this.logger.log('✅ Örnek uygulama içi bildirimler başarıyla tohumlandı.');
    } catch (err: any) {
      this.logger.warn(`Notification seed uyarısı: ${err.message}`);
    }
  }
}
