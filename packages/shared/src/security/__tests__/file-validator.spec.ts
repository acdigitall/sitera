import { describe, it, expect } from 'vitest';
import {
  detectMagicMimeType,
  detectMaliciousSignatures,
  validateFileName,
  validateDataUri,
  PHOTO_ALLOWED_MIME_TYPES,
  RECEIPT_ALLOWED_MIME_TYPES,
} from '../file-validator';

describe('File Security & Validation Engine (Shared)', () => {
  describe('1. Magic Byte (Binary Signature) Verification', () => {
    it('JPEG imzasını (FF D8 FF) doğru tespit etmelidir', () => {
      const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
      expect(detectMagicMimeType(jpegHeader)).toBe('image/jpeg');
    });

    it('PNG imzasını (89 50 4E 47 0D 0A 1A 0A) doğru tespit etmelidir', () => {
      const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(detectMagicMimeType(pngHeader)).toBe('image/png');
    });

    it('PDF imzasını (%PDF- / 25 50 44 46 2D) doğru tespit etmelidir', () => {
      const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
      expect(detectMagicMimeType(pdfHeader)).toBe('application/pdf');
    });

    it('WebP imzasını (RIFF....WEBP) doğru tespit etmelidir', () => {
      const webpHeader = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x20, 0x00, 0x00, 0x00, // size
        0x57, 0x45, 0x42, 0x50, // WEBP
      ]);
      expect(detectMagicMimeType(webpHeader)).toBe('image/webp');
    });

    it('Düz metin veya sahte içeriği geçersiz saymalıdır', () => {
      const textHeader = new TextEncoder().encode('Hello World this is plain text');
      expect(detectMagicMimeType(textHeader)).toBeNull();
    });
  });

  describe('2. Kötü Amaçlı Dosya & Polyglot Taraması (Anti-Malware Heuristics)', () => {
    it('Windows çalıştırılabilir dosyalarını (MZ / PE) tespit edip engellemelidir', () => {
      const peBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]); // MZ
      const warning = detectMaliciousSignatures(peBytes);
      expect(warning).toContain('Windows');
    });

    it('Linux ELF ikili dosyalarını tespit edip engellemelidir', () => {
      const elfBytes = new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01]); // \x7FELF
      const warning = detectMaliciousSignatures(elfBytes);
      expect(warning).toContain('Linux');
    });

    it('Gömülü zararlı script desenlerini (<script>, javascript:, <?php) engellemelidir', () => {
      const maliciousHtmlInImage = new TextEncoder().encode(
        '\xFF\xD8\xFF\xE0<script>alert("XSS")</script>',
      );
      const warning = detectMaliciousSignatures(maliciousHtmlInImage);
      expect(warning).toContain('<script');
    });

    it('PDF içerisindeki tehlikeli /Launch aksiyonlarını tespit etmelidir', () => {
      const maliciousPdf = new TextEncoder().encode(
        '%PDF-1.4\n/Type /Action /S /Launch /F (cmd.exe)',
      );
      const warning = detectMaliciousSignatures(maliciousPdf);
      expect(warning).toContain('/launch');
    });
  });

  describe('3. Dosya Adı ve Çift Uzantı Kontrolü', () => {
    it('Geçerli dosya isimlerini onaylamalıdır', () => {
      expect(validateFileName('dekont-mart-2026.pdf').isValid).toBe(true);
      expect(validateFileName('bina_hasar_fotografi.jpeg').isValid).toBe(true);
    });

    it('Tehlikeli uzantıları engellemelidir (.exe, .php, .sh, .bat)', () => {
      expect(validateFileName('trojan.exe').isValid).toBe(false);
      expect(validateFileName('shell.php').isValid).toBe(false);
      expect(validateFileName('script.sh').isValid).toBe(false);
    });

    it('Çift uzantılı gizli dosyaları engellemelidir (.php.jpg, .pdf.exe)', () => {
      const res = validateFileName('dekont.php.jpg');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Çift uzantılı');
    });

    it('Dizin geçişi (path traversal) girişimlerini engellemelidir', () => {
      expect(validateFileName('../../etc/passwd.png').isValid).toBe(false);
    });
  });

  describe('4. Base64 Data URI Doğrulaması (Sunucu ve İstemci)', () => {
    it('Geçerli bir PNG Data URI başarıyla onaylanmalıdır', () => {
      // 8-byte PNG signature encoded in base64
      const pngBase64 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString(
        'base64',
      );
      const dataUri = `data:image/png;base64,${pngBase64}`;

      const res = validateDataUri(dataUri, {
        allowedMimeTypes: PHOTO_ALLOWED_MIME_TYPES,
      });

      expect(res.isValid).toBe(true);
      expect(res.detectedMimeType).toBe('image/png');
    });

    it('Geçerli bir PDF dekontu onaylanmalıdır', () => {
      const pdfBase64 = Buffer.from('%PDF-1.4 sample bank receipt content').toString('base64');
      const dataUri = `data:application/pdf;base64,${pdfBase64}`;

      const res = validateDataUri(dataUri, {
        allowedMimeTypes: RECEIPT_ALLOWED_MIME_TYPES,
      });

      expect(res.isValid).toBe(true);
      expect(res.detectedMimeType).toBe('application/pdf');
    });

    it('Fotoğraf alanına PDF yüklendiğinde reddetmelidir (Whitelisting)', () => {
      const pdfBase64 = Buffer.from('%PDF-1.4 sample content').toString('base64');
      const dataUri = `data:application/pdf;base64,${pdfBase64}`;

      const res = validateDataUri(dataUri, {
        allowedMimeTypes: PHOTO_ALLOWED_MIME_TYPES, // PDF not allowed for photos
      });

      expect(res.isValid).toBe(false);
      expect(res.errorCode).toBe('INVALID_MIME_TYPE');
    });

    it('Sahte MIME tipi (MIME spoofing) girişimini engellemelidir', () => {
      // Claiming image/png but payload is actually plain text
      const fakePng = Buffer.from('Plain text masquerading as PNG').toString('base64');
      const dataUri = `data:image/png;base64,${fakePng}`;

      const res = validateDataUri(dataUri, {
        allowedMimeTypes: PHOTO_ALLOWED_MIME_TYPES,
      });

      expect(res.isValid).toBe(false);
    });

    it('Boyut sınırını aşan dosyaları reddetmelidir', () => {
      const largeBase64 = Buffer.alloc(300, 0).toString('base64');
      const dataUri = `data:image/png;base64,${largeBase64}`;

      const res = validateDataUri(dataUri, {
        maxSizeBytes: 100, // Very small limit for test
      });

      expect(res.isValid).toBe(false);
      expect(res.errorCode).toBe('FILE_TOO_LARGE');
    });
  });
});
