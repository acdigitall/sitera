import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, hasPermission, UserRole } from '@sitera/shared';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { TenantContext } from '../tenancy/tenant.context';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userRole =
      request.user?.role ||
      request.headers?.['x-user-role'] ||
      TenantContext.getUserRole();

    if (!userRole) {
      throw new ForbiddenException('Kullanıcı rol bilgisi bulunamadı.');
    }

    const customPermissions: Permission[] =
      request.user?.customPermissions || [];

    const user = {
      role: userRole as UserRole,
      customPermissions,
    };

    const hasAll = requiredPermissions.every((perm) =>
      hasPermission(user, perm),
    );

    if (!hasAll) {
      throw new ForbiddenException(
        `Yetkisiz işlem: Bu işlem için gerekli yetkilere (${requiredPermissions.join(
          ', ',
        )}) sahip değilsiniz. Mevcut rolünüz: ${userRole}`,
      );
    }

    return true;
  }
}
