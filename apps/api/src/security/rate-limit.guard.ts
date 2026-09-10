import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Optional,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../redis/redis.service';
import { AuditLogsService } from '../audit/audit-logs.service';
import { RATE_LIMIT_KEY, RateLimitOptions } from './rate-limit.decorator';

interface MemoryWindow {
  count: number;
  expiresAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly memoryStore = new Map<string, MemoryWindow>();
  private lastCleanup = Date.now();

  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
    @Optional() private readonly auditLogsService?: AuditLogsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    if (!req) return true;

    // 1. İstemci IP ve Yol Bilgisini Belirle
    const forwarded = req.headers ? req.headers['x-forwarded-for'] : undefined;
    const ip = (forwarded ? forwarded.split(',')[0].trim() : req.ip) || '127.0.0.1';
    const path = req.originalUrl || req.url || '';
    const method = (req.method || 'GET').toUpperCase();

    // 2. Kademeli Limit Kurallarını Çözümle
    const endpointConfig = this.resolveLimits(context, path, method, ip);
    const { limit, ttlSeconds } = endpointConfig;

    const now = Date.now();
    const windowSizeMs = ttlSeconds * 1000;
    const windowIdx = Math.floor(now / windowSizeMs);
    const resetTimestampSec = Math.ceil(((windowIdx + 1) * windowSizeMs) / 1000);
    const retryAfterSec = Math.max(1, resetTimestampSec - Math.floor(now / 1000));

    const cacheKey = `ratelimit:${endpointConfig.tier}:${ip}:${windowIdx}`;

    // 3. İstek Sayacını Artır (Redis veya Bellek Fallback)
    const currentCount = await this.incrementCounter(cacheKey, ttlSeconds);

    // 4. Standart HTTP Hız Sınırı Başlıklarını Ekle
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - currentCount));
      res.setHeader('X-RateLimit-Reset', resetTimestampSec);
    }

    // 5. Limit Aşımı Kontrolü
    if (currentCount > limit) {
      if (res && typeof res.setHeader === 'function') {
        res.setHeader('Retry-After', retryAfterSec);
      }

      this.logger.warn(
        `🚨 Hız sınırı aşıldı! IP: ${ip} | Yol: [${method}] ${path} | İstek: ${currentCount}/${limit} | Kategori: ${endpointConfig.tier}`
      );

      // Güvenlik Denetim Günlüğü (Audit Log)
      if (this.auditLogsService) {
        this.auditLogsService
          .log({
            action: 'RATE_LIMIT_EXCEEDED',
            category: 'SECURITY',
            level: 'WARN',
            ipAddress: ip,
            userAgent: req.headers ? req.headers['user-agent'] : 'Unknown',
            details: {
              path,
              method,
              tier: endpointConfig.tier,
              limit,
              ttlSeconds,
              currentCount,
              retryAfterSec,
            },
          })
          .catch(() => {});
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `İstek hız sınırı aşıldı (${endpointConfig.tier}: ${limit} istek / ${ttlSeconds}s). Lütfen ${retryAfterSec} saniye sonra tekrar deneyiniz.`,
          retryAfter: retryAfterSec,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /**
   * İstek hedefine göre uygun hız sınırı kademesini belirler
   */
  private resolveLimits(
    context: ExecutionContext,
    path: string,
    method: string,
    ip: string = '127.0.0.1',
  ): { limit: number; ttlSeconds: number; tier: string } {
    // 1. @RateLimit dekoratörü ile tanımlanmış özel limit var mı?
    const handlerMetadata = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (handlerMetadata) {
      return {
        limit: handlerMetadata.limit,
        ttlSeconds: handlerMetadata.ttlSeconds || 60,
        tier: 'custom',
      };
    }

    // 2. Kademeli Varsayılan Kurallar (Path bazlı)
    // Kademe 1: Kimlik Doğrulama (Brute-force engelleme) -> 5 istek / dakika
    if (path.includes('/auth/login') || path.includes('/auth/register')) {
      return { limit: 5, ttlSeconds: 60, tier: 'auth' };
    }

    // Kademe 2: Dosya/Dekont ve Kritik Yazma Uç Noktaları -> 20 istek / dakika
    if (
      (path.includes('/tickets') || path.includes('/payments') || path.includes('/cash-collection')) &&
      (method === 'POST' || method === 'PUT' || method === 'PATCH')
    ) {
      return { limit: 20, ttlSeconds: 60, tier: 'write_sensitive' };
    }

    // Kademe 3: Genel API Trafiği
    // Local development / developer test ortamında sık Command+Shift+R yapıldığında kilitlenmemesi için
    const isLocalhost =
      ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip === '::ffff:127.0.0.1';
    const isDev = process.env.NODE_ENV !== 'production';

    if (isDev && isLocalhost) {
      return { limit: 5000, ttlSeconds: 60, tier: 'general' };
    }

    return { limit: 120, ttlSeconds: 60, tier: 'general' };
  }

  /**
   * Sayacı Redis üzerinden atomik artırır; Redis kapalıysa yerel belleğe başvurur
   */
  private async incrementCounter(key: string, ttlSeconds: number): Promise<number> {
    try {
      const redisCount = await this.redisService.incr(key, ttlSeconds);
      if (redisCount !== null && redisCount !== undefined) {
        return redisCount;
      }
    } catch {
      // Redis çevrimdışıysa bellek fallback devam eder
    }

    // Bellek Fallback
    this.cleanupMemoryStore();

    const now = Date.now();
    const existing = this.memoryStore.get(key);

    if (existing && existing.expiresAt > now) {
      existing.count += 1;
      return existing.count;
    }

    const newEntry: MemoryWindow = {
      count: 1,
      expiresAt: now + ttlSeconds * 1000,
    };
    this.memoryStore.set(key, newEntry);
    return 1;
  }

  /**
   * Süresi dolmuş bellek sayaçlarını temizler
   */
  private cleanupMemoryStore() {
    const now = Date.now();
    if (now - this.lastCleanup < 30000) return; // Her 30 saniyede bir çalıştır

    for (const [k, v] of this.memoryStore.entries()) {
      if (v.expiresAt <= now) {
        this.memoryStore.delete(k);
      }
    }
    this.lastCleanup = now;
  }
}
