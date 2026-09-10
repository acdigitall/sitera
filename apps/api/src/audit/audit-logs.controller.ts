import { Controller, Get, Post, Body, Query, Headers, Req } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { CreateAuditLogDto } from '@sitera/shared';

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  async getLogs(
    @Headers('x-group-id') headerGroupId?: string,
    @Query('groupId') queryGroupId?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    const groupId = headerGroupId || queryGroupId;
    return this.auditLogsService.getLogs(
      groupId,
      category,
      search,
      limit ? parseInt(limit, 10) : 100,
    );
  }

  @Post()
  async createLog(
    @Body() dto: CreateAuditLogDto,
    @Headers('x-group-id') headerGroupId?: string,
    @Req() req?: any,
  ) {
    return this.auditLogsService.recordLog({
      groupId: headerGroupId,
      action: dto.action,
      category: dto.category,
      level: dto.level || 'INFO',
      resource: dto.resource,
      details: dto.details,
      ipAddress: req?.ip || '127.0.0.1',
      userAgent: req?.headers?.['user-agent'],
    });
  }
}
