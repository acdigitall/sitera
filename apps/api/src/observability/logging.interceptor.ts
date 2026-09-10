import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Optional,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';
import { StructuredLoggerService } from './structured-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Optional() private readonly metricsService?: MetricsService,
    @Optional() private readonly logger?: StructuredLoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    if (!req) return next.handle();

    const start = Date.now();
    const correlationId =
      req.headers?.['x-request-id'] ||
      `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Correlation ID'yi request ve response başlıklarına iliştir
    req.correlationId = correlationId;
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('X-Request-ID', correlationId);
    }

    const method = req.method || 'GET';
    const url = req.originalUrl || req.url || '/';

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          const statusCode = res?.statusCode || 200;

          if (res && typeof res.setHeader === 'function') {
            res.setHeader('X-Response-Time', `${duration}ms`);
          }

          // 1. Prometheus Metriklerini Güncelle
          if (this.metricsService) {
            this.metricsService.recordHttpRequest(method, url, statusCode, duration);
          }

          // 2. Yavaş İstekleri (Slow Request > 1000ms) Tespit Et ve Uyar
          if (duration > 1000 && this.logger) {
            this.logger.warn(
              `⚠️ Yavaş İstek Uyarısı (Slow Request): [${method}] ${url} yanıt süresi ${duration}ms`,
              'PerformanceMonitoring',
              { correlationId, method, url, durationMs: duration, statusCode },
            );
          }
        },
        error: (err) => {
          const duration = Date.now() - start;
          const statusCode = err?.status || err?.statusCode || 500;

          if (res && typeof res.setHeader === 'function') {
            res.setHeader('X-Response-Time', `${duration}ms`);
          }

          if (this.metricsService) {
            this.metricsService.recordHttpRequest(method, url, statusCode, duration);
          }
        },
      }),
    );
  }
}
