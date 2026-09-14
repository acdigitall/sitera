import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TenantMiddleware } from '../tenant.middleware';
import { TenantContext } from '../tenant.context';

describe('TenantMiddleware (Header Role Spoofing & Session Isolation Testleri)', () => {
  let middleware: TenantMiddleware;
  let redisService: any;

  const originalEnv = process.env.NODE_ENV;
  const originalDevHeaders = process.env.ALLOW_DEV_HEADERS;

  beforeEach(() => {
    redisService = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };
    middleware = new TenantMiddleware(redisService);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    process.env.ALLOW_DEV_HEADERS = originalDevHeaders;
  });

  it('Geçerli Bearer Token ile oturum Redis üzerinden doğrulanıp TenantContext ve req.user nesnesine atanmalıdır', async () => {
    const mockSession = {
      userId: 'usr-123',
      groupId: 'grp-456',
      role: 'admin',
      email: 'admin@site.com',
      name: 'Site Yöneticisi',
    };
    redisService.get.mockResolvedValue(mockSession);

    const req: any = {
      headers: {
        authorization: 'Bearer valid_token_abc',
      },
      query: {},
    };
    const res: any = {};
    const next = vi.fn(() => {
      expect(TenantContext.getUserId()).toBe('usr-123');
      expect(TenantContext.getUserRole()).toBe('admin');
      expect(TenantContext.getGroupId()).toBe('grp-456');
    });

    await middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(mockSession);
    expect(redisService.get).toHaveBeenCalledWith('session:valid_token_abc');
  });

  it('Saldırgan token yanında sahte x-user-role ve x-user-id başlığı eklese bile oturum rolü korunmalı, başlıklar ezilmelidir', async () => {
    const mockSession = {
      userId: 'usr-member-99',
      groupId: 'grp-456',
      role: 'member',
      email: 'member@site.com',
      name: 'Normal Sakin',
    };
    redisService.get.mockResolvedValue(mockSession);

    const req: any = {
      headers: {
        authorization: 'Bearer member_token_xyz',
        'x-user-role': 'superadmin',
        'x-user-id': 'usr-admin-victim',
      },
      query: {},
    };
    const res: any = {};
    const next = vi.fn(() => {
      // TenantContext STRICTLY receives session values, not the injected headers
      expect(TenantContext.getUserRole()).toBe('member');
      expect(TenantContext.getUserId()).toBe('usr-member-99');
    });

    await middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.role).toBe('member');
    expect(req.user.userId).toBe('usr-member-99');
  });

  it('Production modunda tokensız istekte x-user-role ve x-user-id başlıkları silinmeli ve yok sayılmalıdır', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_DEV_HEADERS;

    const req: any = {
      headers: {
        'x-user-role': 'superadmin',
        'x-user-id': 'usr-victim',
      },
      query: {},
    };
    const res: any = {};
    const next = vi.fn(() => {
      expect(TenantContext.getUserRole()).toBeUndefined();
      expect(TenantContext.getUserId()).toBeUndefined();
    });

    await middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
    // Headers must be purged
    expect(req.headers['x-user-role']).toBeUndefined();
    expect(req.headers['x-user-id']).toBeUndefined();
    expect(req.user).toBeUndefined();
  });

  it('Geliştirme ortamında ALLOW_DEV_HEADERS=true ayarı ile kontrollü header fallback çalışmalıdır', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ALLOW_DEV_HEADERS = 'true';

    const req: any = {
      headers: {
        'x-user-role': 'admin',
        'x-user-id': 'usr-dev-1',
      },
      query: {},
    };
    const res: any = {};
    const next = vi.fn(() => {
      expect(TenantContext.getUserRole()).toBe('admin');
      expect(TenantContext.getUserId()).toBe('usr-dev-1');
    });

    await middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 'usr-dev-1', role: 'admin' });
  });
});
