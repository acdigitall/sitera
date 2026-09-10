import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto, UpdateTicketStatusDto } from '@sitera/shared';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  async createTicket(
    @Body() dto: CreateTicketDto,
    @Headers('x-group-id') headerGroupId?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const data = await this.ticketsService.createTicket(dto, { id: userId, groupId: headerGroupId }, headerGroupId);
    return { success: true, data };
  }

  @Get()
  async getTickets(
    @Headers('x-group-id') headerGroupId?: string,
    @Query('groupId') queryGroupId?: string,
    @Query('unit') unit?: string,
    @Query('userId') userId?: string,
    @Query('isStaff') isStaff?: string,
  ) {
    const groupId = headerGroupId || queryGroupId;
    const staffFlag = isStaff === 'true';
    const data = await this.ticketsService.getTickets(groupId, userId, unit, staffFlag);
    return { success: true, data };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
    @Headers('x-group-id') headerGroupId?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const data = await this.ticketsService.updateTicketStatus(
      id,
      dto,
      { id: userId, name: 'Yönetici' },
      headerGroupId,
    );
    return { success: true, data };
  }

  @Delete(':id')
  async deleteTicket(
    @Param('id') id: string,
    @Headers('x-group-id') headerGroupId?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const data = await this.ticketsService.deleteTicket(id, { id: userId }, headerGroupId);
    return { success: true, data };
  }
}
