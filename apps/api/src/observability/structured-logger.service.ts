import { Injectable, LoggerService, LogLevel } from '@nestjs/common';

export interface StructuredLogPayload {
  timestamp: string;
  level: string;
  context?: string;
  message: string;
  correlationId?: string;
  tenantId?: string;
  userId?: string;
  durationMs?: number;
  req?: {
    method: string;
    url: string;
    ip?: string;
    userAgent?: string;
  };
  details?: Record<string, any>;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
}

@Injectable()
export class StructuredLoggerService implements LoggerService {
  private isProduction = process.env.NODE_ENV === 'production';

  log(message: any, context?: string, details?: Record<string, any>): void {
    this.writeLog('INFO', message, context, details);
  }

  error(message: any, trace?: string, context?: string, details?: Record<string, any>): void {
    this.writeLog('ERROR', message, context, {
      ...details,
      error: { message: typeof message === 'string' ? message : message?.message, stack: trace },
    });
  }

  warn(message: any, context?: string, details?: Record<string, any>): void {
    this.writeLog('WARN', message, context, details);
  }

  debug(message: any, context?: string, details?: Record<string, any>): void {
    if (!this.isProduction) {
      this.writeLog('DEBUG', message, context, details);
    }
  }

  verbose(message: any, context?: string, details?: Record<string, any>): void {
    if (!this.isProduction) {
      this.writeLog('VERBOSE', message, context, details);
    }
  }

  /**
   * Yapılandırılmış JSON çıktısı üretir
   */
  private writeLog(
    level: string,
    message: any,
    context?: string,
    extra?: Record<string, any>,
  ): void {
    const payload: StructuredLogPayload = {
      timestamp: new Date().toISOString(),
      level,
      context: context || 'Application',
      message: typeof message === 'string' ? message : JSON.stringify(message),
      ...extra,
    };

    if (this.isProduction) {
      // Üretim ortamı: Tek satırlı JSON (Datadog, Grafana Loki, CloudWatch uyumlu)
      const json = JSON.stringify(payload);
      if (level === 'ERROR') {
        process.stderr.write(json + '\n');
      } else {
        process.stdout.write(json + '\n');
      }
    } else {
      // Geliştirme ortamı: Okunabilir renkli terminal çıktısı + JSON detay
      const color =
        level === 'ERROR'
          ? '\x1b[31m'
          : level === 'WARN'
          ? '\x1b[33m'
          : level === 'DEBUG'
          ? '\x1b[35m'
          : '\x1b[32m';
      const reset = '\x1b[0m';
      const ctx = context ? `[${context}] ` : '';
      const metaStr = extra && Object.keys(extra).length > 0 ? ` ${JSON.stringify(extra)}` : '';

      console.log(
        `${payload.timestamp} ${color}${level.padEnd(5)}${reset} ${ctx}${payload.message}${metaStr}`,
      );
    }
  }
}
