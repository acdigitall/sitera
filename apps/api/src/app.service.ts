import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppHealthStatus, APP_NAME, API_VERSION } from '@sitera/shared';
import { RedisService } from './redis/redis.service';

@Injectable()
export class AppService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redis: RedisService,
  ) {}

  async getHealth(): Promise<AppHealthStatus & { database: string; redis: string }> {
    let dbStatus = 'disconnected';
    try {
      if (this.dataSource.isInitialized) {
        await this.dataSource.query('SELECT 1');
        dbStatus = 'connected (PostgreSQL RLS Active)';
      }
    } catch {
      dbStatus = 'error';
    }

    const redisStatus = this.redis.getIsConnected() ? 'connected' : 'disconnected';

    return {
      status: dbStatus.startsWith('connected') ? 'ok' : 'degraded',
      version: API_VERSION,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      redis: redisStatus,
    };
  }

  getWelcome(): { message: string; project: string; tenancyModel: string } {
    return {
      message: `Welcome to ${APP_NAME} Enterprise Monorepo API`,
      project: APP_NAME,
      tenancyModel: 'Shared DB + group_id + PostgreSQL RLS + Redis Cache',
    };
  }
}
