import { describe, it, expect } from 'vitest';
import {
  isEmail,
  isPhone,
  isPositiveNumber,
  isStringBounds,
  sanitizeXss,
  sanitizeObject,
  validateDto,
  LOGIN_DTO_SCHEMA,
  CREATE_PAYMENT_DTO_SCHEMA,
  CREATE_TICKET_DTO_SCHEMA,
  CREATE_USER_DTO_SCHEMA,
} from '../input-validator.js';

describe('Girdi Doğrulama & Sanitizasyon Motoru (Input Validator)', () => {
  describe('isEmail', () => {
    it('geçerli e-posta adreslerini doğrulamalıdır', () => {
      expect(isEmail('admin@sitera.app')).toBe(true);
      expect(isEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(isEmail('sakin@apartman.com')).toBe(true);
    });

    it('geçersiz e-posta adreslerini reddetmelidir', () => {
      expect(isEmail('admin')).toBe(false);
      expect(isEmail('admin@')).toBe(false);
      expect(isEmail('@domain.com')).toBe(false);
      expect(isEmail('admin@domain')).toBe(false);
      expect(isEmail('')).toBe(false);
      expect(isEmail(null as any)).toBe(false);
    });
  });

  describe('isPhone', () => {
    it('geçerli telefon numaralarını doğrulamalıdır', () => {
      expect(isPhone('+905551234567')).toBe(true);
      expect(isPhone('05551234567')).toBe(true);
      expect(isPhone('+14155552671')).toBe(true);
      expect(isPhone('0 (555) 123 45 67')).toBe(true);
    });

    it('geçersiz telefon numaralarını reddetmelidir', () => {
      expect(isPhone('123')).toBe(false);
      expect(isPhone('telefon')).toBe(false);
      expect(isPhone('')).toBe(false);
    });
  });

  describe('isPositiveNumber', () => {
    it('pozitif sayıları doğrulamalıdır', () => {
      expect(isPositiveNumber(1500)).toBe(true);
      expect(isPositiveNumber(0.01)).toBe(true);
      expect(isPositiveNumber(1000000)).toBe(true);
    });

    it('sıfır ve negatif sayıları reddetmelidir (allowZero=false)', () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-500)).toBe(false);
      expect(isPositiveNumber(NaN)).toBe(false);
      expect(isPositiveNumber('100' as any)).toBe(false);
    });

    it('allowZero=true olduğunda sıfırı kabul etmelidir', () => {
      expect(isPositiveNumber(0, true)).toBe(true);
      expect(isPositiveNumber(-1, true)).toBe(false);
    });
  });

  describe('isStringBounds', () => {
    it('karakter sınırları içindeki metinleri kabul etmelidir', () => {
      expect(isStringBounds('Sitera Sitesi', 3, 50)).toBe(true);
    });

    it('sınır dışı metinleri reddetmelidir', () => {
      expect(isStringBounds('AB', 3, 50)).toBe(false);
      expect(isStringBounds('123456', 1, 5)).toBe(false);
    });
  });

  describe('sanitizeXss & sanitizeObject', () => {
    it('script etiketlerini ve tehlikeli JS kodlarını temizlemelidir', () => {
      const malicious = '<script>alert("XSS")</script>Merhaba <b>Komşu</b>';
      const clean = sanitizeXss(malicious);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert("XSS")');
      expect(clean).toContain('&lt;b&gt;Komşu&lt;/b&gt;');
    });

    it('javascript: bağlantılarını ve on* event handlerlarını temizlemelidir', () => {
      const payload = '<a href="javascript:stealCookie()" onclick="harm()">Tıkla</a>';
      const clean = sanitizeXss(payload);
      expect(clean).not.toContain('javascript:');
      expect(clean).not.toContain('onclick=');
    });

    it('iframe ve gömülü nesneleri temizlemelidir', () => {
      const payload = '<iframe src="https://evil.com"></iframe>Fotoğraf';
      const clean = sanitizeXss(payload);
      expect(clean).not.toContain('<iframe');
      expect(clean).toContain('Fotoğraf');
    });

    it('sanitizeObject ile derin nesneleri özyinelemeli temizlemelidir', () => {
      const input = {
        title: '<script>hack()</script>Duyuru',
        meta: {
          note: '<img src="x" onerror="evil()"/>Not',
        },
        tags: ['<b>tag1</b>', '<script>bad()</script>tag2'],
      };
      const result = sanitizeObject(input);
      expect(result.title).toBe('Duyuru');
      expect(result.meta.note).not.toContain('onerror=');
      expect(result.tags[1]).toBe('tag2');
    });
  });

  describe('validateDto (Mass-Assignment & Whitelisting)', () => {
    it('geçerli login DTO verisini onaylamalıdır', () => {
      const result = validateDto(
        { email: 'yonetici@sitera.app', password: 'password123' },
        LOGIN_DTO_SCHEMA
      );
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedData?.email).toBe('yonetici@sitera.app');
    });

    it('tanımsız alan enjeksiyonunu (Mass-Assignment) engellemelidir', () => {
      const maliciousPayload = {
        email: 'attacker@sitera.app',
        password: 'password123',
        isAdmin: true, // Beklenmeyen alan!
        role: 'superadmin', // Yetki yükseltme girişimi!
      };

      const result = validateDto(maliciousPayload, LOGIN_DTO_SCHEMA, { forbidNonWhitelisted: true });
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'isAdmin')).toBe(true);
      expect(result.errors.some((e) => e.field === 'role')).toBe(true);
    });

    it('zorunlu alan eksikliğinde hata döndürmelidir', () => {
      const result = validateDto({ unit: 'A-12' }, CREATE_TICKET_DTO_SCHEMA);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'title')).toBe(true);
      expect(result.errors.some((e) => e.field === 'description')).toBe(true);
    });

    it('geçersiz enum değerini reddetmelidir', () => {
      const result = validateDto(
        {
          unit: 'A-12',
          residentName: 'Ahmet Yılmaz',
          title: 'Asansör Bozuk',
          description: '3. katta durmuyor',
          category: 'Geçersiz Kategori', // Enum dışı!
        },
        CREATE_TICKET_DTO_SCHEMA
      );
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'category')).toBe(true);
    });

    it('negatif veya sıfır ödeme tutarını reddetmelidir', () => {
      const result = validateDto(
        {
          unit: 'B-5',
          amount: -1500, // Negatif tutar!
          channel: 'bank_transfer',
        },
        CREATE_PAYMENT_DTO_SCHEMA
      );
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'amount')).toBe(true);
    });

    it('kullanıcı oluşturma DTO doğrulaması ve XSS temizliği yapmalıdır', () => {
      const result = validateDto(
        {
          name: '<script>alert(1)</script>Mehmet Demir',
          email: 'mehmet@sitera.app',
          phone: '05551234567',
          role: 'accountant',
          password: 'securePass123',
        },
        CREATE_USER_DTO_SCHEMA
      );

      expect(result.isValid).toBe(true);
      expect(result.sanitizedData?.name).toBe('Mehmet Demir');
      expect(result.sanitizedData?.role).toBe('accountant');
    });
  });
});
