import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Headers,
  Body,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MarkNotificationReadDto, NotificationType } from '@sitera/shared';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Headers('x-group-id') headerGroupId?: string,
    @Headers('x-user-id') headerUserId?: string,
    @Query('groupId') queryGroupId?: string,
    @Query('userId') queryUserId?: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('type') type?: NotificationType,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const groupId = headerGroupId || queryGroupId;
    const userId = headerUserId || queryUserId || '';
    const isUnread = unreadOnly === 'true';

    const result = await this.notificationsService.getUserNotifications(
      userId,
      groupId,
      {
        unreadOnly: isUnread,
        type,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      },
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get('unread-count')
  async getUnreadCount(
    @Headers('x-group-id') headerGroupId?: string,
    @Headers('x-user-id') headerUserId?: string,
    @Query('groupId') queryGroupId?: string,
    @Query('userId') queryUserId?: string,
  ) {
    const groupId = headerGroupId || queryGroupId;
    const userId = headerUserId || queryUserId || '';

    const count = await this.notificationsService.getUnreadCount(userId, groupId);

    return {
      success: true,
      data: { count },
    };
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Headers('x-group-id') headerGroupId?: string,
    @Headers('x-user-id') headerUserId?: string,
    @Query('groupId') queryGroupId?: string,
    @Query('userId') queryUserId?: string,
    @Body() _dto?: MarkNotificationReadDto,
  ) {
    const groupId = headerGroupId || queryGroupId;
    const userId = headerUserId || queryUserId || '';

    const notification = await this.notificationsService.markAsRead(
      id,
      userId,
      groupId,
    );

    return {
      success: true,
      data: notification,
    };
  }

  @Patch('read-all')
  async markAllAsRead(
    @Headers('x-group-id') headerGroupId?: string,
    @Headers('x-user-id') headerUserId?: string,
    @Query('groupId') queryGroupId?: string,
    @Query('userId') queryUserId?: string,
  ) {
    const groupId = headerGroupId || queryGroupId;
    const userId = headerUserId || queryUserId || '';

    const result = await this.notificationsService.markAllAsRead(userId, groupId);

    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id')
  async deleteNotification(
    @Param('id') id: string,
    @Headers('x-group-id') headerGroupId?: string,
    @Headers('x-user-id') headerUserId?: string,
    @Query('groupId') queryGroupId?: string,
    @Query('userId') queryUserId?: string,
  ) {
    const groupId = headerGroupId || queryGroupId;
    const userId = headerUserId || queryUserId || '';

    const result = await this.notificationsService.deleteNotification(
      id,
      userId,
      groupId,
    );

    return {
      success: true,
      data: result,
    };
  }
}
