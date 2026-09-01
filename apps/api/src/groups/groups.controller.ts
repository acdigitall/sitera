import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { ApiResponse, Group, CreateGroupDto, UpdateGroupDto } from '@sitera/shared';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async findAll(): Promise<ApiResponse<Group[]>> {
    const groups = await this.groupsService.findAll();
    return {
      success: true,
      data: groups,
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
