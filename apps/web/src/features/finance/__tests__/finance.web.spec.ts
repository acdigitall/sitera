import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { openReceiptInNewTab } from '../finance.api';
import { FinanceCalculationEngine } from '@sitera/shared';

describe('Web Finance Module & Receipt Engine', () => {
  let mockAlert: any;
  let mockOpen: any;

  beforeEach(() => {
    mockAlert = vi.fn();
    mockOpen = vi.fn();

    (globalThis as any).alert = mockAlert;
    (globalThis as any).window = {
      alert: mockAlert,
      open: mockOpen,
    };
    (globalThis as any).document = {
      createElement: vi.fn().mockReturnValue({
        click: vi.fn(),
        setAttribute: vi.fn(),
      }),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    };
    (globalThis as any).atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
    (globalThis as any).URL = {
      createObjectURL: vi.fn().mockReturnValue('blob:http://localhost:3000/mock-uuid'),
      revokeObjectURL: vi.fn(),
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('openReceiptInNewTab (Modal-Free Belge Motoru)', () => {
    it('dekont URLsi yoksa kullanıcıyı uyarmalıdır', () => {
      openReceiptInNewTab(null);
      expect(window.alert).toHaveBeenCalledWith(
        'Bu ödemeye ait yüklenmiş bir dekont belgesi bulunamadı.',
      );
    });

    it('standart HTTP URL dekontunu yeni sekmede açmalıdır', () => {
      openReceiptInNewTab('https://sitera.io/receipts/dekont-123.pdf');
      expect(window.open).toHaveBeenCalledWith(
        'https://sitera.io/receipts/dekont-123.pdf',
        '_blank',
      );
    });

    it('base64 PDF dekontunu ikili Blob URLye dönüştürüp yeni sekmede açmalıdır', () => {
      // "Sitera Test Dekont" base64
      const mockBase64Pdf = 'data:application/pdf;base64,U2l0ZXJhIFRlc3QgRGVrb250';
      openReceiptInNewTab(mockBase64Pdf);

      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(window.open).toHaveBeenCalledWith(
        'blob:http://localhost:3000/mock-uuid',
        '_blank',
      );
    });
  });

  describe('Frontend & Shared Engine Entegrasyonu', () => {
    it('frontend tarafında da ortak hesaplama motoru tam uyumlu çalışmalıdır', () => {
      const split = FinanceCalculationEngine.calculateExpenseSplit({
        calculationMode: 'equal_split',
        totalAmount: 9000,
        units: [{ unit: '1' }, { unit: '2' }, { unit: '3' }],
      });

      expect(split).toHaveLength(3);
      expect(split[0].amount).toBe(3000);
      expect(split[1].amount).toBe(3000);
      expect(split[2].amount).toBe(3000);
    });
  });
});
