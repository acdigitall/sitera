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

describe('Finance Reporting Engine (Yönetim Kurulu Raporları Testleri)', () => {
  let service: FinanceService;

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

  const mockGroupId = 'reports-group-1';

  beforeEach(() => {
    const createMockRepo = () => ({
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn((dto) => dto),
      save: vi.fn((entity) => Promise.resolve(entity)),
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
      recordLog: vi.fn(),
      getLogs: vi.fn(),
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

  it('Gelir-Gider Tablosunu (Nakit Akışı) kuruş kayıpsız ve net bakiye ile doğru hesaplamalıdır', async () => {
    settingsRepo.findOne.mockResolvedValue({
      groupId: mockGroupId,
      annualBudget: 240000,
    });

    groupsRepo.findOne.mockResolvedValue({ id: mockGroupId, name: 'Gencosman Sitesi' });
    periodsRepo.findOne.mockResolvedValue({ id: 'p-1', name: 'Ağustos 2026', status: 'active' });

    debtsRepo.find.mockResolvedValue([
      { category: 'dues', amount: 15000, paidAmount: 12000 },
      { category: 'fixture', amount: 10000, paidAmount: 8000 },
    ]);

    expensesRepo.find.mockResolvedValue([
      { id: 'e-1', category: 'Asansör', title: 'Periyodik Asansör Bakımı', vendor: 'Kone', amount: 4000, status: 'paid' },
      { id: 'e-2', category: 'Elektrik', title: 'Ortak Alan Elektrik Faturası', vendor: 'BEDAŞ', amount: 3500, status: 'paid' },
    ]);

    accountsRepo.find.mockResolvedValue([
      { type: 'cash', balance: 5000 },
      { type: 'bank', balance: 45000 },
    ]);

    const reports = await service.getFinancialReports(mockGroupId);

    expect(reports.siteName).toBe('Gencosman Sitesi');
    expect(reports.periodName).toBe('Ağustos 2026');

    // Gelirler: Tahakkuk 15.000 + 10.000 = 25.000, Tahsilat = 12.000 + 8.000 = 20.000
    expect(reports.incomeExpense.totalAccruedIncome).toBe(25000);
    expect(reports.incomeExpense.totalCollectedIncome).toBe(20000);

    // Giderler: 4.000 + 3.500 = 7.500
    expect(reports.incomeExpense.totalExpense).toBe(7500);

    // Net Kasa Fazlası: 20.000 (Tahsilat) - 7.500 (Gider) = 12.500 ₺
    expect(reports.incomeExpense.netCashSurplus).toBe(12500);

    // Tahakkuk Fazlası: 25.000 - 7.500 = 17.500 ₺
    expect(reports.incomeExpense.accrualSurplus).toBe(17500);

    // Tahsilat Oranı: 20.000 / 25.000 = %80
    expect(reports.incomeExpense.collectionRate).toBe(80);
  });

  it('Aylık Mizanı (Trial Balance) hesaplamalı ve Borç/Alacak dengesini (isBalanced) sağlamalıdır', async () => {
    settingsRepo.findOne.mockResolvedValue({ annualBudget: 200000 });
    groupsRepo.findOne.mockResolvedValue({ id: mockGroupId, name: 'Gencosman Sitesi' });
    periodsRepo.findOne.mockResolvedValue({ name: 'Ağustos 2026' });

    debtsRepo.find.mockResolvedValue([
      { category: 'dues', amount: 20000, paidAmount: 18000 },
    ]);

    expensesRepo.find.mockResolvedValue([
      { id: 'e-1', category: 'Temizlik', amount: 5000, status: 'paid' },
    ]);

    accountsRepo.find.mockResolvedValue([
      { type: 'cash', balance: 3000 },
      { type: 'bank', balance: 40000 },
      { type: 'fund', balance: 25000 },
    ]);

    const reports = await service.getFinancialReports(mockGroupId);

    expect(reports.trialBalance.accounts).toHaveLength(8);
    expect(reports.trialBalance.isBalanced).toBe(true);

    // Kasa hesabı
    const cashAcc = reports.trialBalance.accounts.find((a) => a.code === '100.01');
    expect(cashAcc?.debitBalance).toBe(3000);

    // Alacaklar hesabı: 20.000 - 18.000 = 2.000
    const receivableAcc = reports.trialBalance.accounts.find((a) => a.code === '120.01');
    expect(receivableAcc?.debitBalance).toBe(2000);
  });

  it('Yönetim Kurulu Bilançosunda Aktif = Pasif (Varlıklar = Kaynaklar) mutabakatını doğrulamalıdır', async () => {
    settingsRepo.findOne.mockResolvedValue({ annualBudget: 150000 });
    groupsRepo.findOne.mockResolvedValue({ id: mockGroupId, name: 'Gencosman Sitesi' });
    periodsRepo.findOne.mockResolvedValue({ name: 'Ağustos 2026' });

    debtsRepo.find.mockResolvedValue([
      { category: 'dues', amount: 10000, paidAmount: 8000 }, // Kalan 2.000 alacak
    ]);

    expensesRepo.find.mockResolvedValue([
      { id: 'e-1', category: 'Sigorta', amount: 3000, status: 'unpaid' }, // 3.000 ödenecek borç
    ]);

    accountsRepo.find.mockResolvedValue([
      { type: 'cash', balance: 2000 },
      { type: 'bank', balance: 35000 },
    ]);

    const reports = await service.getFinancialReports(mockGroupId);

    // Aktifler: Kasa (2000) + Banka (35000) + Alacaklar (2000) = 39.000 ₺
    expect(reports.balanceSheet.totalAssets).toBe(39000);

    // Pasifler: Borçlar (3000) + Net Özkaynak (36000) = 39.000 ₺
    expect(reports.balanceSheet.totalLiabilitiesAndEquity).toBe(39000);
    expect(reports.balanceSheet.isBalanced).toBe(true);
  });
});
