import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from './tenant.context';

export const CurrentGroupId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return (
      TenantContext.getGroupId() ||
      req.headers['x-group-id'] ||
      req.headers['x-tenant-id'] ||
      req.query?.group_id ||
      undefined
    );
  },
);
