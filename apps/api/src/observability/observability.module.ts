import { Module, Global } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { StructuredLoggerService } from './structured-logger.service';
import { SentryService } from './sentry.service';
import { LoggingInterceptor } from './logging.interceptor';
import { GlobalExceptionFilter } from './global-exception.filter';
import { RedisModule } from '../redis/redis.module';

@Global()
@Module({
  imports: [RedisModule],
  controllers: [MetricsController],
  providers: [
    MetricsService,
    StructuredLoggerService,
    SentryService,
    LoggingInterceptor,
    GlobalExceptionFilter,
  ],
  exports: [
    MetricsService,
    StructuredLoggerService,
    SentryService,
    LoggingInterceptor,
    GlobalExceptionFilter,
  ],
})
export class ObservabilityModule {}
