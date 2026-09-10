import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRoleLabel,
  UserRole,
} from '@sitera/shared';

describe('Web Role & Permission System Tests', () => {
  it('Mali Müşavir (accountant) rolü için doğru izinleri doğrulamalıdır', () => {
    const accountantUser = { role: 'accountant' as UserRole };

    expect(getRoleLabel(accountantUser.role)).toBe('Mali Müşavir / Muhasebeci');
    expect(hasPermission(accountantUser, 'finance:view')).toBe(true);
    expect(hasPermission(accountantUser, 'finance:manage')).toBe(true);
    expect(hasPermission(accountantUser, 'finance:approve')).toBe(true);
    expect(hasPermission(accountantUser, 'reports:view')).toBe(true);
    expect(hasPermission(accountantUser, 'reports:export')).toBe(true);
    expect(hasPermission(accountantUser, 'audit:view')).toBe(true);

    // Sakin veya sistem yönetimi yetkisi olmamalıdır
    expect(hasPermission(accountantUser, 'users:manage')).toBe(false);
    expect(hasPermission(accountantUser, 'system:manage')).toBe(false);
  });

  it('Denetçi (auditor) rolü için finansal raporları salt-okunur doğrulamalı, işlem yetkisi vermemelidir', () => {
    const auditorUser = { role: 'auditor' as UserRole };

    expect(getRoleLabel(auditorUser.role)).toBe('Denetçi / Denetim Kurulu');
    expect(hasPermission(auditorUser, 'finance:view')).toBe(true);
    expect(hasPermission(auditorUser, 'reports:view')).toBe(true);
    expect(hasPermission(auditorUser, 'audit:view')).toBe(true);

    // İşlem ve onay yetkisi kapalı olmalıdır
    expect(hasPermission(auditorUser, 'finance:manage')).toBe(false);
    expect(hasPermission(auditorUser, 'finance:approve')).toBe(false);
  });

  it('Güvenlik Görevlisi (security) rolü için finans yetkilerini engellemeli, sakin ve duyuru yetkisi vermelidir', () => {
    const securityUser = { role: 'security' as UserRole };

    expect(getRoleLabel(securityUser.role)).toBe('Güvenlik Görevlisi / Danışma');
    expect(hasPermission(securityUser, 'users:view')).toBe(true);
    expect(hasPermission(securityUser, 'announcements:view')).toBe(true);
    expect(hasPermission(securityUser, 'tickets:manage')).toBe(true);

    // Finansal yetkiler KESİNLİKLE kapalı olmalıdır
    expect(hasPermission(securityUser, 'finance:view')).toBe(false);
    expect(hasPermission(securityUser, 'finance:manage')).toBe(false);
    expect(hasPermission(securityUser, 'finance:approve')).toBe(false);
    expect(hasPermission(securityUser, 'reports:view')).toBe(false);
  });
});
