import { Injectable, NotFoundException, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupEntity } from './group.entity';
import { CreateGroupDto, UpdateGroupDto } from '@sitera/shared';
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
      // Clean up legacy dummy seed if present
      await this.groupsRepo.delete({ slug: 'acme-corp' }).catch(() => {});
      await this.redis.del('groups:all');

      const count = await this.groupsRepo.count();
      if (count === 0) {
        this.logger.log('🏢 Sitera organizasyon grubu oluşturuluyor...');
        await this.groupsRepo.save([
          {
            name: 'Sitera Teknoloji',
            slug: 'sitera-tech',
            plan: 'enterprise',
            isActive: true,
          },
        ]);
        this.logger.log('✅ Sitera organizasyon grubu oluşturuldu.');
      }
    } catch (err: any) {
      this.logger.warn(`Grup tohumlama atlandı: ${err.message}`);
    }
  }

  async findAll(): Promise<GroupEntity[]> {
    const cacheKey = 'groups:all';
    const cached = await this.redis.get<GroupEntity[]>(cacheKey);
    if (cached) return cached;

    const groups = await this.groupsRepo.find({
      order: { createdAt: 'DESC' },
    });
    await this.redis.set(cacheKey, groups, 120); // 2 min cache
    return groups;
  }

  async findOne(id: string): Promise<GroupEntity> {
    const cacheKey = `groups:${id}`;
    const cached = await this.redis.get<GroupEntity>(cacheKey);
    if (cached) return cached;

    const group = await this.groupsRepo.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException(`Grup bulunamadı: ${id}`);
    }
    await this.redis.set(cacheKey, group, 300);
    return group;
  }

  async create(dto: CreateGroupDto): Promise<GroupEntity> {
    const newGroup = this.groupsRepo.create({
      name: dto.name,
      slug: dto.slug.toLowerCase().trim(),
      plan: dto.plan || 'free',
      isActive: true,
    });
    const saved = await this.groupsRepo.save(newGroup);
    await this.redis.del('groups:all');
    return saved;
  }

  async update(id: string, dto: UpdateGroupDto): Promise<GroupEntity> {
    const group = await this.findOne(id);
    if (dto.name) group.name = dto.name;
    if (dto.plan) group.plan = dto.plan;
    if (dto.isActive !== undefined) group.isActive = dto.isActive;

    const saved = await this.groupsRepo.save(group);
    await this.redis.del('groups:all');
    await this.redis.del(`groups:${id}`);
    return saved;
  }

  async remove(id: string): Promise<boolean> {
    const res = await this.groupsRepo.delete(id);
    await this.redis.del('groups:all');
    await this.redis.del(`groups:${id}`);
    return (res.affected ?? 0) > 0;
  }
}
