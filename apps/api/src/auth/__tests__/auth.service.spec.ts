import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService (Şifreleme, Oturum & Güvenlik Testleri)', () => {
  let service: AuthService;
  let usersRepo: any;
  let groupsRepo: any;
  let dataSource: any;
  let redis: any;
  let auditLogsService: any;

  const rawPassword = 'SecurePassword123!';
  let validHashedPassword: string;

  beforeEach(() => {
    usersRepo = {
      findOne: vi.fn(),
      create: vi.fn((dto) => dto),
      save: vi.fn((dto) => Promise.resolve(dto)),
      createQueryBuilder: vi.fn(),
    };

    groupsRepo = {
      findOne: vi.fn(),
    };

    dataSource = {};

    redis = {
      get: vi.fn(),
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
    };

    auditLogsService = {
      recordLog: vi.fn().mockResolvedValue({ id: 'log-1' }),
    };

    service = new AuthService(usersRepo, groupsRepo, dataSource, redis, auditLogsService);
    validHashedPassword = service.hashPassword(rawPassword);
  });

  describe('hashPassword & verifyPassword (PBKDF2 Kriptografik Şifreleme)', () => {
    it('Şifreyi salt:hash formatında kriptografik olarak güvenli hashlemelidir', () => {
      const hash = service.hashPassword(rawPassword);
      expect(hash).toContain(':');
      const [salt, key] = hash.split(':');
      expect(salt.length).toBe(32); // 16 bytes hex
      expect(key.length).toBe(128); // 64 bytes sha512 hex
    });

    it('Doğru şifre ile hash doğrulamasını başarılı (true) yapmalıdır', () => {
      const isValid = service.verifyPassword(rawPassword, validHashedPassword);
      expect(isValid).toBe(true);
    });

    it('Yanlış şifre ile doğrulamayı başarısız (false) yapmalıdır', () => {
      const isValid = service.verifyPassword('WrongPass999!', validHashedPassword);
      expect(isValid).toBe(false);
    });

    it('Legacy düz metin şifreleri geriye dönük uyumlulukla doğrulayabilmelidir', () => {
      const legacyPlainText = 'plainPassword123';
      expect(service.verifyPassword('plainPassword123', legacyPlainText)).toBe(true);
      expect(service.verifyPassword('otherPass', legacyPlainText)).toBe(false);
    });
  });

  describe('login (Oturum Açma & Audit Doğrulaması)', () => {
    it('Geçerli e-posta ve şifre ile oturum açıp Redis oturum tokenı üretmeli ve log kaydetmelidir', async () => {
      const mockUser = {
        id: 'usr-123',
        email: 'sakin@site.com',
        password: validHashedPassword,
        name: 'Ahmet Yılmaz',
        role: 'member',
        groupId: 'grp-1',
        isActive: true,
        group: { id: 'grp-1', name: 'Gencosman Apartmanı', slug: 'gencosman' },
      };

      usersRepo.createQueryBuilder.mockReturnValue({
        addSelect: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(mockUser),
      });

      const response = await service.login({
        email: 'sakin@site.com',
        password: rawPassword,
      });

      expect(response.token).toBeDefined();
      expect(response.token.startsWith('sitera_tok_')).toBe(true);
      expect(response.user.id).toBe('usr-123');
      expect(response.user.role).toBe('member');
      expect(redis.set).toHaveBeenCalled();
      expect(auditLogsService.recordLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'AUTH_LOGIN_SUCCESS',
          level: 'INFO',
        }),
      );
    });

    it('Hatalı şifre girildiğinde UnauthorizedException fırlatmalı ve WARN audit log kaydetmelidir', async () => {
      const mockUser = {
        id: 'usr-123',
        email: 'sakin@site.com',
        password: validHashedPassword,
        name: 'Ahmet Yılmaz',
        role: 'member',
        groupId: 'grp-1',
        isActive: true,
      };

      usersRepo.createQueryBuilder.mockReturnValue({
        addSelect: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(mockUser),
      });

      await expect(
        service.login({
          email: 'sakin@site.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(auditLogsService.recordLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'AUTH_LOGIN_FAILED',
          level: 'WARN',
        }),
      );
    });

    it('Kullanıcı pasif durumda ise girişi engelleyip hata fırlatmalıdır', async () => {
      const mockInactiveUser = {
        id: 'usr-inactive',
        email: 'pasif@site.com',
        password: validHashedPassword,
        name: 'Pasif Sakin',
        role: 'member',
        isActive: false,
      };

      usersRepo.createQueryBuilder.mockReturnValue({
        addSelect: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(mockInactiveUser),
      });

      await expect(
        service.login({
          email: 'pasif@site.com',
          password: rawPassword,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout (Oturum Kapatma)', () => {
    it('Geçerli token ile çıkış yapıldığında Redis oturumunu silmeli ve log atmalıdır', async () => {
      const token = 'sitera_tok_mock123';
      redis.get.mockResolvedValueOnce({
        userId: 'usr-123',
        name: 'Ahmet Yılmaz',
        role: 'member',
      });

      const res = await service.logout(`Bearer ${token}`);

      expect(res).toBe(true);
      expect(redis.del).toHaveBeenCalledWith(`session:${token}`);
      expect(auditLogsService.recordLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'AUTH_LOGOUT',
        }),
      );
    });
  });
});
