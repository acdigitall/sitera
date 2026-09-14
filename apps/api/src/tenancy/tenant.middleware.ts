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

    const isProduction = process.env.NODE_ENV === 'production';
    const allowDevHeaders = !isProduction && process.env.ALLOW_DEV_HEADERS === 'true';

    // In production or when dev headers are not explicitly enabled, purge untrusted spoofable headers
    if (!allowDevHeaders) {
      delete req.headers['x-user-role'];
      delete req.headers['x-user-id'];
    }

    let userId = '';
    let userRole = '';

    // If Bearer token is provided, extract session information strictly from verified Redis session
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      if (token) {
        const session = await this.redis.get<{
          userId: string;
          groupId: string;
          role: string;
          email?: string;
          name?: string;
        }>(`session:${token}`);

        if (session) {
          // Strictly take user identity and role from verified session (NEVER allow client headers to override)
          userId = session.userId || '';
          userRole = session.role || '';
          (req as any).user = session;

          if (!groupId && session.groupId) {
            groupId = session.groupId;
          }
        }
      }
    }

    // Controlled dev fallback: ONLY when NOT in production AND explicitly permitted by config
    if (!userId && !userRole && allowDevHeaders) {
      userId = (req.headers['x-user-id'] || '') as string;
      userRole = (req.headers['x-user-role'] || '') as string;
      if (userRole) {
        (req as any).user = { id: userId, role: userRole };
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
