import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicketEntity } from './support-ticket.entity';
import { GroupEntity } from '../groups/group.entity';
import { AuditLogsService } from '../audit/audit-logs.service';
import {
  CreateSupportTicketDto,
  AddSupportTicketMessageDto,
  SupportTicketStatus,
  SupportTicketMessage,
} from '@sitera/shared';

@Injectable()
export class SupportService implements OnModuleInit {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @InjectRepository(SupportTicketEntity)
    private readonly ticketRepo: Repository<SupportTicketEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupRepo: Repository<GroupEntity>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async onModuleInit() {
    await this.seedSampleTickets();
  }

  private async seedSampleTickets() {
    try {
      const count = await this.ticketRepo.count();
      if (count >= 3) return;

      const groups = await this.groupRepo.find({ take: 3 });
      const group1 = groups[0] || { id: '00000000-0000-0000-0000-000000000001', name: 'Gencosman Apartmanı', slug: 'gencosman-apartmani' };
      const group2 = groups[1] || group1;
      const group3 = groups[2] || group1;

      const samples: Partial<SupportTicketEntity>[] = [
        {
          id: 'TKT-1049',
          groupId: group1.id,
          groupName: group1.name,
          groupSlug: group1.slug,
          creatorUserId: 'usr-admin-1',
          creatorName: 'Ahmet Yılmaz (Yönetici)',
          creatorEmail: 'yonetim@gencosman.com',
          creatorPhone: '0532 555 12 34',
          subject: 'Eylül 2026 Aidat Tahakkuku Gecikme Zammı Hesabı',
          category: 'finance_error',
          priority: 'high',
          status: 'open',
          allowSiteAccess: true, // KVKK onaylı
          accessGrantedUntil: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          messages: [
            {
              id: 'msg-1',
              senderRole: 'tenant_admin',
              senderName: 'Ahmet Yılmaz',
              senderUserId: 'usr-admin-1',
              content:
                'Merhabalar, Eylül dönemi aidatlarını dağıtırken Daire 4 için gecikme zammı %5 yerine %0 hesaplandı. Parametreyi kontrol edip düzeltebilir misiniz? Site paneline müdahale izni verdim.',
              createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
            },
          ],
          lastInteractedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        },
        {
          id: 'TKT-1050',
          groupId: group2.id,
          groupName: group2.name,
          groupSlug: group2.slug,
          creatorUserId: 'usr-admin-2',
          creatorName: 'Mehmet Kaya (Yönetici)',
          creatorEmail: 'yonetim@siteraplaza.com',
          creatorPhone: '0533 444 88 99',
          subject: 'Plaka Tanıma & Bariyer Entegrasyon Hatası',
          category: 'access_hardware',
          priority: 'high',
          status: 'in_progress',
          allowSiteAccess: true,
          accessGrantedUntil: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          messages: [
            {
              id: 'msg-1050-1',
              senderRole: 'tenant_admin',
              senderName: 'Mehmet Kaya',
              senderUserId: 'usr-admin-2',
              content:
                'Ana giriş bariyerine bağlı ANPR kamerası 34 BJK 1903 plakalı kayıtlı aracı okumasına rağmen röle tetiklenmedi. Donanım webhook ayarlarını kontrol edebilir misiniz?',
              createdAt: new Date(Date.now() - 7200 * 1000).toISOString(),
            },
            {
              id: 'msg-1050-2',
              senderRole: 'superadmin',
              senderName: 'Süper Yönetici (Teknik Destek)',
              senderUserId: 'usr-superadmin',
              content:
                'Merhaba Mehmet Bey, talebiniz incelemeye alındı. IP kamera bağlantı portunu test ediyoruz.',
              createdAt: new Date(Date.now() - 1800 * 1000).toISOString(),
            },
          ],
          lastInteractedAt: new Date(Date.now() - 1800 * 1000).toISOString(),
        },
        {
          id: 'TKT-1051',
          groupId: group3.id,
          groupName: group3.name,
          groupSlug: group3.slug,
          creatorUserId: 'usr-admin-3',
          creatorName: 'Selin Akın (Yönetici)',
          creatorEmail: 'yonetim@camlicakonaklari.com',
          creatorPhone: '0544 333 22 11',
          subject: '2025 Yılı Denetim Raporu ve Bilanço İndirme',
          category: 'general',
          priority: 'normal',
          status: 'resolved',
          allowSiteAccess: false,
          resolvedAt: new Date(Date.now() - 12000 * 1000).toISOString(),
          resolvedBy: 'Süper Yönetici',
          messages: [
            {
              id: 'msg-1051-1',
              senderRole: 'tenant_admin',
              senderName: 'Selin Akın',
              senderUserId: 'usr-admin-3',
              content: '2025 yılına ait denetim kurulu raporunu Excel formatında nereden indirebilirim?',
              createdAt: new Date(Date.now() - 14400 * 1000).toISOString(),
            },
            {
              id: 'msg-1051-2',
              senderRole: 'superadmin',
              senderName: 'Süper Yönetici',
              senderUserId: 'usr-superadmin',
              content: 'Merhaba Selin Hanım, Mali Raporlar sekmesinden "Dönem Seçimi: 2025" yaparak sağ üstteki "Excel İndir" butonuna tıklayabilirsiniz.',
              createdAt: new Date(Date.now() - 12000 * 1000).toISOString(),
            },
          ],
          lastInteractedAt: new Date(Date.now() - 12000 * 1000).toISOString(),
        },
      ];

      for (const sample of samples) {
        const existing = await this.ticketRepo.findOne({ where: { id: sample.id } });
        if (!existing) {
          const entity = this.ticketRepo.create(sample);
          await this.ticketRepo.save(entity);
        }
      }

      this.logger.log('Platform support tickets seeded successfully');
    } catch (err: any) {
      this.logger.warn(`Could not seed support tickets: ${err.message}`);
    }
  }

  async getTickets(groupId?: string, isSuperAdmin?: boolean) {
    if (isSuperAdmin || !groupId) {
      return this.ticketRepo.find({
        order: { lastInteractedAt: 'DESC' },
      });
    }

    return this.ticketRepo.find({
      where: { groupId },
      order: { lastInteractedAt: 'DESC' },
    });
  }

  async getTicketById(id: string) {
    const ticket = await this.ticketRepo.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Destek talebi bulunamadı: ${id}`);
    }
    return ticket;
  }

  async createTicket(dto: CreateSupportTicketDto) {
    // Sitenin bilgilerini groupRepo'dan doğrula
    let groupName = dto.groupName;
    let groupSlug = dto.groupSlug;

    if (!groupName || !groupSlug) {
      const g = await this.groupRepo.findOne({ where: { id: dto.groupId } });
      if (g) {
        groupName = g.name;
        groupSlug = g.slug;
      }
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `TKT-${randomSuffix}`;

    const now = new Date().toISOString();
    const accessGrantedUntil = dto.allowSiteAccess
      ? new Date(Date.now() + 48 * 3600 * 1000).toISOString()
      : undefined;

    const initialMessage: SupportTicketMessage = {
      id: `msg-${Date.now()}`,
      senderRole: 'tenant_admin',
      senderName: dto.creatorName,
      senderUserId: dto.creatorUserId,
      content: dto.initialMessage,
      createdAt: now,
    };

    const ticket = this.ticketRepo.create({
      id: ticketId,
      groupId: dto.groupId,
      groupName: groupName || 'Site Yönetimi',
      groupSlug: groupSlug || 'site',
      creatorUserId: dto.creatorUserId,
      creatorName: dto.creatorName,
      creatorEmail: dto.creatorEmail,
      creatorPhone: dto.creatorPhone,
      subject: dto.subject,
      category: dto.category,
      priority: dto.priority || 'normal',
      status: 'open',
      allowSiteAccess: dto.allowSiteAccess,
      accessGrantedUntil,
      messages: [initialMessage],
      lastInteractedAt: now,
    });

    const saved = await this.ticketRepo.save(ticket);

    // KVKK & Güvenlik Logu
    await this.auditLogsService.log({
      groupId: dto.groupId,
      userId: dto.creatorUserId,
      userName: dto.creatorName,
      userRole: 'admin',
      action: 'SUPPORT_TICKET_CREATED',
      category: 'TICKET',
      level: 'INFO',
      resource: `SupportTicket:${ticketId}`,
      details: {
        subject: dto.subject,
        category: dto.category,
        allowSiteAccess: dto.allowSiteAccess,
      },
    });

    return saved;
  }

  async addMessage(id: string, dto: AddSupportTicketMessageDto) {
    const ticket = await this.getTicketById(id);
    const now = new Date().toISOString();

    const newMsg: SupportTicketMessage = {
      id: `msg-${Date.now()}`,
      senderRole: dto.senderRole,
      senderName: dto.senderName,
      senderUserId: dto.senderUserId,
      content: dto.content,
      attachments: dto.attachments,
      createdAt: now,
    };

    ticket.messages = [...(ticket.messages || []), newMsg];
    ticket.lastInteractedAt = now;

    // Süper admin cevap verdiğinde durumu otomatik "in_progress" veya "waiting_admin_action" yapabiliriz
    if (dto.senderRole === 'superadmin' && ticket.status === 'open') {
      ticket.status = 'in_progress';
    }

    return this.ticketRepo.save(ticket);
  }

  async updateStatus(id: string, status: SupportTicketStatus, resolvedBy?: string) {
    const ticket = await this.getTicketById(id);
    ticket.status = status;
    ticket.lastInteractedAt = new Date().toISOString();

    if (status === 'resolved' || status === 'closed') {
      ticket.resolvedAt = new Date().toISOString();
      ticket.resolvedBy = resolvedBy || 'Süper Admin';
      await this.groupRepo.update(ticket.groupId, {
        supportAccessActive: false,
        activeSupportTicketId: null,
      });
    }

    return this.ticketRepo.save(ticket);
  }

  async impersonateSite(ticketId: string, superAdminUser: { id: string; name: string }) {
    const ticket = await this.getTicketById(ticketId);

    if (!ticket.allowSiteAccess) {
      throw new ForbiddenException(
        'Site yöneticisi uzaktan sisteme müdahale izni (KVKK onayı) vermemiştir. Yalnızca mesajla destek verilebilir.',
      );
    }

    // 1. Sitede destek durumunu veritabanında aktif et
    await this.groupRepo.update(ticket.groupId, {
      supportAccessActive: true,
      supportAccessGrantedUntil: ticket.accessGrantedUntil || new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      activeSupportTicketId: ticket.id,
    });

    // 2. KVKK Uyarınca Denetim İzi (Audit Log)
    await this.auditLogsService.log({
      groupId: ticket.groupId,
      userId: superAdminUser.id,
      userName: superAdminUser.name,
      userRole: 'superadmin',
      action: 'SUPPORT_SESSION_START',
      category: 'SECURITY',
      level: 'SECURITY',
      resource: `SupportTicket:${ticket.id}`,
      details: {
        ticketId: ticket.id,
        reason: ticket.subject,
        targetGroup: ticket.groupName,
        kvkkConsentGranted: true,
        accessedAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      ticketId: ticket.id,
      targetGroupId: ticket.groupId,
      targetGroupSlug: ticket.groupSlug,
      targetGroupName: ticket.groupName,
      reason: ticket.subject,
      allowSiteAccess: true,
    };
  }

  async exitImpersonation(ticketId: string, superAdminUser: { id: string; name: string }) {
    const ticket = await this.getTicketById(ticketId);

    // KVKK Uyarınca Çıkış Denetim İzi (Audit Log)
    await this.auditLogsService.log({
      groupId: ticket.groupId,
      userId: superAdminUser.id,
      userName: superAdminUser.name,
      userRole: 'superadmin',
      action: 'SUPPORT_SESSION_END',
      category: 'SECURITY',
      level: 'INFO',
      resource: `SupportTicket:${ticket.id}`,
      details: {
        ticketId: ticket.id,
        targetGroup: ticket.groupName,
        exitedAt: new Date().toISOString(),
      },
    });

    await this.groupRepo.update(ticket.groupId, {
      supportAccessActive: false,
      activeSupportTicketId: null,
    });

    return { success: true };
  }
}
