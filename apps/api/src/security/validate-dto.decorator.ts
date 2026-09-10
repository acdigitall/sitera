import { SetMetadata, CustomDecorator } from '@nestjs/common';
import { DtoSchema } from '@sitera/shared';

export const VALIDATE_DTO_KEY = 'validate_dto_schema';

export const ValidateDto = (schema: DtoSchema<any>): CustomDecorator<string> =>
  SetMetadata(VALIDATE_DTO_KEY, schema);
