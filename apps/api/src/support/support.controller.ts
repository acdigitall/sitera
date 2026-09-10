import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Headers,
  Query,
} from '@nestjs/common';
import { SupportService } from './support.service';
import {
  CreateSupportTicketDto,
  AddSupportTicketMessageDto,
  SupportTicketStatus,
} from '@sitera/shared';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  async getTickets(
    @Headers('x-group-id') headerGroupId?: string,
    @Headers('x-user-role') userRole?: string,
    @Query('groupId') queryGroupId?: string,
  ) {
    const isSuperAdmin = userRole === 'superadmin' || !queryGroupId;
    const groupId = queryGroupId || (!isSuperAdmin ? headerGroupId : undefined);
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
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-name') userName?: string,
  ) {
    const data = await this.supportService.impersonateSite(id, {
      id: userId || 'usr-superadmin',
      name: userName || 'Süper Admin',
    });
    return { success: true, data };
  }

  @Post('tickets/:id/exit')
  async exitImpersonation(
    @Param('id') id: string,
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-name') userName?: string,
  ) {
    const data = await this.supportService.exitImpersonation(id, {
      id: userId || 'usr-superadmin',
      name: userName || 'Süper Admin',
    });
    return { success: true, data };
  }
}
