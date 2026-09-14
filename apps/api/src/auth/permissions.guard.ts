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
    const isProduction = process.env.NODE_ENV === 'production';
    const allowDevHeaders = !isProduction && process.env.ALLOW_DEV_HEADERS === 'true';

    // Strictly resolve user role from authenticated user object or verified TenantContext
    let userRole = request.user?.role || TenantContext.getUserRole();

    // Controlled dev fallback: ONLY when NOT in production AND explicitly permitted by config
    if (!userRole && allowDevHeaders) {
      userRole = request.headers?.['x-user-role'];
    }

    if (!userRole) {
      throw new ForbiddenException('Kullanıcı rol bilgisi bulunamadı veya oturum geçersiz.');
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
