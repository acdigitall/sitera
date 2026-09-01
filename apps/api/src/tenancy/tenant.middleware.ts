import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from './tenant.context';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly redis: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant identifier from header (x-group-id / x-tenant-id) or query param
    let groupId = (req.headers['x-group-id'] ||
      req.headers['x-tenant-id'] ||
      req.query.group_id ||
      req.query.groupId ||
      '') as string;

    let userId = (req.headers['x-user-id'] || '') as string;
    let userRole = (req.headers['x-user-role'] || '') as string;

    // If Bearer token is provided, extract session information
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      const session = await this.redis.get<{
        userId: string;
        groupId: string;
        role: string;
      }>(`session:${token}`);

      if (session) {
        userId = userId || session.userId;
        userRole = userRole || session.role;
        if (!groupId && session.groupId) {
          groupId = session.groupId;
        }
      }
    }

    TenantContext.run(
      {
        groupId: groupId.trim() || undefined,
        userId: userId.trim() || undefined,
        userRole: userRole.trim() || undefined,
        timestamp: Date.now(),
      },
      () => {
        next();
      },
    );
  }
}
