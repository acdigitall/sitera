import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FinanceController } from '../finance.controller';
import { FinanceService } from '../finance.service';

describe('FinanceController (API & Route Entegrasyon Testleri)', () => {
  let controller: FinanceController;
  let service: FinanceService;

  const mockGroupId = 'test-group-456';

  beforeEach(() => {
    service = {
      getSettings: vi.fn().mockResolvedValue({ id: 'set-1', defaultDuesAmount: 1250 }),
      updateSettings: vi.fn().mockResolvedValue({ id: 'set-1', defaultDuesAmount: 1500 }),
      autoGenerateMonthlyDues: vi.fn().mockResolvedValue({ period: { id: 'p-1' }, createdDebtsCount: 10 }),
      getPeriods: vi.fn().mockResolvedValue([{ id: 'p-1', name: 'Ağustos 2026' }]),
      createPeriod: vi.fn().mockResolvedValue({ id: 'p-new', name: 'Eylül 2026' }),
      deletePeriod: vi.fn().mockResolvedValue(true),
      getDebts: vi.fn().mockResolvedValue([{ id: 'd-1', amount: 1250 }]),
      createDebt: vi.fn().mockResolvedValue({ id: 'd-new', amount: 500 }),
      getPendingPayments: vi.fn().mockResolvedValue([{ id: 'pay-1', status: 'pending' }]),
      approvePayment: vi.fn().mockResolvedValue({ id: 'pay-1', status: 'approved' }),
      rejectPayment: vi.fn().mockResolvedValue({ id: 'pay-1', status: 'rejected' }),
      createPayment: vi.fn().mockResolvedValue({ id: 'pay-new', status: 'approved' }),
      recordCashCollection: vi.fn().mockResolvedValue({ id: 'pay-cash', status: 'approved', channel: 'cash' }),
      dischargeResident: vi.fn().mockResolvedValue({ success: true, unpaidDebtsTotal: 1500 }),
      getAccounts: vi.fn().mockResolvedValue([{ id: 'acc-1', balance: 50000 }]),
      getExpenses: vi.fn().mockResolvedValue([{ id: 'exp-1', amount: 2500 }]),
      getSummary: vi.fn().mockResolvedValue({ totalLiquidity: 50000, totalReceivable: 10000 }),
    } as unknown as FinanceService;

    controller = new FinanceController(service);
  });

  describe('GET /finance/settings & PATCH /finance/settings', () => {
    it('ayarları getirmeli ve standard API yanıtı ({ success: true, data }) dönmelidir', async () => {
      const response = await controller.getSettings(mockGroupId);
      expect(response).toEqual({
        success: true,
        data: { id: 'set-1', defaultDuesAmount: 1250 },
      });
      expect(service.getSettings).toHaveBeenCalledWith(mockGroupId);
    });

    it('ayarları güncelleyebilmelidir', async () => {
      const dto = { defaultDuesAmount: 1500 };
      const response = await controller.updateSettings(dto, mockGroupId);
      expect(response.success).toBe(true);
      expect(service.updateSettings).toHaveBeenCalledWith(dto, mockGroupId);
    });
  });

  describe('POST /finance/auto-generate', () => {
    it('otomatik tahakkuk tetiklemeli ve force bayrağını iletmelidir', async () => {
      const response = await controller.autoGenerate(true, mockGroupId);
      expect(response.success).toBe(true);
      expect(service.autoGenerateMonthlyDues).toHaveBeenCalledWith(mockGroupId, true);
    });
  });

  describe('GET & POST /finance/debts', () => {
    it('borçları userId ve unit filtreleriyle getirebilmelidir', async () => {
      const response = await controller.getDebts('user-1', 'Daire 3', mockGroupId);
      expect(response.success).toBe(true);
      expect(service.getDebts).toHaveBeenCalledWith(mockGroupId, 'user-1', 'Daire 3');
    });

    it('yeni borç tahakkuk kaydı oluşturabilmelidir', async () => {
      const dto = {
        unit: 'Daire 5',
        title: 'Özel Garaj Kumandası',
        amount: 500,
        dueDate: '2026-09-30',
      };
      const response = await controller.createDebt(dto, mockGroupId);
      expect(response.success).toBe(true);
      expect(service.createDebt).toHaveBeenCalledWith(dto, mockGroupId);
    });
  });

  describe('POST /finance/payments/:id/approve & reject', () => {
    it('ödemeyi yönetici kimliğiyle onaylayabilmelidir', async () => {
      const response = await controller.approvePayment('pay-1', 'admin-id', mockGroupId);
      expect(response.success).toBe(true);
      expect(service.approvePayment).toHaveBeenCalledWith('pay-1', 'admin-id', mockGroupId);
    });

    it('ödemeyi reddedebilmelidir', async () => {
      const response = await controller.rejectPayment('pay-1', mockGroupId);
      expect(response.success).toBe(true);
      expect(service.rejectPayment).toHaveBeenCalledWith('pay-1', mockGroupId);
    });
  });

  describe('POST /finance/cash-collection', () => {
    it('elden nakit tahsilat kaydını oluşturabilmelidir', async () => {
      const dto = {
        debtId: 'd-1',
        unit: 'Daire 2',
        amount: 1250,
      };
      const response = await controller.recordCashCollection(dto, 'admin-1', mockGroupId);
      expect(response.success).toBe(true);
      expect(service.recordCashCollection).toHaveBeenCalledWith(dto, 'admin-1', mockGroupId);
    });
  });

  describe('POST /finance/discharge', () => {
    it('sakin ilişik kesme işlemini yürütebilmelidir', async () => {
      const dto = {
        userId: 'user-exit',
        unit: 'Daire 9',
      };
      const response = await controller.dischargeResident(dto, mockGroupId);
      expect(response.success).toBe(true);
      expect(response.data.unpaidDebtsTotal).toBe(1500);
      expect(service.dischargeResident).toHaveBeenCalledWith(dto, mockGroupId);
    });
  });

  describe('GET /finance/summary', () => {
    it('finansal özet metriklerini dönebilmelidir', async () => {
      const response = await controller.getSummary(mockGroupId);
      expect(response.success).toBe(true);
      expect(response.data.totalLiquidity).toBe(50000);
      expect(service.getSummary).toHaveBeenCalledWith(mockGroupId);
    });
  });
});
