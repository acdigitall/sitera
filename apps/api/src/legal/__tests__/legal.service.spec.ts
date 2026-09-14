import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LegalService } from '../legal.service';

describe('LegalService (KVKK & Kullanıcı Sözleşmesi Testleri)', () => {
  let service: LegalService;
  let legalRepo: any;

  beforeEach(() => {
    legalRepo = {
      findOne: vi.fn(),
      find: vi.fn().mockResolvedValue([]),
      create: vi.fn((dto) => dto),
      save: vi.fn((dto) => Promise.resolve(dto)),
    };

    service = new LegalService(legalRepo);
  });

  describe('getDocument (Yasal Belge Getirme)', () => {
    it('Veritabanında kayıtlı sözleşme yoksa varsayılan KVKK veya Sözleşme metnini döndürmelidir', async () => {
      legalRepo.findOne.mockResolvedValueOnce(null);

      const doc = await service.getDocument('terms');

      expect(doc).toBeDefined();
      expect(doc.type).toBe('terms');
      expect(doc.title).toBe('Sitera Kullanıcı Sözleşmesi');
      expect(doc.content).toContain('KMK & KVKK Uyumlu');
    });

    it('Veritabanında mevcut olan belgeyi getirmelidir', async () => {
      legalRepo.findOne.mockResolvedValueOnce({
        id: 'doc-1',
        type: 'kvkk',
        title: 'Özel KVKK Metni',
        content: 'Özel KVKK içeriği',
        version: 'v3.0',
        isActive: true,
      });

      const doc = await service.getDocument('kvkk');

      expect(doc.id).toBe('doc-1');
      expect(doc.title).toBe('Özel KVKK Metni');
    });
  });

  describe('updateDocument (Süper Admin Belge Güncelleme)', () => {
    it('Mevcut sözleşme içeriğini ve sürümünü güncelleyebilmelidir', async () => {
      const existingDoc = {
        id: 'doc-1',
        type: 'terms',
        title: 'Eski Başlık',
        content: 'Eski İçerik',
        version: 'v1.0',
        isActive: true,
      };
      legalRepo.findOne.mockResolvedValueOnce(existingDoc);
      legalRepo.save.mockImplementation((d: any) => Promise.resolve(d));

      const updated = await service.updateDocument('terms', {
        title: 'Güncel Kullanıcı Sözleşmesi 2026',
        content: 'Yeni maddeler eklendi.',
        version: 'v2.5',
      });

      expect(updated.title).toBe('Güncel Kullanıcı Sözleşmesi 2026');
      expect(updated.version).toBe('v2.5');
      expect(legalRepo.save).toHaveBeenCalled();
    });
  });
});
