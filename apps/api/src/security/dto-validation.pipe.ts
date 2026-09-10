import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { validateDto, sanitizeObject, DtoSchema } from '@sitera/shared';

@Injectable()
export class DtoValidationPipe implements PipeTransform {
  constructor(@Optional() private readonly schema?: DtoSchema<any>) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') return value;
    if (!value || typeof value !== 'object') return value;

    if (this.schema) {
      const result = validateDto(value, this.schema, {
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

      return result.sanitizedData;
    }

    return sanitizeObject(value);
  }
}
