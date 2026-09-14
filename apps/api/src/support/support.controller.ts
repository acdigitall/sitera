import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Headers,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { SupportService } from './support.service';
import {
  CreateSupportTicketDto,
  AddSupportTicketMessageDto,
  SupportTicketStatus,
} from '@sitera/shared';

import { TenantContext } from '../tenancy/tenant.context';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  async getTickets(
    @Query('groupId') queryGroupId?: string,
  ) {
    const userRole = TenantContext.getUserRole();
    const isSuperAdmin = userRole === 'superadmin';
    const groupId = queryGroupId || (!isSuperAdmin ? TenantContext.getGroupId() : undefined);
    const data = await this.supportService.getTickets(groupId, isSuperAdmin);
    return { success: true, data };
  }

  @Get('tickets/:id')
  async getTicketById(@Param('id') id: string) {
    const data = await this.supportService.getTicketById(id);
    return { success: true, data };
  }

  @Post('tickets')
  async createTicket(@Body() dto: CreateSupportTicketDto) {
    const data = await this.supportService.createTicket(dto);
    return { success: true, data };
  }

  @Post('tickets/:id/messages')
  async addMessage(
    @Param('id') id: string,
    @Body() dto: AddSupportTicketMessageDto,
  ) {
    const data = await this.supportService.addMessage(id, dto);
    return { success: true, data };
  }

  @Patch('tickets/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: SupportTicketStatus,
    @Headers('x-user-name') userName?: string,
  ) {
    const data = await this.supportService.updateStatus(id, status, userName);
    return { success: true, data };
  }

  @Post('tickets/:id/impersonate')
  async impersonate(
    @Param('id') id: string,
    @Headers('x-user-name') userName?: string,
  ) {
    if (TenantContext.getUserRole() !== 'superadmin') {
      throw new ForbiddenException('Site oturumuna bağlanma yetkisi yalnızca Süper Yöneticilere aittir.');
    }
    const userId = TenantContext.getUserId() || 'usr-superadmin';
    const data = await this.supportService.impersonateSite(id, {
      id: userId,
      name: userName || 'Süper Admin',
    });
    return { success: true, data };
  }

  @Post('tickets/:id/exit')
  async exitImpersonation(
    @Param('id') id: string,
    @Headers('x-user-name') userName?: string,
  ) {
    if (TenantContext.getUserRole() !== 'superadmin') {
      throw new ForbiddenException('Bu işlem yalnızca Süper Yöneticilere aittir.');
    }
    const userId = TenantContext.getUserId() || 'usr-superadmin';
    const data = await this.supportService.exitImpersonation(id, {
      id: userId,
      name: userName || 'Süper Admin',
    });
    return { success: true, data };
  }
}
