import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRoleLabel,
  UserRole,
  Permission,
} from '../types/user';

describe('RBAC & Permission System (@sitera/shared)', () => {
  it('SuperAdmin tüm izinlere (bypass) sahip olmalıdır', () => {
    const superAdmin = { role: 'superadmin' as UserRole };
    expect(hasPermission(superAdmin, 'system:manage')).toBe(true);
    expect(hasPermission(superAdmin, 'finance:manage')).toBe(true);
    expect(hasPermission(superAdmin, 'finance:approve')).toBe(true);
    expect(hasPermission(superAdmin, 'audit:view')).toBe(true);
  });

  it('Site Yöneticisi (Admin) site içi yönetim ve onay yetkilerine sahip olmalıdır', () => {
    const admin = { role: 'admin' as UserRole };
    expect(hasPermission(admin, 'finance:manage')).toBe(true);
    expect(hasPermission(admin, 'finance:approve')).toBe(true);
    expect(hasPermission(admin, 'users:manage')).toBe(true);
    expect(hasPermission(admin, 'audit:view')).toBe(true);
    expect(hasPermission(admin, 'system:manage')).toBe(false);
  });

  it('Mali Müşavir / Muhasebeci (Accountant) finans, ödeme onay ve rapor yetkilerine sahip olmalı; ancak sakin/bina silememelidir', () => {
    const accountant = { role: 'accountant' as UserRole };
    expect(hasPermission(accountant, 'finance:view')).toBe(true);
    expect(hasPermission(accountant, 'finance:manage')).toBe(true);
    expect(hasPermission(accountant, 'finance:approve')).toBe(true);
    expect(hasPermission(accountant, 'reports:view')).toBe(true);
    expect(hasPermission(accountant, 'reports:export')).toBe(true);
    expect(hasPermission(accountant, 'audit:view')).toBe(true);

    // Sakin yönetimi veya sistem yönetimi yapamaz
    expect(hasPermission(accountant, 'users:manage')).toBe(false);
    expect(hasPermission(accountant, 'system:manage')).toBe(false);
  });

  it('Denetçi (Auditor) finansal raporları ve denetim loglarını SALT-OKUNUR görmeli; finansal işlem yapamamalıdır', () => {
    const auditor = { role: 'auditor' as UserRole };
    expect(hasPermission(auditor, 'finance:view')).toBe(true);
    expect(hasPermission(auditor, 'reports:view')).toBe(true);
    expect(hasPermission(auditor, 'reports:export')).toBe(true);
    expect(hasPermission(auditor, 'audit:view')).toBe(true);

    // KMK gereği denetçi icraat yapamaz, ödeme onaylayamaz veya borç silemez
    expect(hasPermission(auditor, 'finance:manage')).toBe(false);
    expect(hasPermission(auditor, 'finance:approve')).toBe(false);
    expect(hasPermission(auditor, 'users:manage')).toBe(false);
  });

  it('Güvenlik Görevlisi (Security) sakin sorgulama yapabilmeli; ancak FİNANSAL VERİLERE ASLA ERİŞEMEMELİDİR', () => {
    const security = { role: 'security' as UserRole };
    // Ziyaretçi/kargo teyidi için sakin listesini görebilir
    expect(hasPermission(security, 'users:view')).toBe(true);
    expect(hasPermission(security, 'announcements:view')).toBe(true);
    expect(hasPermission(security, 'tickets:manage')).toBe(true);

    // Finansal verilere erişim KESİNLİKLE yasaktır
    expect(hasPermission(security, 'finance:view')).toBe(false);
    expect(hasPermission(security, 'finance:manage')).toBe(false);
    expect(hasPermission(security, 'finance:approve')).toBe(false);
    expect(hasPermission(security, 'reports:view')).toBe(false);
    expect(hasPermission(security, 'audit:view')).toBe(false);
  });

  it('Teknik Personel (Staff) iş emirlerini yönetmeli; finansal verilere erişememelidir', () => {
    const staff = { role: 'staff' as UserRole };
    expect(hasPermission(staff, 'tickets:view')).toBe(true);
    expect(hasPermission(staff, 'tickets:manage')).toBe(true);
    expect(hasPermission(staff, 'finance:view')).toBe(false);
  });

  it('Kişiye özel izinler (customPermissions) rol varsayılanını genişletebilmelidir', () => {
    const staffWithCustom = {
      role: 'staff' as UserRole,
      customPermissions: ['announcements:manage' as Permission],
    };

    expect(hasPermission(staffWithCustom, 'announcements:manage')).toBe(true);
    expect(hasPermission(staffWithCustom, 'finance:view')).toBe(false);
  });

  it('hasAnyPermission ve hasAllPermissions yardımcı fonksiyonları doğru çalışmalıdır', () => {
    const accountant = { role: 'accountant' as UserRole };
    expect(hasAnyPermission(accountant, ['system:manage', 'finance:manage'])).toBe(true);
    expect(hasAnyPermission(accountant, ['system:manage', 'tickets:manage'])).toBe(false);
    expect(hasAllPermissions(accountant, ['finance:view', 'finance:approve'])).toBe(true);
    expect(hasAllPermissions(accountant, ['finance:view', 'system:manage'])).toBe(false);
  });

  it('getRoleLabel kullanıcı dostu Türkçe rol isimlerini dönmelidir', () => {
    expect(getRoleLabel('superadmin')).toBe('Süper Admin');
    expect(getRoleLabel('admin')).toBe('Site Yöneticisi');
    expect(getRoleLabel('accountant')).toBe('Mali Müşavir / Muhasebeci');
    expect(getRoleLabel('auditor')).toBe('Denetçi / Denetim Kurulu');
    expect(getRoleLabel('security')).toBe('Güvenlik Görevlisi / Danışma');
    expect(getRoleLabel('staff')).toBe('Teknik Personel');
    expect(getRoleLabel('member')).toBe('Kat Maliki / Sakin');
  });
});
