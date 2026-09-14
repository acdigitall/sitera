import { Injectable, NotFoundException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TicketEntity } from './ticket.entity';
import { GroupEntity } from '../groups/group.entity';
import { UserEntity } from '../users/user.entity';
import {
  CreateTicketDto,
  UpdateTicketStatusDto,
  validateDataUri,
  MAX_PHOTO_SIZE_BYTES,
  PHOTO_ALLOWED_MIME_TYPES,
  MAX_TICKET_PHOTOS_COUNT,
} from '@sitera/shared';
import { TenantContext } from '../tenancy/tenant.context';
import { AuditLogsService } from '../audit/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TicketsService implements OnModuleInit {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @InjectRepository(TicketEntity)
    private readonly ticketsRepo: Repository<TicketEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupsRepo: Repository<GroupEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    await this.seedInitialTickets();
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
   * Create a new resident issue ticket
   */
  async createTicket(dto: CreateTicketDto, user: any, groupId?: string): Promise<TicketEntity> {
    const gid = await this.resolveGroupId(groupId || user?.groupId);

    // 1. Photo validation & security scan
    if (dto.photos && dto.photos.length > 0) {
      if (dto.photos.length > MAX_TICKET_PHOTOS_COUNT) {
        throw new BadRequestException(
          `Bir talep için en fazla ${MAX_TICKET_PHOTOS_COUNT} adet fotoğraf yükleyebilirsiniz.`,
        );
      }

      for (let i = 0; i < dto.photos.length; i++) {
        const photo = dto.photos[i];
        const validation = validateDataUri(photo, {
          maxSizeBytes: MAX_PHOTO_SIZE_BYTES,
          allowedMimeTypes: PHOTO_ALLOWED_MIME_TYPES,
          scanMaliciousSignatures: true,
        });

        if (!validation.isValid) {
          throw new BadRequestException(
            `Fotoğraf (${i + 1}) güvenlik doğrulamasından geçemedi: ${validation.error}`,
          );
        }
      }
    }

    return await this.executeWithRLS(gid, async (qr) => {
      const repo = qr.manager.getRepository(TicketEntity);
      const ticket = repo.create({
        groupId: gid,
        userId: user?.id || null,
        unit: dto.unit || user?.name || 'Daire',
        residentName: dto.residentName || user?.name || 'Sakin',
        residentPhone: dto.residentPhone || user?.phone || null,
        title: dto.title,
        description: dto.description,
        category: dto.category || 'Diğer',
        location: dto.location || null,
        urgency: dto.urgency || 'normal',
        photos: dto.photos || [],
        status: 'open',
      });

      const saved = await repo.save(ticket);

      // Audit Log event
      await this.auditLogsService.recordLog({
        groupId: gid,
        userId: user?.id,
        userName: dto.residentName,
        userRole: user?.role || 'resident',
        action: 'TICKET_CREATED',
        category: 'TICKET',
        level: 'INFO',
        resource: `${dto.unit} - ${dto.title}`,
        details: {
          ticketId: saved.id,
          category: dto.category,
          location: dto.location,
          urgency: dto.urgency,
          hasPhoto: (dto.photos && dto.photos.length > 0),
        },
      });

      return saved;
    });
  }

  /**
   * Get tickets for admin or resident
   */
  async getTickets(
    groupId?: string,
    userId?: string,
    unit?: string,
    isStaff = false,
  ): Promise<TicketEntity[]> {
    const gid = await this.resolveGroupId(groupId);

    return await this.executeWithRLS(gid, async (qr) => {
      const repo = qr.manager.getRepository(TicketEntity);
      const qb = repo.createQueryBuilder('ticket')
        .where('ticket.groupId = :gid', { gid })
        .orderBy('ticket.createdAt', 'DESC');

      // If regular resident, only show their own tickets
      if (!isStaff) {
        if (userId && unit && unit !== 'all') {
          qb.andWhere('(ticket.userId = :userId OR ticket.unit = :unit)', { userId, unit });
        } else if (userId) {
          qb.andWhere('ticket.userId = :userId', { userId });
        } else if (unit && unit !== 'all') {
          qb.andWhere('ticket.unit = :unit', { unit });
        }
      }

      return await qb.getMany();
    });
  }

  /**
   * Update ticket status and admin resolution note
   */
  async updateTicketStatus(
    id: string,
    dto: UpdateTicketStatusDto,
    adminUser: any,
    groupId?: string,
  ): Promise<TicketEntity> {
    const gid = await this.resolveGroupId(groupId || adminUser?.groupId);

    return await this.executeWithRLS(gid, async (qr) => {
      const repo = qr.manager.getRepository(TicketEntity);
      const ticket = await repo.findOne({ where: { id, groupId: gid } });

      if (!ticket) {
        throw new NotFoundException(`Talep bulunamadı: ${id}`);
      }

      ticket.status = dto.status;
      if (dto.adminNotes !== undefined) {
        ticket.adminNotes = dto.adminNotes;
      }
      if (dto.status === 'resolved' || dto.status === 'closed') {
        ticket.resolvedAt = new Date().toISOString();
      }

      const saved = await repo.save(ticket);

      // In-app Notification for resident
      try {
        let recipientId = ticket.userId;
        if (!recipientId && ticket.unit) {
          const residentUser = await this.usersRepo
            .createQueryBuilder('user')
            .where('user.groupId = :gid', { gid })
            .andWhere('(:unit = ANY(string_to_array(user.units, \',\')) OR user.name = :unit)', {
              unit: ticket.unit,
            })
            .getOne();
          recipientId = residentUser?.id;
        }

        if (recipientId) {
          const isResolved = dto.status === 'resolved' || dto.status === 'closed';
          const title = dto.adminNotes
            ? 'Yönetici Çözüm Notu Yazdı'
            : isResolved
            ? 'Talebiniz Çözüldü'
            : 'Talebiniz Güncellendi';

          let message = `"${ticket.title}" başlıklı talebiniz güncellendi.`;
          if (dto.adminNotes) {
            message = `"${ticket.title}" talebinize yönetici çözüm notu ekledi: "${dto.adminNotes}"`;
          } else if (isResolved) {
            message = `"${ticket.title}" talebiniz çözüldü olarak işaretlendi.`;
          }

          await this.notificationsService.createNotification(
            {
              userId: recipientId,
              title,
              message,
              type: 'ticket_update',
              priority: isResolved ? 'normal' : 'normal',
              linkUrl: '/portal/tickets',
              metadata: {
                ticketId: ticket.id,
                status: dto.status,
                adminNotes: dto.adminNotes,
              },
            },
            gid,
          );
        }
      } catch (notifyErr: any) {
        this.logger.warn(`Talep bildirim gönderme uyarısı: ${notifyErr.message}`);
      }

      // Audit Log event
      await this.auditLogsService.recordLog({
        groupId: gid,
        userId: adminUser?.id,
        userName: adminUser?.name || 'Yönetici',
        userRole: 'admin',
        action: 'TICKET_STATUS_UPDATED',
        category: 'TICKET',
        level: 'INFO',
        resource: `${ticket.unit} - ${ticket.title}`,
        details: {
          ticketId: ticket.id,
          newStatus: dto.status,
          adminNotes: dto.adminNotes,
        },
      });

      return saved;
    });
  }

  /**
   * Delete ticket
   */
  async deleteTicket(id: string, user: any, groupId?: string): Promise<{ success: boolean }> {
    const gid = await this.resolveGroupId(groupId || user?.groupId);

    return await this.executeWithRLS(gid, async (qr) => {
      const repo = qr.manager.getRepository(TicketEntity);
      const ticket = await repo.findOne({ where: { id, groupId: gid } });

      if (!ticket) {
        throw new NotFoundException(`Talep bulunamadı: ${id}`);
      }

      await repo.remove(ticket);

      await this.auditLogsService.recordLog({
        groupId: gid,
        userId: user?.id,
        userName: user?.name || 'Yönetici',
        userRole: user?.role || 'admin',
        action: 'TICKET_DELETED',
        category: 'TICKET',
        level: 'WARN',
        resource: `${ticket.unit} - ${ticket.title}`,
      });

      return { success: true };
    });
  }

  private async seedInitialTickets() {
    try {
      const count = await this.ticketsRepo.count();
      if (count > 0) return;

      const group = await this.groupsRepo.findOne({ where: {} });
      if (!group) return;

      const seedTicket: Partial<TicketEntity> = {
        groupId: group.id,
        unit: 'Daire 6',
        residentName: 'Çağatay Dalaman',
        residentPhone: '0532 999 8877',
        title: 'Arka bahçe çimleri çok uzadı',
        description: 'Arka bahçedeki çimler aşırı uzamış durumda, yürüyüş yolunu ve çocuk oyun alanını kapatıyor. Biçilmesi ve genel peyzaj bakımı rica olunur.',
        category: 'Peyzaj & Bahçe',
        location: 'Arka Bahçe / Çocuk Parkı Yanı',
        urgency: 'normal',
        photos: [],
        status: 'in_progress',
        adminNotes: 'Bahçıvana ve peyzaj firmasına talimat verildi, Cumartesi günü sabah çimler biçilecek.',
      };

      await this.ticketsRepo.save(this.ticketsRepo.create(seedTicket));
      this.logger.log('✅ Örnek talep & arıza bildirimi başarıyla tohumlandı.');
    } catch (err: any) {
      this.logger.warn(`Ticket seed uyarısı: ${err.message}`);
    }
  }
}
