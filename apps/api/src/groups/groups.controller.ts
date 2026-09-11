import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Headers,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import {
  ApiResponse,
  Group,
  CreateGroupDto,
  UpdateGroupDto,
  PlatformModuleDefinition,
  PlatformModuleCode,
  GroupModuleSubscription,
} from '@sitera/shared';
import { CurrentGroupId } from '../tenancy/tenant.decorator';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async findAll(
    @CurrentGroupId() groupId?: string,
    @Headers('x-user-role') role?: string,
  ): Promise<ApiResponse<Group[]>> {
    let groups = await this.groupsService.findAll();
    if (role && role !== 'superadmin' && groupId) {
      groups = groups.filter((g) => g.id === groupId);
    }
    return {
      success: true,
      data: groups,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('modules/catalog')
  getModuleCatalog(): ApiResponse<PlatformModuleDefinition[]> {
    const catalog = this.groupsService.getModuleCatalog();
    return {
      success: true,
      data: catalog,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<Group>> {
    const group = await this.groupsService.findOne(id);
    return {
      success: true,
      data: group,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  async create(@Body() dto: CreateGroupDto): Promise<ApiResponse<Group>> {
    const group = await this.groupsService.create(dto);
    return {
      success: true,
      message: 'Grup (Tenant) başarıyla oluşturuldu',
      data: group,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGroupDto,
  ): Promise<ApiResponse<Group>> {
    const group = await this.groupsService.update(id, dto);
    return {
      success: true,
      message: 'Grup güncellendi',
      data: group,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/trial')
  async applyTrial(
    @Param('id') id: string,
    @Body() body: { months?: number },
  ): Promise<ApiResponse<Group>> {
    const group = await this.groupsService.applyTrialPromotion(id, body?.months ?? 3);
    return {
      success: true,
      message: `${body?.months ?? 3} aylık lansman deneme süresi tanımlandı`,
      data: group,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/extend')
  async extendLicense(
    @Param('id') id: string,
    @Body() body: { months?: number },
  ): Promise<ApiResponse<Group>> {
    const group = await this.groupsService.extendLicense(id, body?.months ?? 12);
    return {
      success: true,
      message: `Lisans süresi ${body?.months ?? 12} ay uzatıldı`,
      data: group,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/freeze')
  async toggleFreeze(
    @Param('id') id: string,
    @Body() body: { isFrozen: boolean; reason?: string },
  ): Promise<ApiResponse<Group>> {
    const group = await this.groupsService.toggleFreeze(id, body.isFrozen, body.reason);
    return {
      success: true,
      message: body.isFrozen ? 'Site donduruldu (askıya alındı)' : 'Site dondurması kaldırıldı, tekrar aktif',
      data: group,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/export')
  async exportData(@Param('id') id: string): Promise<ApiResponse<any>> {
    const exportData = await this.groupsService.exportGroupData(id);
    return {
      success: true,
      message: 'Site yasal veri dökümü başarıyla hazırlandı',
      data: exportData,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/modules')
  async getGroupModules(
    @Param('id') id: string,
  ): Promise<ApiResponse<{ modules: GroupModuleSubscription[]; catalog: PlatformModuleDefinition[] }>> {
    const data = await this.groupsService.getGroupModules(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/modules/toggle')
  async toggleModule(
    @Param('id') id: string,
    @Body()
    body: {
      moduleCode: PlatformModuleCode;
      status: 'active' | 'trial' | 'inactive';
      durationDays?: number;
      customPrice?: number;
    },
  ): Promise<ApiResponse<Group>> {
    const group = await this.groupsService.toggleGroupModule(
      id,
      body.moduleCode,
      body.status,
      body.durationDays ?? 30,
      body.customPrice,
    );
    return {
      success: true,
      message: `Modül durumu güncellendi: ${body.moduleCode} -> ${body.status}`,
      data: group,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/modules/subscribe')
  async subscribeModule(
    @Param('id') id: string,
    @Body() body: { moduleCode: PlatformModuleCode; isTrial?: boolean },
  ): Promise<ApiResponse<Group>> {
    const group = await this.groupsService.subscribeGroupModule(
      id,
      body.moduleCode,
      body.isTrial ?? false,
    );
    return {
      success: true,
      message: body.isTrial ? '30 günlük ücretsiz deneme başlatıldı' : 'Modül aboneliği başarıyla başlatıldı',
      data: group,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    const deleted = await this.groupsService.remove(id);
    return {
      success: true,
      message: 'Grup silindi',
      data: { deleted },
      timestamp: new Date().toISOString(),
    };
  }
}
