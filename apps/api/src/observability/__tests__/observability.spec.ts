import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetricsService } from '../metrics.service';
import { StructuredLoggerService } from '../structured-logger.service';
import { SentryService } from '../sentry.service';
import { GlobalExceptionFilter } from '../global-exception.filter';
import { LoggingInterceptor } from '../logging.interceptor';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { of, throwError } from 'rxjs';

describe('Gözlemlenebilirlik Katmanı: Metrik, Loglama ve Sentry Testleri', () => {
  describe('MetricsService (Prometheus Metrik Motoru)', () => {
    let service: MetricsService;

    beforeEach(() => {
      service = new MetricsService();
    });

    it('HTTP isteklerini ve sürelerini kaydetmelidir', async () => {
      service.recordHttpRequest('GET', '/api/finance/summary', 200, 45);
      service.recordHttpRequest('GET', '/api/finance/summary', 200, 55);
      service.recordHttpRequest('POST', '/api/tickets', 201, 120);

      const metrics = await service.getPrometheusMetrics();

      expect(metrics).toContain('sitera_http_requests_total{method="GET",path="/api/finance/summary",status="200"} 2');
      expect(metrics).toContain('sitera_http_requests_total{method="POST",path="/api/tickets",status="201"} 1');
      expect(metrics).toContain('sitera_http_request_duration_seconds');
      expect(metrics).toContain('process_resident_memory_bytes');
    });

    it('dinamik URL parametrelerini normalize ederek metrik şişmesini engellemelidir', async () => {
      service.recordHttpRequest('GET', '/api/users/12345', 200, 30);
      service.recordHttpRequest('GET', '/api/users/67890', 200, 35);
      service.recordHttpRequest('GET', '/api/tickets/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 200, 40);

      const metrics = await service.getPrometheusMetrics();

      // Parametreler :id olarak normalize edilmeli
      expect(metrics).toContain('path="/api/users/:id"');
      expect(metrics).toContain('path="/api/tickets/:id"');
    });

    it('hız sınırı aşımını (Rate Limit Exceeded) metriğe işlemelidir', async () => {
      service.recordRateLimitExceeded();
      service.recordRateLimitExceeded();

      const metrics = await service.getPrometheusMetrics();
      expect(metrics).toContain('sitera_rate_limit_exceeded_total 2');
    });
  });

  describe('StructuredLoggerService', () => {
    let logger: StructuredLoggerService;

    beforeEach(() => {
      logger = new StructuredLoggerService();
    });

    it('bilgi, uyarı ve hata loglarını yapılandırılmış formatta yazmalıdır', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.log('Test log mesajı', 'TestContext', { userId: 'usr-1' });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('SentryService', () => {
    let sentry: SentryService;
    let mockConfig: any;

    beforeEach(() => {
      mockConfig = {
        get: vi.fn((key: string, defaultVal?: string) => {
          if (key === 'SENTRY_DSN') return '';
          return defaultVal;
        }),
      };
      sentry = new SentryService(mockConfig);
      sentry.onModuleInit();
    });

    it('DSN yokken güvenli fallback modunda çalışmalıdır', () => {
      expect(sentry.getIsEnabled()).toBe(false);
      // Hata fırlatmamalı
      expect(() => sentry.captureException(new Error('Test Hata'))).not.toThrow();
    });
  });

  describe('GlobalExceptionFilter', () => {
    let filter: GlobalExceptionFilter;
    let mockSentry: SentryService;
    let mockMetrics: MetricsService;
    let mockLogger: StructuredLoggerService;

    beforeEach(() => {
      mockSentry = {
        captureException: vi.fn(),
      } as unknown as SentryService;

      mockMetrics = {
        recordHttpRequest: vi.fn(),
        recordRateLimitExceeded: vi.fn(),
      } as unknown as MetricsService;

      mockLogger = {
        error: vi.fn(),
      } as unknown as StructuredLoggerService;

      filter = new GlobalExceptionFilter(mockSentry, mockMetrics, mockLogger);
    });

    function createMockHost(reqOptions: any = {}) {
      const jsonMock = vi.fn();
      const setHeaderMock = vi.fn();
      const statusMock = vi.fn().mockReturnValue({ json: jsonMock });

      const req = {
        url: reqOptions.url || '/api/test',
        method: reqOptions.method || 'GET',
        headers: reqOptions.headers || {},
      };

      const res = {
        status: statusMock,
        setHeader: setHeaderMock,
      };

      const host = {
        switchToHttp: () => ({
          getRequest: () => req,
          getResponse: () => res,
        }),
      } as unknown as ArgumentsHost;

      return { host, statusMock, jsonMock, setHeaderMock };
    }

    it('HttpException durumunda düzgün JSON formatı ve correlationId dönmelidir', () => {
      const { host, statusMock, jsonMock, setHeaderMock } = createMockHost();

      filter.catch(new HttpException('Bulunamadı', HttpStatus.NOT_FOUND), host);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(setHeaderMock).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Bulunamadı',
          correlationId: expect.any(String),
        }),
      );
    });

    it('500 beklenmeyen sistem hatalarını Sentry ye iletmeli ve güvenli yanıt dönmelidir', () => {
      const { host, statusMock, jsonMock } = createMockHost();

      const secretDbError = new Error('FATAL: password authentication failed for user postgres');
      filter.catch(secretDbError, host);

      expect(mockSentry.captureException).toHaveBeenCalledWith(secretDbError, expect.any(Object));
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Beklenmeyen bir sistem hatası oluştu.',
        }),
      );
    });
  });

  describe('LoggingInterceptor', () => {
    let interceptor: LoggingInterceptor;
    let mockMetrics: MetricsService;
    let mockLogger: StructuredLoggerService;

    beforeEach(() => {
      mockMetrics = {
        recordHttpRequest: vi.fn(),
      } as unknown as MetricsService;

      mockLogger = {
        warn: vi.fn(),
      } as unknown as StructuredLoggerService;

      interceptor = new LoggingInterceptor(mockMetrics, mockLogger);
    });

    it('isteği tamamlayıp X-Request-ID ve X-Response-Time başlıklarını iliştirmelidir', () => {
      const setHeader = vi.fn();
      const req: any = { headers: {}, method: 'GET', url: '/api/tickets' };
      const res: any = { statusCode: 200, setHeader };

      const context: any = {
        switchToHttp: () => ({
          getRequest: () => req,
          getResponse: () => res,
        }),
      };

      const next: any = {
        handle: () => of({ success: true }),
      };

      interceptor.intercept(context, next).subscribe({
        next: (val) => {
          expect(val.success).toBe(true);
        },
      });

      expect(setHeader).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
      expect(setHeader).toHaveBeenCalledWith('X-Response-Time', expect.stringContaining('ms'));
      expect(mockMetrics.recordHttpRequest).toHaveBeenCalledWith('GET', '/api/tickets', 200, expect.any(Number));
    });
  });
});
