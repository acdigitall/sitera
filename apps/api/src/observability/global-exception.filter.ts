import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  Optional,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { SentryService } from './sentry.service';
import { MetricsService } from './metrics.service';
import { StructuredLoggerService } from './structured-logger.service';

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @Optional() private readonly sentryService?: SentryService,
    @Optional() private readonly metricsService?: MetricsService,
    @Optional() private readonly logger?: StructuredLoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (!response || typeof response.status !== 'function') {
      return;
    }

    const correlationId =
      (request.headers?.['x-request-id'] as string) ||
      `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Beklenmeyen bir sistem hatası oluştu.';
    let errorType = 'Internal Server Error';
    let validationErrors: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resObj = exception.getResponse();
      if (typeof resObj === 'string') {
        message = resObj;
      } else if (typeof resObj === 'object' && resObj !== null) {
        const anyRes = resObj as any;
        message = anyRes.message || message;
        errorType = anyRes.error || errorType;
        validationErrors = anyRes.validationErrors;
      }

      // Hız sınırı aşıldıysa özel metrik kaydet
      if (status === HttpStatus.TOO_MANY_REQUESTS && this.metricsService) {
        this.metricsService.recordRateLimitExceeded();
      }
    } else {
      // 500 Beklenmeyen Sistem Hatası -> Sentry'ye ve Log'a aktar
      const err = exception as Error;
      if (this.sentryService) {
        this.sentryService.captureException(err, {
          req: request,
          correlationId,
          extra: { path: request.url, method: request.method },
        });
      }

      if (this.logger) {
        this.logger.error(
          `[500 Internal Error] ${err?.message || 'Unknown error'}`,
          err?.stack,
          'GlobalExceptionFilter',
          { correlationId, path: request.url, method: request.method },
        );
      }
    }

    // Prometheus Metriği Kaydet
    if (this.metricsService) {
      this.metricsService.recordHttpRequest(
        request.method || 'GET',
        request.url || '/',
        status,
        0,
      );
    }

    // Yanıt başlıklarını ayarla
    response.setHeader('X-Request-ID', correlationId);

    response.status(status).json({
      statusCode: status,
      error: errorType,
      message,
      validationErrors,
      correlationId,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
