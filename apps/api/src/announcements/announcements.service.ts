import { Injectable, NotFoundException, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AnnouncementEntity } from './announcement.entity';
import { GroupEntity } from '../groups/group.entity';
import { UserEntity } from '../users/user.entity';
import {
  CreateAnnouncementDto,
  AnnouncementReadReceipt,
  AnnouncementReadStats,
} from '@sitera/shared';
import { TenantContext } from '../tenancy/tenant.context';
import { NotificationsService } from '../notifications/notifications.service';

export interface AnnouncementUserFilter {
  userId?: string;
  userRole?: string;
  units?: string[];
  residentType?: string;
}

@Injectable()
export class AnnouncementsService implements OnModuleInit {
  private readonly logger = new Logger(AnnouncementsService.name);

  constructor(
    @InjectRepository(AnnouncementEntity)
    private readonly announcementsRepo: Repository<AnnouncementEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupsRepo: Repository<GroupEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly dataSource: DataSource,
    @Optional()
    private readonly notificationsService?: NotificationsService,
  ) {}

  async onModuleInit() {
    // Clean up demo dummy announcements if present
    try {
      await this.announcementsRepo
        .createQueryBuilder()
        .delete()
        .from(AnnouncementEntity)
        .where('title IN (:...titles)', {
          titles: [
            'Aylık Bina & Tesis Bakımı Hakkında',
            'A Blok Asansör Revizyon & Yeşil Etiket Çalışması',
            'Yıllık Olağan Kat Malikleri Toplantı Çağrısı',
            'Giriş Güvenlik ve Kapı Kartları Güncellemesi',
          ],
        })
        .execute();
      this.logger.log('🧹 Örnek dummy duyurular temizlendi.');
    } catch {
      // ignore
    }

    if (process.env.NODE_ENV !== 'production') {
      await this.seedInitialAnnouncements();
    }
  }

  private resolveGroupId(providedGroupId?: string): string {
    const activeId = providedGroupId || TenantContext.getGroupId();
    return activeId || '';
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

  private async seedInitialAnnouncements() {
    try {
      const count = await this.announcementsRepo.count();
      if (count > 0) return;

      const firstGroup =
        (await this.groupsRepo.findOne({ where: { slug: 'acme-holding' } })) ||
        (await this.groupsRepo.findOne({ where: {} }));

      if (!firstGroup) return;

      const now = new Date();
      const futureDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

      const initialList = [
        this.announcementsRepo.create({
          groupId: firstGroup.id,
          title: 'Aylık Bina & Tesis Bakımı Hakkında',
          content:
            'Değerli bina sakinlerimiz, perşembe günü saat 10:00 - 13:00 arasında sitemizin ortak hidrofor ve asansör sistemlerinin rutin yıllık bakımı gerçekleştirilecektir. Bakım süresince kısa süreli su ve asansör kesintileri yaşanabilir.',
          category: 'Bakım',
          authorName: 'Bina Yönetimi',
          isImportant: true,
          targetScope: 'all',
          status: 'published',
          readReceipts: [
            {
              userId: 'seed-user-1',
              userName: 'Can Yurt',
              unit: 'Daire 1',
              readAt: new Date().toISOString(),
            },
            {
              userId: 'seed-user-2',
              userName: 'Ayşe Demir',
              unit: 'Daire 2',
              readAt: new Date().toISOString(),
            },
          ],
        }),
        this.announcementsRepo.create({
          groupId: firstGroup.id,
          title: 'A Blok Asansör Revizyon & Yeşil Etiket Çalışması',
          content:
            'A Blok sakinlerimizin dikkatine: A Blok yolcu asansöründe periyodik makine dairesi halat değişimi ve yeşil etiket muayenesi yapılacaktır. Çalışma yalnızca A Blok sakinlerini etkilemektedir.',
          category: 'Bakım',
          authorName: 'Teknik Servis',
          isImportant: true,
          targetScope: 'block',
          targetBlocks: ['A Blok'],
          status: 'published',
          readReceipts: [],
        }),
        this.announcementsRepo.create({
          groupId: firstGroup.id,
          title: 'Yıllık Olağan Kat Malikleri Toplantı Çağrısı',
          content:
            'Sayın Kat Maliklerimiz; 634 sayılı KMK uyarınca sitemizin yıllık olağan genel kurul toplantısı 10 Eylül Pazar günü saat 14:00’te yapılacaktır. Toplantı yalnızca tapu sahibi kat maliklerimizin katılımına açıktır.',
          category: 'Toplantı',
          authorName: 'Yönetim Kurulu',
          isImportant: true,
          targetScope: 'role',
          targetRole: 'owner',
          status: 'published',
          readReceipts: [],
        }),
        this.announcementsRepo.create({
          groupId: firstGroup.id,
          title: 'Gelecek Dönem Güvenlik Kamera Sistemi İhalesi',
          content:
            'Önümüzdeki hafta başlayacak olan çevre güvenlik kameraları yenileme projesinin teknik şartnamesi hazırlanmıştır.',
          category: 'Genel',
          authorName: 'Yönetim Kurulu',
          isImportant: false,
          targetScope: 'all',
          status: 'scheduled',
          publishAt: futureDate,
          readReceipts: [],
        }),
      ];

      await this.announcementsRepo.save(initialList);
      this.logger.log('✅ Gelişmiş duyurular (hedeflemeli ve zamanlamalı) başarıyla tohumlandı.');
    } catch (err: any) {
      this.logger.error(`Duyuru tohumlama hatası: ${err.message}`);
    }
  }

  /**
   * Tüm duyuruları getirir (Hedefleme ve Okunma İstatistikleriyle birlikte)
   */
  async findAll(
    groupId?: string,
    userFilter?: AnnouncementUserFilter,
  ): Promise<AnnouncementEntity[]> {
    const gid = this.resolveGroupId(groupId);

    return await this.executeWithRLS(gid, async (qr) => {
      const repo = qr.manager.getRepository(AnnouncementEntity);
      const userRepo = qr.manager.getRepository(UserEntity);

      const allAnnouncements = await repo.find({
        ...(gid ? { where: { groupId: gid } } : {}),
        order: { createdAt: 'DESC' },
      });

      // Sitedeki tüm dairelerin listesi (okuma yüzdesi hesaplamak için)
      const members = gid
        ? await userRepo.find({
            where: { groupId: gid, role: 'member' },
          })
        : [];

      const allSiteUnits = new Set<string>();
      for (const m of members) {
        if (m.units && m.units.length > 0) {
          m.units.forEach((u: string) => allSiteUnits.add(u.trim()));
        } else if (m.name) {
          allSiteUnits.add(m.name.trim());
        }
      }
      const totalUnitsCount = allSiteUnits.size > 0 ? allSiteUnits.size : 5;

      const now = new Date();
      const isAdmin =
        userFilter?.userRole === 'admin' || userFilter?.userRole === 'superadmin';

      // 1. Hedefleme ve Durum Filtrelemesi
      const filtered = allAnnouncements.filter((ann) => {
        // Yöneticiler her şeyi (taslak ve zamanlanmış olanları da) görür
        if (isAdmin || !userFilter || (!userFilter.userRole && !userFilter.userId)) {
          return true;
        }

        // Sakinler için filtre:
        // Taslaklar görünmez
        if (ann.status === 'draft') return false;

        // Zamanlanmış duyuru henüz vakti gelmediyse görünmez
        if (ann.status === 'scheduled' || (ann.publishAt && new Date(ann.publishAt) > now)) {
          return false;
        }

        const userUnits = userFilter.units || [];
        const residentType = userFilter.residentType || 'resident';

        // Hedefleme kapsamı:
        if (ann.targetScope === 'all') {
          return true;
        }

        if (ann.targetScope === 'block' && ann.targetBlocks && ann.targetBlocks.length > 0) {
          // Sakinin dairelerinden herhangi biri hedef bloklardan birine ait mi?
          const matchesBlock = userUnits.some((unitStr) =>
            ann.targetBlocks!.some((block) =>
              unitStr.toLowerCase().includes(block.toLowerCase()),
            ),
          );
          if (!matchesBlock) return false;
        }

        if (ann.targetScope === 'unit' && ann.targetUnits && ann.targetUnits.length > 0) {
          // Sakinin dairelerinden biri hedef daire listesinde var mı?
          const matchesUnit = userUnits.some((unitStr) =>
            ann.targetUnits!.some(
              (targetU) => targetU.toLowerCase() === unitStr.toLowerCase(),
            ),
          );
          if (!matchesUnit) return false;
        }

        if (ann.targetScope === 'role' && ann.targetRole && ann.targetRole !== 'all') {
          // KMK Rolü kontrolü:
          if (residentType !== 'both' && residentType !== ann.targetRole) {
            return false;
          }
        }

        return true;
      });

      // 2. İstatistikleri Doldur
      return filtered.map((ann) => {
        const receipts: AnnouncementReadReceipt[] = Array.isArray(ann.readReceipts)
          ? ann.readReceipts
          : [];

        // Hedeflenen daire sayısı hesapla
        let targetUnits = totalUnitsCount;
        if (ann.targetScope === 'unit' && ann.targetUnits?.length) {
          targetUnits = ann.targetUnits.length;
        } else if (ann.targetScope === 'block' && ann.targetBlocks?.length) {
          const blockUnits = Array.from(allSiteUnits).filter((u) =>
            ann.targetBlocks!.some((b) => u.toLowerCase().includes(b.toLowerCase())),
          );
          targetUnits = blockUnits.length > 0 ? blockUnits.length : ann.targetBlocks.length * 4;
        }

        const readCount = receipts.length;
        const readPercentage =
          targetUnits > 0 ? Math.min(100, Math.round((readCount / targetUnits) * 100)) : 0;

        ann.readCount = readCount;
        ann.totalTargetUnits = targetUnits;
        ann.readPercentage = readPercentage;

        return ann;
      });
    });
  }

  /**
   * Yeni Duyuru Oluşturma (Hedefleme ve Zamanlama Seçenekleriyle)
   */
  async create(
    dto: CreateAnnouncementDto,
    authorName?: string,
    authorId?: string,
    groupId?: string,
  ): Promise<AnnouncementEntity> {
    const gid = this.resolveGroupId(groupId);

    return await this.executeWithRLS(gid, async (qr) => {
      const repo = qr.manager.getRepository(AnnouncementEntity);

      let status = dto.status || 'published';
      if (dto.publishAt && new Date(dto.publishAt) > new Date()) {
        status = 'scheduled';
      }

      const item = repo.create({
        groupId: gid,
        title: dto.title,
        content: dto.content,
        category: dto.category || 'Genel',
        isImportant: dto.isImportant || false,
        authorName: authorName || 'Site Yönetimi',
        authorId: authorId || null,
        targetScope: dto.targetScope || 'all',
        targetBlocks: dto.targetBlocks && dto.targetBlocks.length > 0 ? dto.targetBlocks : null,
        targetUnits: dto.targetUnits && dto.targetUnits.length > 0 ? dto.targetUnits : null,
        targetRole: dto.targetRole || 'all',
        status: status,
        publishAt: dto.publishAt || null,
        readReceipts: [],
      });

      const saved = await repo.save(item);
      saved.readCount = 0;
      saved.totalTargetUnits = 5;
      saved.readPercentage = 0;

      // In-app Notification for targeted residents
      if (status === 'published' && this.notificationsService) {
        try {
          const userRepo = qr.manager.getRepository(UserEntity);
          const residents = await userRepo.find({
            where: { groupId: gid, role: 'member' },
          });

          const matchingResidents = residents.filter((res) => {
            const userUnits = res.units || (res.name ? [res.name] : []);
            if (dto.targetScope === 'block' && dto.targetBlocks && dto.targetBlocks.length > 0) {
              return userUnits.some((u: string) =>
                dto.targetBlocks!.some((b) => u.toLowerCase().includes(b.toLowerCase())),
              );
            }
            if (dto.targetScope === 'unit' && dto.targetUnits && dto.targetUnits.length > 0) {
              return userUnits.some((u: string) =>
                dto.targetUnits!.some((targetU) => targetU.toLowerCase() === u.toLowerCase()),
              );
            }
            return true;
          });

          if (matchingResidents.length > 0) {
            const notificationDtos = matchingResidents.map((res) => ({
              userId: res.id,
              title: `Yeni Duyuru: ${dto.title}`,
              message: dto.content.length > 120 ? `${dto.content.slice(0, 117)}...` : dto.content,
              type: 'announcement' as const,
              priority: dto.isImportant ? ('high' as const) : ('normal' as const),
              linkUrl: '/portal/announcements',
              metadata: { announcementId: saved.id, isImportant: dto.isImportant },
            }));

            await this.notificationsService.createBulkNotifications(notificationDtos, gid);
          }
        } catch (notifyErr: any) {
          this.logger.warn(`Duyuru bildirim dağıtım uyarısı: ${notifyErr.message}`);
        }
      }

      return saved;
    });
  }

  /**
   * Sakinin duyuruyu okuduğunu sunucuya kaydeder (İdempotent Okundu Bilgisi)
   */
  async markAsRead(
    id: string,
    user: { userId: string; userName: string; unit?: string },
    groupId?: string,
  ): Promise<{ success: boolean; readCount: number; readPercentage: number }> {
    const gid = this.resolveGroupId(groupId);

    return await this.executeWithRLS(gid, async (qr) => {
      const repo = qr.manager.getRepository(AnnouncementEntity);
      const ann = await repo.findOne({ where: { id, groupId: gid } });
      if (!ann) {
        throw new NotFoundException('Duyuru bulunamadı.');
      }

      let receipts: AnnouncementReadReceipt[] = Array.isArray(ann.readReceipts)
        ? [...ann.readReceipts]
        : [];

      // Eğer kullanıcı daha önce okumamışsa ekle
      const existing = receipts.find((r) => r.userId === user.userId);
      if (!existing) {
        receipts.push({
          userId: user.userId,
          userName: user.userName || 'Site Sakini',
          unit: user.unit || 'Daire',
          readAt: new Date().toISOString(),
        });
        ann.readReceipts = receipts;
        await repo.save(ann);
      }

      return {
        success: true,
        readCount: receipts.length,
        readPercentage: Math.min(100, Math.round((receipts.length / 5) * 100)),
      };
    });
  }

  /**
   * Duyurunun ayrıntılı okuma istatistiklerini ve kimlerin okuduğunu döner
   */
  async getReadStats(id: string, groupId?: string): Promise<AnnouncementReadStats> {
    const gid = this.resolveGroupId(groupId);

    return await this.executeWithRLS(gid, async (qr) => {
      const repo = qr.manager.getRepository(AnnouncementEntity);
      const userRepo = qr.manager.getRepository(UserEntity);

      const ann = await repo.findOne({ where: { id, groupId: gid } });
      if (!ann) {
        throw new NotFoundException('Duyuru bulunamadı.');
      }

      const receipts: AnnouncementReadReceipt[] = Array.isArray(ann.readReceipts)
        ? ann.readReceipts
        : [];

      // Gruptaki daireleri topla
      const members = await userRepo.find({
        where: { groupId: gid, role: 'member' },
      });

      const allUnitsSet = new Set<string>();
      for (const m of members) {
        if (m.units && m.units.length > 0) {
          m.units.forEach((u: string) => allUnitsSet.add(u.trim()));
        } else if (m.name) {
          allUnitsSet.add(m.name.trim());
        }
      }

      // Hedef kitleye göre daire filtrele
      let targetUnitsList = Array.from(allUnitsSet);
      if (ann.targetScope === 'unit' && ann.targetUnits?.length) {
        targetUnitsList = ann.targetUnits;
      } else if (ann.targetScope === 'block' && ann.targetBlocks?.length) {
        targetUnitsList = targetUnitsList.filter((u) =>
          ann.targetBlocks!.some((b) => u.toLowerCase().includes(b.toLowerCase())),
        );
      }

      if (targetUnitsList.length === 0) {
        targetUnitsList = ['Daire 1', 'Daire 2', 'Daire 3', 'Daire 4', 'Daire 5'];
      }

      // Okuyan daireler
      const readUnitsSet = new Set(receipts.map((r) => r.unit.trim()));
      const unreadUnits = targetUnitsList.filter((u) => !readUnitsSet.has(u));

      const readCount = receipts.length;
      const totalTargetUnits = targetUnitsList.length;
      const readPercentage =
        totalTargetUnits > 0 ? Math.min(100, Math.round((readCount / totalTargetUnits) * 100)) : 0;

      return {
        totalTargetUnits,
        readCount,
        readPercentage,
        reads: receipts,
        unreadUnits,
      };
    });
  }

  /**
   * Duyuru Silme
   */
  async delete(id: string, groupId?: string): Promise<boolean> {
    const gid = this.resolveGroupId(groupId);
    return await this.executeWithRLS(gid, async (qr) => {
      const repo = qr.manager.getRepository(AnnouncementEntity);
      const item = await repo.findOne({ where: { id, groupId: gid } });
      if (!item) {
        throw new NotFoundException('Duyuru bulunamadı.');
      }
      await repo.remove(item);
      return true;
    });
  }
}
