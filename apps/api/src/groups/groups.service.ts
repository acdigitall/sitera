import { Injectable, NotFoundException, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupEntity } from './group.entity';
import {
  CreateGroupDto,
  UpdateGroupDto,
  PLATFORM_MODULE_CATALOG,
  PlatformModuleCode,
  PlatformModuleDefinition,
  GroupModuleSubscription,
} from '@sitera/shared';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class GroupsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(GroupsService.name);

  constructor(
    @InjectRepository(GroupEntity)
    private readonly groupsRepo: Repository<GroupEntity>,
    private readonly redis: RedisService,
  ) {}

  async onApplicationBootstrap() {
    try {
      // Clean up legacy dummy seeds if present
      await this.groupsRepo.delete({ slug: 'acme-corp' }).catch(() => {});
      await this.groupsRepo.delete({ slug: 'sitera-tech' }).catch(() => {});
      await this.redis.del('groups:all');
      await this.redis.del('groups:all:with_users');
    } catch (err: any) {
      this.logger.warn(`Grup tohumlama atlandı: ${err.message}`);
    }
  }

  async findAll(): Promise<GroupEntity[]> {
    const cacheKey = 'groups:all:with_users';
    const cached = await this.redis.get<GroupEntity[]>(cacheKey);
    if (cached) return cached;

    const groups = await this.groupsRepo.find({
      relations: ['users'],
      order: { createdAt: 'DESC' },
    });

    // Ensure subscription & billing defaults are normalized
    for (const g of groups) {
      if (!g.subscriptionStatus) g.subscriptionStatus = 'trial';
      if (!g.unitFee) {
        g.unitFee = g.monthlyFee && g.totalUnits ? Math.round(Number(g.monthlyFee) / Number(g.totalUnits)) : 20;
      }
      if (!g.monthlyFee) g.monthlyFee = Number((g.totalUnits || 24) * (g.unitFee || 20));
      if (!g.billingCycle) g.billingCycle = 'monthly';
      if (!g.paymentStatus) g.paymentStatus = g.subscriptionStatus === 'trial' ? 'free_trial' : 'paid';
      if (!g.licenseExpiresAt) {
        g.licenseExpiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
      }
      if (!g.trialEndsAt && g.subscriptionStatus === 'trial') {
        g.trialEndsAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      }

      if (!g.modules || g.modules.length === 0) {
        if (g.slug.includes('palmiye')) {
          g.modules = [
            { moduleCode: 'ANPR_PLATE_RECOGNITION', status: 'active', activatedAt: '2026-06-01', expiresAt: '2026-12-31', price: 5 },
            { moduleCode: 'FACILITY_RESERVATION', status: 'trial', activatedAt: '2026-09-01', expiresAt: '2026-10-01', price: 250 },
          ];
        } else if (g.slug.includes('zumrut')) {
          g.modules = [
            { moduleCode: 'GUEST_QR_PASS', status: 'trial', activatedAt: '2026-08-15', expiresAt: '2026-09-15', price: 200 },
          ];
        } else if (g.slug.includes('gencosman')) {
          g.modules = [
            { moduleCode: 'SMART_INTERCOM', status: 'trial', activatedAt: '2026-09-01', expiresAt: '2026-10-01', price: 4 },
          ];
        } else {
          g.modules = [];
        }
      }
    }

    await this.redis.set(cacheKey, groups, 60); // 1 min cache
    return groups;
  }

  async findOne(id: string): Promise<GroupEntity> {
    const cacheKey = `groups:${id}:with_users`;
    const cached = await this.redis.get<GroupEntity>(cacheKey);
    if (cached) return cached;

    const group = await this.groupsRepo.findOne({
      where: { id },
      relations: ['users'],
    });
    if (!group) {
      throw new NotFoundException(`Grup bulunamadı: ${id}`);
    }

    // Ensure subscription & billing defaults are normalized
    if (!group.subscriptionStatus) group.subscriptionStatus = 'trial';
    if (!group.unitFee) {
      group.unitFee = group.monthlyFee && group.totalUnits ? Math.round(Number(group.monthlyFee) / Number(group.totalUnits)) : 20;
    }
    if (!group.monthlyFee) group.monthlyFee = Number((group.totalUnits || 24) * (group.unitFee || 20));
    if (!group.billingCycle) group.billingCycle = 'monthly';
    if (!group.paymentStatus) group.paymentStatus = group.subscriptionStatus === 'trial' ? 'free_trial' : 'paid';
    if (!group.licenseExpiresAt) {
      group.licenseExpiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
    }
    if (!group.trialEndsAt && group.subscriptionStatus === 'trial') {
      group.trialEndsAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    }

    if (!group.modules || group.modules.length === 0) {
      if (group.slug.includes('palmiye')) {
        group.modules = [
          { moduleCode: 'ANPR_PLATE_RECOGNITION', status: 'active', activatedAt: '2026-06-01', expiresAt: '2026-12-31', price: 5 },
          { moduleCode: 'FACILITY_RESERVATION', status: 'trial', activatedAt: '2026-09-01', expiresAt: '2026-10-01', price: 250 },
        ];
      } else if (group.slug.includes('zumrut')) {
        group.modules = [
          { moduleCode: 'GUEST_QR_PASS', status: 'trial', activatedAt: '2026-08-15', expiresAt: '2026-09-15', price: 200 },
        ];
      } else if (group.slug.includes('gencosman')) {
        group.modules = [
          { moduleCode: 'SMART_INTERCOM', status: 'trial', activatedAt: '2026-09-01', expiresAt: '2026-10-01', price: 4 },
        ];
      } else {
        group.modules = [];
      }
    }

    await this.redis.set(cacheKey, group, 60);
    return group;
  }

  async create(dto: CreateGroupDto): Promise<GroupEntity> {
    const totalUnits = dto.totalUnits ?? 24;
    const isTrial = dto.subscriptionStatus === 'trial' || !dto.subscriptionStatus;
    const now = Date.now();
    const trialEndsAt =
      dto.trialEndsAt !== undefined
        ? dto.trialEndsAt
        : isTrial
        ? new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString()
        : null;

    const licenseExpiresAt =
      dto.licenseExpiresAt || new Date(now + 365 * 24 * 60 * 60 * 1000).toISOString();
    const unitFee = dto.unitFee ?? (dto.monthlyFee ? Math.round(dto.monthlyFee / totalUnits) : 20);
    const monthlyFee = dto.monthlyFee ?? totalUnits * unitFee;
    const paymentStatus = dto.paymentStatus || (isTrial ? 'free_trial' : 'paid');

    const newGroup = this.groupsRepo.create({
      name: dto.name,
      slug: dto.slug.toLowerCase().trim(),
      plan: dto.plan || 'pro',
      isActive: true,
      totalUnits,
      city: dto.city || 'İstanbul',
      district: dto.district || 'Kadıköy',
      subscriptionStatus: dto.subscriptionStatus || (isTrial ? 'trial' : 'active'),
      unitFee,
      monthlyFee,
      billingCycle: dto.billingCycle || 'monthly',
      trialEndsAt,
      licenseExpiresAt,
      paymentStatus,
      isFrozen: false,
    });
    const saved = await this.groupsRepo.save(newGroup);
    await this.redis.del('groups:all');
    await this.redis.del('groups:all:with_users');
    return saved;
  }

  async update(id: string, dto: UpdateGroupDto): Promise<GroupEntity> {
    const group = await this.findOne(id);
    if (dto.name) group.name = dto.name;
    if (dto.plan) group.plan = dto.plan;
    if (dto.isActive !== undefined) group.isActive = dto.isActive;
    if (dto.totalUnits !== undefined) {
      group.totalUnits = dto.totalUnits;
      if (dto.monthlyFee === undefined && dto.unitFee === undefined) {
        group.monthlyFee = dto.totalUnits * (group.unitFee || 20);
      }
    }
    if (dto.city) group.city = dto.city;
    if (dto.district) group.district = dto.district;
    if (dto.subscriptionStatus) group.subscriptionStatus = dto.subscriptionStatus;
    if (dto.unitFee !== undefined) {
      group.unitFee = dto.unitFee;
      if (dto.monthlyFee === undefined) {
        group.monthlyFee = (group.totalUnits || 24) * dto.unitFee;
      }
    }
    if (dto.monthlyFee !== undefined) group.monthlyFee = dto.monthlyFee;
    if (dto.billingCycle) group.billingCycle = dto.billingCycle;
    if (dto.trialEndsAt !== undefined) group.trialEndsAt = dto.trialEndsAt;
    if (dto.licenseExpiresAt !== undefined) group.licenseExpiresAt = dto.licenseExpiresAt;
    if (dto.paymentStatus) group.paymentStatus = dto.paymentStatus;
    if (dto.isFrozen !== undefined) group.isFrozen = dto.isFrozen;
    if (dto.frozenReason !== undefined) group.frozenReason = dto.frozenReason;

    const saved = await this.groupsRepo.save(group);
    await this.redis.del('groups:all');
    await this.redis.del('groups:all:with_users');
    await this.redis.del(`groups:${id}`);
    await this.redis.del(`groups:${id}:with_users`);
    return saved;
  }

  async applyTrialPromotion(id: string, months: number = 3): Promise<GroupEntity> {
    const group = await this.findOne(id);
    const trialDurationMs = months * 30 * 24 * 60 * 60 * 1000;
    const newTrialEnd = new Date(Date.now() + trialDurationMs).toISOString();

    group.subscriptionStatus = 'trial';
    group.paymentStatus = 'free_trial';
    group.trialEndsAt = newTrialEnd;

    // Lisans süresini de en az promosyon süresi kadar ileriye al
    const currentLicense = group.licenseExpiresAt
      ? new Date(group.licenseExpiresAt).getTime()
      : Date.now();
    if (currentLicense < Date.now() + trialDurationMs) {
      group.licenseExpiresAt = newTrialEnd;
    }

    const saved = await this.groupsRepo.save(group);
    await this.redis.del('groups:all');
    await this.redis.del('groups:all:with_users');
    await this.redis.del(`groups:${id}`);
    await this.redis.del(`groups:${id}:with_users`);
    return saved;
  }

  async extendLicense(id: string, months: number = 12): Promise<GroupEntity> {
    const group = await this.findOne(id);
    const durationMs = months * 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const currentLicenseExp = group.licenseExpiresAt ? new Date(group.licenseExpiresAt).getTime() : 0;
    const currentTrialExp = group.trialEndsAt ? new Date(group.trialEndsAt).getTime() : 0;
    const baseTime = Math.max(now, currentLicenseExp, currentTrialExp);

    group.licenseExpiresAt = new Date(baseTime + durationMs).toISOString();
    group.subscriptionStatus = 'active';
    group.paymentStatus = 'paid';
    group.lastPaymentDate = new Date().toISOString();
    group.trialEndsAt = null;

    await this.groupsRepo.save(group);
    await this.redis.del('groups:all');
    await this.redis.del('groups:all:with_users');
    await this.redis.del(`groups:${id}`);
    await this.redis.del(`groups:${id}:with_users`);
    return this.findOne(id);
  }

  async toggleFreeze(id: string, isFrozen: boolean, reason?: string): Promise<GroupEntity> {
    const group = await this.findOne(id);
    group.isFrozen = isFrozen;
    group.frozenReason = isFrozen ? reason || 'Yönetici veya Süper Admin talebiyle donduruldu' : null;
    group.subscriptionStatus = isFrozen ? 'paused' : 'active';

    const saved = await this.groupsRepo.save(group);
    await this.redis.del('groups:all');
    await this.redis.del('groups:all:with_users');
    await this.redis.del(`groups:${id}`);
    await this.redis.del(`groups:${id}:with_users`);
    return saved;
  }

  async exportGroupData(id: string): Promise<any> {
    const group = await this.findOne(id);
    return {
      exportedAt: new Date().toISOString(),
      organization: {
        id: group.id,
        name: group.name,
        slug: group.slug,
        city: group.district ? `${group.district}, ${group.city}` : group.city,
        totalUnits: group.totalUnits,
        licensePlan: group.plan,
        subscriptionStatus: group.subscriptionStatus,
        monthlyFee: group.monthlyFee,
        licenseExpiresAt: group.licenseExpiresAt,
      },
      cadre: (group.users || []).map((u) => ({
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        units: u.units,
      })),
      complianceNotice:
        'Bu rapor Kat Mülkiyeti Kanunu ve KVKK gereğince resmi site çıkış/arşivleme dökümüdür.',
    };
  }

  async remove(id: string): Promise<boolean> {
    const res = await this.groupsRepo.delete(id);
    await this.redis.del('groups:all');
    await this.redis.del('groups:all:with_users');
    await this.redis.del(`groups:${id}`);
    await this.redis.del(`groups:${id}:with_users`);
    return (res.affected ?? 0) > 0;
  }

  // --- Modüler Eklenti ve Feature Entitlements Yönetimi ---

  getModuleCatalog(): PlatformModuleDefinition[] {
    return PLATFORM_MODULE_CATALOG;
  }

  async getGroupModules(groupId: string): Promise<{ modules: GroupModuleSubscription[]; catalog: PlatformModuleDefinition[] }> {
    const group = await this.findOne(groupId);
    return {
      modules: group.modules || [],
      catalog: PLATFORM_MODULE_CATALOG,
    };
  }

  async toggleGroupModule(
    groupId: string,
    moduleCode: PlatformModuleCode,
    status: 'active' | 'trial' | 'inactive',
    durationDays: number = 30,
    customPrice?: number,
  ): Promise<GroupEntity> {
    const group = await this.findOne(groupId);
    const existingModules: GroupModuleSubscription[] = Array.isArray(group.modules) ? [...group.modules] : [];

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const idx = existingModules.findIndex((m) => m.moduleCode === moduleCode);
    const catalogItem = PLATFORM_MODULE_CATALOG.find((c) => c.code === moduleCode);

    const price = customPrice !== undefined ? customPrice : catalogItem?.defaultPrice;

    if (idx >= 0) {
      existingModules[idx] = {
        ...existingModules[idx],
        status,
        activatedAt: status !== 'inactive' ? now.toISOString() : existingModules[idx].activatedAt,
        expiresAt: status !== 'inactive' ? expiresAt : existingModules[idx].expiresAt,
        price,
      };
    } else {
      existingModules.push({
        moduleCode,
        status,
        activatedAt: now.toISOString(),
        expiresAt,
        price,
      });
    }

    group.modules = existingModules;
    const saved = await this.groupsRepo.save(group);

    // Cache temizliği
    await this.redis.del('groups:all');
    await this.redis.del('groups:all:with_users');
    await this.redis.del(`groups:${groupId}`);
    await this.redis.del(`groups:${groupId}:with_users`);

    this.logger.log(`⚙️ [Modül Güncellendi] Site: ${group.name} | Modül: ${moduleCode} | Durum: ${status}`);
    return saved;
  }

  async subscribeGroupModule(
    groupId: string,
    moduleCode: PlatformModuleCode,
    isTrial: boolean = false,
  ): Promise<GroupEntity> {
    const duration = isTrial ? 30 : 365;
    const status = isTrial ? 'trial' : 'active';
    return await this.toggleGroupModule(groupId, moduleCode, status, duration);
  }
}
