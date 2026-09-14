import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import {
  validateDto,
  sanitizeObject,
  DtoSchema,
  LOGIN_DTO_SCHEMA,
  CREATE_TICKET_DTO_SCHEMA,
  UPDATE_TICKET_STATUS_DTO_SCHEMA,
  CREATE_PAYMENT_DTO_SCHEMA,
  CREATE_PERIOD_DTO_SCHEMA,
  CREATE_DEBT_DTO_SCHEMA,
  CASH_COLLECTION_DTO_SCHEMA,
  UPDATE_FINANCE_SETTINGS_DTO_SCHEMA,
  CREATE_ANNOUNCEMENT_DTO_SCHEMA,
  CREATE_USER_DTO_SCHEMA,
  UPDATE_USER_DTO_SCHEMA,
  CREATE_NOTIFICATION_DTO_SCHEMA,
  CREATE_GROUP_DTO_SCHEMA,
  UPDATE_GROUP_DTO_SCHEMA,
  APPLY_TRIAL_DTO_SCHEMA,
  EXTEND_LICENSE_DTO_SCHEMA,
  FREEZE_GROUP_DTO_SCHEMA,
} from '@sitera/shared';
import { VALIDATE_DTO_KEY } from './validate-dto.decorator';

@Injectable()
export class DtoValidationInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();

    if (req && req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      // 1. Dekoratör veya URL eşleşmesi ile şemayı bul
      const schema = this.resolveSchema(context, req);

      if (schema) {
        // Mass-Assignment Koruması ve Katı Tip Doğrulaması
        const result = validateDto(req.body, schema, {
          forbidNonWhitelisted: true,
          sanitizeStrings: true,
        });

        if (!result.isValid) {
          const errorMessages = result.errors.map((e) => e.message).join('; ');
          throw new BadRequestException({
            statusCode: 400,
            error: 'Bad Request',
            message: `Girdi doğrulama hatası: ${errorMessages}`,
            validationErrors: result.errors,
          });
        }

        // İstek gövdesini temizlenmiş ve whitelisted veri ile değiştir
        req.body = result.sanitizedData;
      } else {
        // Tanımlı şema yoksa genel XSS temizliği uygula
        req.body = sanitizeObject(req.body);
      }
    }

    return next.handle();
  }

  /**
   * Endpoint deklarasyonu veya URL yolundan şemayı tespit eder
   */
  private resolveSchema(context: ExecutionContext, req: any): DtoSchema<any> | null {
    // 1. @ValidateDto dekoratörü var mı?
    const handlerSchema = this.reflector.getAllAndOverride<DtoSchema<any>>(VALIDATE_DTO_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (handlerSchema) {
      return handlerSchema;
    }

    // 2. İstek URL ve metoduna göre otomatik çıkarım (Route Inference)
    const url: string = req.originalUrl || req.url || '';
    const method: string = (req.method || 'GET').toUpperCase();

    // Auth
    if (url.includes('/auth/login') && method === 'POST') {
      return LOGIN_DTO_SCHEMA;
    }

    // Resident Tickets (bina içi arıza & talep - exclude /support platform tickets)
    if (url.includes('/tickets') && !url.includes('/support')) {
      if (method === 'POST') return CREATE_TICKET_DTO_SCHEMA;
      if (method === 'PATCH' || method === 'PUT') return UPDATE_TICKET_STATUS_DTO_SCHEMA;
    }

    // Finance
    if (
      url.includes('/finance/payments') &&
      method === 'POST' &&
      !url.includes('/approve') &&
      !url.includes('/reject')
    ) {
      return CREATE_PAYMENT_DTO_SCHEMA;
    }
    if (url.includes('/finance/periods') && method === 'POST') {
      return CREATE_PERIOD_DTO_SCHEMA;
    }
    if (url.includes('/finance/debts') && method === 'POST') {
      return CREATE_DEBT_DTO_SCHEMA;
    }
    if (url.includes('/finance/cash-collection') && method === 'POST') {
      return CASH_COLLECTION_DTO_SCHEMA;
    }
    if (url.includes('/finance/settings') && (method === 'PATCH' || method === 'PUT')) {
      return UPDATE_FINANCE_SETTINGS_DTO_SCHEMA;
    }

    // Announcements
    if (url.includes('/announcements') && method === 'POST') {
      return CREATE_ANNOUNCEMENT_DTO_SCHEMA;
    }

    // Users
    if (url.includes('/users')) {
      if (method === 'POST') return CREATE_USER_DTO_SCHEMA;
      if (method === 'PATCH' || method === 'PUT') return UPDATE_USER_DTO_SCHEMA;
    }

    // Notifications
    if (url.includes('/notifications') && method === 'POST') {
      return CREATE_NOTIFICATION_DTO_SCHEMA;
    }

    // Groups (Tenants)
    if (url.includes('/groups')) {
      if (url.includes('/trial') && method === 'POST') return APPLY_TRIAL_DTO_SCHEMA;
      if (url.includes('/extend') && method === 'POST') return EXTEND_LICENSE_DTO_SCHEMA;
      if (url.includes('/freeze') && method === 'POST') return FREEZE_GROUP_DTO_SCHEMA;

      const cleanUrl = url.split('?')[0].replace(/\/+$/, '');
      if ((cleanUrl === '/groups' || cleanUrl === '/api/groups') && method === 'POST') {
        return CREATE_GROUP_DTO_SCHEMA;
      }
      if (method === 'PATCH' || method === 'PUT') {
        return UPDATE_GROUP_DTO_SCHEMA;
      }
    }

    return null;
  }
}
