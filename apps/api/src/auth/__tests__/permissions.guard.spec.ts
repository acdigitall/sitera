import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../permissions.guard';
import { Permission } from '@sitera/shared';

describe('PermissionsGuard (NestJS Backend RBAC)', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  const createMockContext = (userRole?: string, customPermissions?: Permission[]) => {
    const request = {
      headers: userRole ? { 'x-user-role': userRole } : {},
      user: userRole ? { role: userRole, customPermissions } : undefined,
    };

    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue(request),
      }),
    } as unknown as ExecutionContext;
  };

  it('Rotada yetki tanımlanmamışsa erişime izin vermelidir', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext('member');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('Site Yöneticisi (admin) finansal yönetim rotalarına erişebilmelidir', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['finance:manage']);
    const context = createMockContext('admin');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('Muhasebeci (accountant) finansal yönetim ve onay rotalarına erişebilmelidir', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['finance:manage', 'finance:approve']);
    const context = createMockContext('accountant');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('Denetçi (auditor) finansal raporları GÖREBİLMELİ, ancak finansal işlem yapamamalıdır', () => {
    // 1. Rapor görme yetkisi: Başarılı
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['reports:view']);
    const viewContext = createMockContext('auditor');
    expect(guard.canActivate(viewContext)).toBe(true);

    // 2. Ödeme onaylama yetkisi: Engellenmeli (Forbidden)
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['finance:approve']);
    const approveContext = createMockContext('auditor');
    expect(() => guard.canActivate(approveContext)).toThrow(ForbiddenException);
  });

  it('Güvenlik Görevlisi (security) finansal verilere erişmeye çalıştığında 403 Forbidden fırlatmalıdır', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['finance:view']);
    const context = createMockContext('security');
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('Güvenlik Görevlisi (security) sakin ve duyuru rotalarına erişebilmelidir', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users:view']);
    const context = createMockContext('security');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('Kullanıcı rol bilgisi bulunamadığında 403 Forbidden fırlatmalıdır', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['finance:view']);
    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  describe('Güvenlik: HTTP Header Role Spoofing Koruması', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalDevHeaders = process.env.ALLOW_DEV_HEADERS;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
      process.env.ALLOW_DEV_HEADERS = originalDevHeaders;
    });

    it('Production modunda yetkisiz istek x-user-role: superadmin başlığı gönderse bile 403 ile engellenmelidir', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOW_DEV_HEADERS;

      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['finance:manage']);

      const maliciousRequest = {
        headers: { 'x-user-role': 'superadmin' },
        user: undefined,
      };

      const context = {
        getHandler: vi.fn(),
        getClass: vi.fn(),
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue(maliciousRequest),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('Sakin (member) oturumu olan bir kullanıcı x-user-role: superadmin gönderse bile oturum rolü korunmalı ve engellenmelidir', () => {
      process.env.NODE_ENV = 'production';

      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['finance:manage']);

      const spoofingRequest = {
        headers: { 'x-user-role': 'superadmin' },
        user: { role: 'member', customPermissions: [] },
      };

      const context = {
        getHandler: vi.fn(),
        getClass: vi.fn(),
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue(spoofingRequest),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
