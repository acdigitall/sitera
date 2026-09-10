import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto, MarkAnnouncementReadDto } from '@sitera/shared';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  async findAll(
    @Query('userId') userId?: string,
    @Query('userRole') userRole?: string,
    @Query('units') unitsParam?: string,
    @Query('residentType') residentType?: string,
    @Headers('x-group-id') groupId?: string,
  ) {
    const units = unitsParam ? unitsParam.split(',').map((u) => u.trim()) : undefined;
    const data = await this.announcementsService.findAll(groupId, {
      userId,
      userRole,
      units,
      residentType,
    });
    return { success: true, data };
  }

  @Post()
  async create(
    @Body() dto: CreateAnnouncementDto,
    @Body('authorName') authorName?: string,
    @Body('authorId') authorId?: string,
    @Headers('x-group-id') groupId?: string,
  ) {
    const data = await this.announcementsService.create(dto, authorName, authorId, groupId);
    return { success: true, data };
  }

  @Post(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Body() dto: MarkAnnouncementReadDto,
    @Headers('x-group-id') groupId?: string,
  ) {
    const data = await this.announcementsService.markAsRead(
      id,
      {
        userId: dto.userId || 'anonymous-user',
        userName: dto.userName || 'Site Sakini',
        unit: dto.unit || 'Daire',
      },
      groupId,
    );
    return { success: true, data };
  }

  @Get(':id/reads')
  async getReadStats(
    @Param('id') id: string,
    @Headers('x-group-id') groupId?: string,
  ) {
    const data = await this.announcementsService.getReadStats(id, groupId);
    return { success: true, data };
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Headers('x-group-id') groupId?: string,
  ) {
    const data = await this.announcementsService.delete(id, groupId);
    return { success: true, data };
  }
}
