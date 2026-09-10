import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>('REDIS_HOST', 'localhost');
    const port = this.config.get<number>('REDIS_PORT', 6379);
    const password = this.config.get<string>('REDIS_PASSWORD', '');

    try {
      this.client = new Redis({
        host,
        port,
        password: password || undefined,
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis bağlantı denemeleri durduruldu (Redis çevrimdışı olabilir)');
            return null; // Stop retrying automatically
          }
          return Math.min(times * 200, 2000);
        },
      });

      this.client.connect().then(() => {
        this.isConnected = true;
        this.logger.log(`✅ Redis bağlantısı sağlandı (${host}:${port})`);
      }).catch((err) => {
        this.isConnected = false;
        this.logger.warn(`Redis sunucusuna bağlanılamadı (${err.message}) - Önbellek geçici olarak bypass edilecek`);
      });
    } catch (err: any) {
      this.logger.warn(`Redis başlatma hatası: ${err.message}`);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      this.logger.error(`Redis get error: ${err}`);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      const payload = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await this.client.set(key, payload, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, payload);
      }
    } catch (err) {
      this.logger.error(`Redis set error: ${err}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.error(`Redis del error: ${err}`);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (err) {
      this.logger.error(`Redis delByPattern error: ${err}`);
    }
  }

  async incr(key: string, ttlSeconds: number = 60): Promise<number | null> {
    if (!this.isConnected || !this.client) return null;
    try {
      const count = await this.client.incr(key);
      if (count === 1 && ttlSeconds > 0) {
        await this.client.expire(key, ttlSeconds);
      }
      return count;
    } catch (err) {
      this.logger.error(`Redis incr error: ${err}`);
      return null;
    }
  }

  async ttl(key: string): Promise<number | null> {
    if (!this.isConnected || !this.client) return null;
    try {
      return await this.client.ttl(key);
    } catch (err) {
      return null;
    }
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }
}
