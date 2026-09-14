import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FinanceService } from '../finance.service';
import { PeriodEntity } from '../entities/period.entity';
import { DebtEntity } from '../entities/debt.entity';
import { PaymentEntity } from '../entities/payment.entity';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import { ExpenseEntity } from '../entities/expense.entity';
import { FinanceSettingsEntity } from '../entities/finance-settings.entity';
import { GroupEntity } from '../../groups/group.entity';
import { UserEntity } from '../../users/user.entity';

describe('FinanceService (Servis ve Entegrasyon Testleri)', () => {
  let service: FinanceService;

  // Mock repos
  let periodsRepo: any;
  let debtsRepo: any;
  let paymentsRepo: any;
  let accountsRepo: any;
  let expensesRepo: any;
  let settingsRepo: any;
  let groupsRepo: any;
  let usersRepo: any;
  let dataSource: any;
  let auditLogsService: any;

  const mockGroupId = 'test-group-id-123';

  beforeEach(() => {
    // In-memory helper to mock repository methods
    const createMockRepo = () => ({
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn((dto) => ({ id: 'mock-uuid-' + Math.random().toString(36).slice(2, 7), ...dto })),
      save: vi.fn((entity) => Promise.resolve(entity)),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: vi.fn(),
    });

    periodsRepo = createMockRepo();
    debtsRepo = createMockRepo();
    paymentsRepo = createMockRepo();
    accountsRepo = createMockRepo();
    expensesRepo = createMockRepo();
    settingsRepo = createMockRepo();
    groupsRepo = createMockRepo();
    usersRepo = createMockRepo();

    auditLogsService = {
      recordLog: vi.fn().mockResolvedValue({ id: 'log-1' }),
      getLogs: vi.fn().mockResolvedValue([]),
    };

    const transactionsRepo = createMockRepo() as any;
    const posFeesRepo = createMockRepo() as any;

    const repoMap = new Map<any, any>([
      [PeriodEntity, periodsRepo],
      [DebtEntity, debtsRepo],
      [PaymentEntity, paymentsRepo],
      [FinanceAccountEntity, accountsRepo],
      [ExpenseEntity, expensesRepo],
      [FinanceSettingsEntity, settingsRepo],
      [GroupEntity, groupsRepo],
      [UserEntity, usersRepo],
    ]);

    const mockQueryRunner = {
      connect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([]),
      release: vi.fn().mockResolvedValue(undefined),
      manager: {
        getRepository: vi.fn((entity) => repoMap.get(entity) || createMockRepo()),
      },
    };

    dataSource = {
      createQueryRunner: vi.fn().mockReturnValue(mockQueryRunner),
    };

    service = new FinanceService(
      periodsRepo,
      debtsRepo,
      paymentsRepo,
      accountsRepo,
      expensesRepo,
      settingsRepo,
      transactionsRepo,
      posFeesRepo,
      groupsRepo,
      usersRepo,
      dataSource,
      auditLogsService,
    );
  });

  // ============================================================
  // 1. AYARLAR & YAPILANDIRMA TESTLERİ
  // ============================================================
  describe('getSettings & updateSettings', () => {
    it('ayarlar henüz yoksa KMK %5 gecikme faiziyle varsayılan ayarları oluşturmalıdır', async () => {
      settingsRepo.findOne.mockResolvedValue(null);

      const settings = await service.getSettings(mockGroupId);

      expect(settingsRepo.save).toHaveBeenCalled();
      expect(settings.defaultDuesAmount).toBe(0);
      expect(settings.autoGenerateMonthlyDues).toBe(false);
      expect(settings.lateFeeRate).toBe(5); // KMK %5
      expect(settings.lateFeeEnabled).toBe(true);
      expect(settings.calculationMode).toBe('equal');
    });

    it('mevcut ayarları güncelleyebilmelidir', async () => {
      const existingSettings = {
        id: 'set-1',
        groupId: mockGroupId,
        defaultDuesAmount: 1250,
        lateFeeRate: 5,
        lateFeeEnabled: true,
      };
      settingsRepo.findOne.mockResolvedValue(existingSettings);

      const updated = await service.updateSettings(
        { defaultDuesAmount: 2000, lateFeeRate: 8 },
        mockGroupId,
      );

      expect(settingsRepo.save).toHaveBeenCalled();
      expect(updated.defaultDuesAmount).toBe(2000);
      expect(updated.lateFeeRate).toBe(8);
    });
  });

  // ============================================================
  // 2. OTOMATİK TAHAKKUK ÜRETİMİ (autoGenerateMonthlyDues)
  // ============================================================
  describe('autoGenerateMonthlyDues', () => {
    it('mevcut dönem yoksa yeni dönem açıp dairelere tahakkuk üretmelidir', async () => {
      settingsRepo.findOne.mockResolvedValue({
        groupId: mockGroupId,
        defaultDuesAmount: 1500,
        duesDueDay: 30,
        calculationMode: 'equal',
      });
      periodsRepo.findOne.mockResolvedValue(null); // henuz donem yok
      usersRepo.find.mockResolvedValue([
        { id: 'u1', name: 'Ahmet Yılmaz', units: ['Daire 1'], role: 'member' },
        { id: 'u2', name: 'Mehmet Kaya', units: ['Daire 2'], role: 'member' },
      ]);
      debtsRepo.count.mockResolvedValue(2);

      const result = await service.autoGenerateMonthlyDues(mockGroupId);

      expect(result.period).toBeDefined();
      expect(periodsRepo.save).toHaveBeenCalled();
      expect(debtsRepo.save).toHaveBeenCalled();
    });

    it('dönem zaten varsa ve force=false ise mükerrer tahakkuk üretmemelidir (idempotency)', async () => {
      const existingPeriod = { id: 'p-current', name: 'Ocak 2026', groupId: mockGroupId };
      settingsRepo.findOne.mockResolvedValue({ defaultDuesAmount: 1500 });
      // periodsRepo.findOne call inside autoGenerate:
      periodsRepo.findOne.mockResolvedValue(existingPeriod);
      debtsRepo.count.mockResolvedValue(5);

      const result = await service.autoGenerateMonthlyDues(mockGroupId, false);

      expect(result.period.id).toBe('p-current');
      expect(result.createdDebtsCount).toBe(5);
      // Yeni dönem save edilmemeli
      expect(periodsRepo.save).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // 3. ELDEN NAKİT TAHSİLAT (recordCashCollection)
  // ============================================================
  describe('recordCashCollection', () => {
    it('nakit tahsilat borcu kapatmalı, NAKIT- ödeme kaydı açmalı ve yönetici nakit kasasını artırmalıdır', async () => {
      const existingDebt = {
        id: 'debt-100',
        groupId: mockGroupId,
        unit: 'Daire 4',
        residentName: 'Ayşe Demir',
        amount: 1250,
        paidAmount: 0,
        status: 'unpaid',
      };
      debtsRepo.findOne.mockResolvedValue(existingDebt);

      const cashAccount = {
        id: 'acc-cash',
        groupId: mockGroupId,
        name: 'Yönetici Nakit Kasası',
        type: 'cash',
        balance: 1000,
        lastActivity: '',
      };
      accountsRepo.findOne.mockResolvedValue(cashAccount);

      const result = await service.recordCashCollection(
        {
          debtId: 'debt-100',
          unit: 'Daire 4',
          amount: 1250,
          residentName: 'Ayşe Demir',
          notes: 'Ağustos aidatı elden alındı',
        },
        'admin-user-id',
        mockGroupId,
      );

      // 1. Borç kapanmış olmalı
      expect(existingDebt.status).toBe('paid');
      expect(existingDebt.paidAmount).toBe(1250);
      expect(debtsRepo.save).toHaveBeenCalledWith(existingDebt);

      // 2. Ödeme kaydı onaylı ve nakit olarak açılmalı
      expect(paymentsRepo.save).toHaveBeenCalled();
      expect(result.status).toBe('approved');
      expect(result.channel).toBe('cash');
      expect(result.referenceNo).toContain('NAKIT-');

      // 3. Kasa bakiyesi 1000 + 1250 = 2250 olmalı
      expect(accountsRepo.save).toHaveBeenCalled();
      expect(cashAccount.balance).toBe(2250);
    });
  });

  // ============================================================
  // 4. FAST / HAVALE DEKONT DOĞRULAMA (approvePayment & rejectPayment)
  // ============================================================
  describe('approvePayment & rejectPayment (FAST Onay/Red)', () => {
    it('FAST ödemesi onaylandığında borç paid olmalı, banka bakiyesi artmalı ve audit log kaydedilmelidir', async () => {
      const pendingPayment = {
        id: 'pay-fast-1',
        groupId: mockGroupId,
        debtId: 'debt-50',
        unit: 'Daire 6',
        residentName: 'Can Yurt',
        amount: 2500,
        channel: 'bank_transfer',
        referenceNo: 'FAST884912',
        status: 'pending',
      };
      paymentsRepo.findOne.mockResolvedValue(pendingPayment);

      const existingDebt = {
        id: 'debt-50',
        groupId: mockGroupId,
        amount: 2500,
        paidAmount: 0,
        status: 'unpaid',
      };
      debtsRepo.findOne.mockResolvedValue(existingDebt);

      const bankAccount = {
        id: 'acc-bank',
        groupId: mockGroupId,
        name: 'Ziraat Ana Banka Hesabı',
        type: 'bank',
        isPrimary: true,
        balance: 40000,
        lastActivity: '',
      };
      accountsRepo.findOne.mockResolvedValue(bankAccount);

      const approved = await service.approvePayment('pay-fast-1', 'admin-id', mockGroupId);

      // 1. Ödeme approved olmalı
      expect(approved.status).toBe('approved');
      expect(approved.approvedBy).toBe('admin-id');
      expect(approved.approvedAt).toBeDefined();

      // 2. Borç paid durumuna geçmeli
      expect(existingDebt.status).toBe('paid');
      expect(existingDebt.paidAmount).toBe(2500);

      // 3. Banka bakiyesi artmalı (40000 + 2500 = 42500)
      expect(bankAccount.balance).toBe(42500);
      expect(accountsRepo.save).toHaveBeenCalledWith(bankAccount);

      // 4. Canlı Audit Log atılmalı
      expect(auditLogsService.recordLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PAYMENT_APPROVED',
          category: 'FINANCE',
          resource: expect.stringContaining('Daire 6'),
        }),
      );
    });

    it('FAST ödemesi reddedildiğinde borç unpaid kalmalı, bakiye değişmemeli ve WARN audit log atılmalıdır', async () => {
      const pendingPayment = {
        id: 'pay-fake',
        groupId: mockGroupId,
        debtId: 'debt-50',
        unit: 'Daire 6',
        amount: 2500,
        referenceNo: 'FAKE-FAST',
        status: 'pending',
      };
      paymentsRepo.findOne.mockResolvedValue(pendingPayment);

      const rejected = await service.rejectPayment('pay-fake', mockGroupId);

      expect(rejected.status).toBe('rejected');
      expect(paymentsRepo.save).toHaveBeenCalledWith(pendingPayment);

      // Borç veya banka reposuna save çağrısı gitmemeli
      expect(debtsRepo.save).not.toHaveBeenCalled();
      expect(accountsRepo.save).not.toHaveBeenCalled();

      // Audit log WARN seviyesinde atılmalı
      expect(auditLogsService.recordLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PAYMENT_REJECTED',
          category: 'FINANCE',
          level: 'WARN',
        }),
      );
    });
  });

  // ============================================================
  // 5. SAKİN İLİŞİK KESME (dischargeResident)
  // ============================================================
  describe('dischargeResident', () => {
    it('sakinin dairesini düşürmeli ve ödenmemiş borç toplamını kuruşu kuruşuna raporlamalıdır', async () => {
      const user = {
        id: 'user-leaver',
        name: 'Kemal Sunar',
        groupId: mockGroupId,
        units: ['Daire 5', 'Daire 8'],
      };
      usersRepo.findOne.mockResolvedValue(user);

      const unpaidDebts = [
        { amount: 1500, paidAmount: 500, status: 'unpaid' }, // Kalan 1000
        { amount: 1250, paidAmount: 0, status: 'unpaid' },   // Kalan 1250
      ];
      debtsRepo.find.mockResolvedValue(unpaidDebts);

      const result = await service.dischargeResident(
        { userId: 'user-leaver', unit: 'Daire 5' },
        mockGroupId,
      );

      expect(result.success).toBe(true);
      expect(result.unpaidDebtsTotal).toBe(2250);
      expect(user.units).toEqual(['Daire 8']); // Daire 5 düşürülmüş olmalı
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });
  });

  // ============================================================
  // 6. FİNANSAL ÖZET METRİKLERİ (getSummary)
  // ============================================================
  describe('getSummary', () => {
    it('FinanceCalculationEngine ile tüm mali verileri hatasız konsolide etmelidir', async () => {
      settingsRepo.findOne.mockResolvedValue({
        groupId: mockGroupId,
        annualBudget: 300000,
        lateFeeRate: 5,
        lateFeeEnabled: true,
      });

      accountsRepo.find.mockResolvedValue([
        { balance: 60000 },
        { balance: 15000 },
      ]);

      debtsRepo.find.mockResolvedValue([
        { amount: 2000, paidAmount: 2000, status: 'paid' },
        { amount: 2000, paidAmount: 0, dueDate: '2026-08-01', status: 'unpaid' },
      ]);

      expensesRepo.find.mockResolvedValue([
        { amount: 30000 },
      ]);

      paymentsRepo.count.mockResolvedValue(3);
      periodsRepo.findOne.mockResolvedValue({ name: 'Ağustos 2026', status: 'active' });

      const summary = await service.getSummary(mockGroupId);

      expect(summary.totalLiquidity).toBe(75000);
      expect(summary.totalCollected).toBe(2000);
      expect(summary.totalReceivable).toBe(2000);
      expect(summary.collectionRate).toBe(50);
      expect(summary.pendingApprovalsCount).toBe(3);
      expect(summary.activePeriodName).toBe('Ağustos 2026');
      expect(summary.annualBudget).toBe(300000);
      expect(summary.budgetSpentRate).toBe(10); // 30.000 / 300.000
    });
  });
});
