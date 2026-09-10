import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from '../rate-limit.guard';
import { DtoValidationInterceptor } from '../dto-validation.interceptor';
import { DtoValidationPipe } from '../dto-validation.pipe';
import { RedisService } from '../../redis/redis.service';
import { AuditLogsService } from '../../audit/audit-logs.service';
import { RATE_LIMIT_KEY } from '../rate-limit.decorator';
import { VALIDATE_DTO_KEY } from '../validate-dto.decorator';
import { of } from 'rxjs';
import { LOGIN_DTO_SCHEMA, CREATE_PAYMENT_DTO_SCHEMA } from '@sitera/shared';

describe('Güvenlik Katmanı: Rate Limiting & DTO Validasyon Testleri', () => {
  let reflector: Reflector;
  let redisService: RedisService;
  let auditLogsService: AuditLogsService;
  let rateLimitGuard: RateLimitGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn(),
    } as unknown as Reflector;

    redisService = {
      incr: vi.fn().mockResolvedValue(null), // Redis offline/fallback simülasyonu
      ttl: vi.fn().mockResolvedValue(60),
      getIsConnected: vi.fn().mockReturnValue(false),
    } as unknown as RedisService;

    auditLogsService = {
      log: vi.fn().mockResolvedValue({} as any),
    } as unknown as AuditLogsService;

    rateLimitGuard = new RateLimitGuard(reflector, redisService, auditLogsService);
  });

  function createMockContext(options: {
    ip?: string;
    url?: string;
    method?: string;
    body?: any;
    handlerMeta?: any;
  }) {
    const headers: Record<string, string> = {
      'user-agent': 'Vitest-Agent',
    };
    if (options.ip) {
      headers['x-forwarded-for'] = options.ip;
    }

    const responseHeaders: Record<string, any> = {};
    const req = {
      ip: options.ip || '192.168.1.100',
      headers,
      originalUrl: options.url || '/api/general',
      url: options.url || '/api/general',
      method: options.method || 'GET',
      body: options.body || {},
    };

    const res = {
      setHeader: vi.fn((key: string, val: any) => {
        responseHeaders[key] = val;
      }),
      getHeader: (key: string) => responseHeaders[key],
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    return { context, req, res, responseHeaders };
  }

  describe('RateLimitGuard (Kademeli Hız Sınırlayıcı)', () => {
    it('limit altındaki normal istekleri onaylamalı ve HTTP başlıklarını doldurmalıdır', async () => {
      const { context, res, responseHeaders } = createMockContext({
        ip: '10.0.0.1',
        url: '/api/general',
      });

      const allowed = await rateLimitGuard.canActivate(context);
      expect(allowed).toBe(true);
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 120);
      expect(responseHeaders['X-RateLimit-Remaining']).toBeDefined();
      expect(responseHeaders['X-RateLimit-Reset']).toBeDefined();
    });

    it('kimlik doğrulama (/api/auth/login) için 5 istek/dk limitini uygulamalıdır', async () => {
      const ip = '10.0.0.2';

      // İlk 5 istek başarıyla geçmeli
      for (let i = 1; i <= 5; i++) {
        const { context } = createMockContext({
          ip,
          url: '/api/auth/login',
          method: 'POST',
        });
        const allowed = await rateLimitGuard.canActivate(context);
        expect(allowed).toBe(true);
      }

      // 6. istek HTTP 429 Too Many Requests fırlatmalı
      const { context, res } = createMockContext({
        ip,
        url: '/api/auth/login',
        method: 'POST',
      });

      await expect(rateLimitGuard.canActivate(context)).rejects.toThrow(HttpException);
      expect(res.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(Number));
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RATE_LIMIT_EXCEEDED',
          category: 'SECURITY',
          level: 'WARN',
        })
      );
    });

    it('@RateLimit özel dekoratörü tanımlandığında özel limiti işletmelidir', async () => {
      (reflector.getAllAndOverride as any).mockReturnValue({ limit: 2, ttlSeconds: 30 });
      const ip = '10.0.0.3';

      // 1. istek
      const c1 = createMockContext({ ip, url: '/api/custom' });
      await expect(rateLimitGuard.canActivate(c1.context)).resolves.toBe(true);

      // 2. istek
      const c2 = createMockContext({ ip, url: '/api/custom' });
      await expect(rateLimitGuard.canActivate(c2.context)).resolves.toBe(true);

      // 3. istek -> Limit aşımı
      const c3 = createMockContext({ ip, url: '/api/custom' });
      await expect(rateLimitGuard.canActivate(c3.context)).rejects.toThrow(HttpException);
    });

    it('Redis bağlı olduğunda Redis sayacını kullanmalıdır', async () => {
      (redisService.incr as any).mockResolvedValue(1);
      const { context, res } = createMockContext({
        ip: '10.0.0.4',
        url: '/api/general',
      });

      const allowed = await rateLimitGuard.canActivate(context);
      expect(allowed).toBe(true);
      expect(redisService.incr).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 119);
    });
  });

  describe('DtoValidationInterceptor (Mass-Assignment & Whitelist)', () => {
    let interceptor: DtoValidationInterceptor;

    beforeEach(() => {
      interceptor = new DtoValidationInterceptor(reflector);
    });

    it('geçerli login isteğini onaylamalı ve sonraki adıma aktarmalıdır', async () => {
      const { context, req } = createMockContext({
        url: '/api/auth/login',
        method: 'POST',
        body: {
          email: 'admin@sitera.app',
          password: 'secretPassword123',
        },
      });

      const next = {
        handle: vi.fn().mockReturnValue(of({ success: true })),
      };

      const observable = interceptor.intercept(context, next as any);
      observable.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
        },
      });
      expect(next.handle).toHaveBeenCalled();
      expect(req.body.email).toBe('admin@sitera.app');
    });

    it('tanımsız alan enjeksiyonunu (Mass-Assignment) HTTP 400 ile engellemelidir', () => {
      const { context } = createMockContext({
        url: '/api/auth/login',
        method: 'POST',
        body: {
          email: 'admin@sitera.app',
          password: 'secretPassword123',
          role: 'superadmin', // İzinsiz parametre!
          isBypassed: true,   // İzinsiz parametre!
        },
      });

      const next = { handle: vi.fn() };

      expect(() => interceptor.intercept(context, next as any)).toThrowError();
    });

    it('negatif ödeme tutarını ve geçersiz alanları reddetmelidir', () => {
      const { context } = createMockContext({
        url: '/api/finance/payments',
        method: 'POST',
        body: {
          unit: 'A-1',
          amount: -500, // Negatif miktar yasak!
          channel: 'bank_transfer',
        },
      });

      const next = { handle: vi.fn() };

      expect(() => interceptor.intercept(context, next as any)).toThrowError();
    });

    it('gönderilen metinlerdeki XSS etiketlerini temizlemelidir', () => {
      const { context, req } = createMockContext({
        url: '/api/tickets',
        method: 'POST',
        body: {
          unit: 'A-1',
          residentName: 'Sakin Test',
          title: '<script>alert("hack")</script>Temiz Başlık',
          description: '3. kat lambası yanmıyor',
          category: 'Asansör & Elektrik',
        },
      });

      const next = {
        handle: vi.fn().mockReturnValue(of({ success: true })),
      };

      interceptor.intercept(context, next as any);
      expect(req.body.title).toBe('Temiz Başlık');
      expect(req.body.title).not.toContain('<script>');
    });
  });

  describe('DtoValidationPipe (Bağımsız Pipe Kullanımı)', () => {
    it('LOGIN_DTO_SCHEMA ile geçerli veriyi doğrulamalıdır', () => {
      const pipe = new DtoValidationPipe(LOGIN_DTO_SCHEMA);
      const output = pipe.transform(
        { email: 'user@sitera.app', password: 'password123' },
        { type: 'body' }
      );
      expect(output.email).toBe('user@sitera.app');
    });

    it('CREATE_PAYMENT_DTO_SCHEMA ile sıfırdan küçük tutarı reddetmelidir', () => {
      const pipe = new DtoValidationPipe(CREATE_PAYMENT_DTO_SCHEMA);
      expect(() =>
        pipe.transform(
          { unit: 'B-2', amount: 0, channel: 'bank_transfer' },
          { type: 'body' }
        )
      ).toThrowError();
    });
  });
});
