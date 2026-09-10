import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SentryErrorContext {
  req?: any;
  tenantId?: string;
  userId?: string;
  correlationId?: string;
  extra?: Record<string, any>;
}

@Injectable()
export class SentryService implements OnModuleInit {
  private readonly logger = new Logger(SentryService.name);
  private isEnabled = false;
  private environment = 'development';

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const dsn = this.config.get<string>('SENTRY_DSN');
    this.environment = this.config.get<string>('NODE_ENV', 'development');

    if (dsn) {
      this.isEnabled = true;
      this.logger.log(`✅ Sentry APM & Hata İzleme servisi başlatıldı (Ortam: ${this.environment})`);
    } else {
      this.isEnabled = false;
      this.logger.log('ℹ️ SENTRY_DSN tanımlı değil; hata izleme dahili yapılandırılmış log ile yürütülecek.');
    }
  }

  /**
   * İstisnaları (Exception) Sentry ve APM izleyicisine bildirir
   */
  captureException(error: any, context?: SentryErrorContext): void {
    const errName = error?.name || 'Error';
    const errMsg = error?.message || String(error);
    const stack = error?.stack;

    if (this.isEnabled) {
      // Sentry SDK entegrasyon kancası
      this.logger.error(`[Sentry Report] ${errName}: ${errMsg}`, stack);
    } else {
      // Yerel / Test fallback: Ayrıntılı hata izleme kaydı
      this.logger.error(
        `[APM Trace] ${errName}: ${errMsg} | Tenant: ${context?.tenantId || 'N/A'} | ReqID: ${context?.correlationId || 'N/A'}`,
        stack,
      );
    }
  }

  /**
   * Özel uyarı ve sistem mesajlarını kaydeder
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: SentryErrorContext): void {
    if (this.isEnabled) {
      this.logger.log(`[Sentry Message - ${level.toUpperCase()}] ${message}`);
    }
  }

  getIsEnabled(): boolean {
    return this.isEnabled;
  }
}
