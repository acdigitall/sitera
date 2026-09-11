import { Injectable, NotFoundException, BadRequestException, Logger, OnModuleInit, Optional, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PeriodEntity } from './entities/period.entity';
import { DebtEntity } from './entities/debt.entity';
import { PaymentEntity } from './entities/payment.entity';
import { FinanceAccountEntity } from './entities/finance-account.entity';
import { ExpenseEntity } from './entities/expense.entity';
import { FinanceSettingsEntity } from './entities/finance-settings.entity';
import { AccountTransactionEntity } from './entities/account-transaction.entity';
import { PlatformPosFeeEntity } from './entities/platform-pos-fee.entity';
import { GroupEntity } from '../groups/group.entity';
import { UserEntity } from '../users/user.entity';
import {
  CreatePeriodDto,
  CreateDebtDto,
  CreatePaymentDto,
  CreateFinanceAccountDto,
  TransferFundsDto,
  PosRevenueSummary,
  PlatformPosFee,
  AccountTransaction,
  FinanceSummary,
  FinanceSettings,
  UpdateFinanceSettingsDto,
  CashCollectionDto,
  DischargeResidentDto,
  TargetRole,
  FinanceCalculationEngine,
  FinancialReportPackage,
  IncomeItem,
  ExpenseReportItem,
  IncomeExpenseStatement,
  TrialBalanceAccount,
  TrialBalance,
  BalanceSheet,
  BalanceSheetItem,
  roundToPennies,
  validateDataUri,
  MAX_RECEIPT_SIZE_BYTES,
  RECEIPT_ALLOWED_MIME_TYPES,
} from '@sitera/shared';
import { TenantContext } from '../tenancy/tenant.context';
import { AuditLogsService } from '../audit/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FinanceService implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    @InjectRepository(PeriodEntity)
    private readonly periodsRepo: Repository<PeriodEntity>,
    @InjectRepository(DebtEntity)
    private readonly debtsRepo: Repository<DebtEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentsRepo: Repository<PaymentEntity>,
    @InjectRepository(FinanceAccountEntity)
    private readonly accountsRepo: Repository<FinanceAccountEntity>,
    @InjectRepository(ExpenseEntity)
    private readonly expensesRepo: Repository<ExpenseEntity>,
    @InjectRepository(FinanceSettingsEntity)
    private readonly settingsRepo: Repository<FinanceSettingsEntity>,
    @InjectRepository(AccountTransactionEntity)
    private readonly transactionsRepo: Repository<AccountTransactionEntity>,
    @InjectRepository(PlatformPosFeeEntity)
    private readonly posFeesRepo: Repository<PlatformPosFeeEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupsRepo: Repository<GroupEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
    @Optional()
    private readonly notificationsService?: NotificationsService,
  ) {}

  async onModuleInit() {
    await this.seedInitialFinanceData();
  }

  async onApplicationBootstrap() {
    await this.seedDemoResidentDebts();
  }

  private resolveGroupId(providedGroupId?: string): string {
    const activeId = providedGroupId || TenantContext.getGroupId();
    if (!activeId) {
      throw new Error('Tenant context (group_id) bulunamadı.');
    }
    return activeId;
  }

  private async executeWithRLS<T>(
    groupId: string | undefined,
    operation: (qr: any) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      if (groupId) {
        await queryRunner.query(`SET LOCAL app.current_group_id = '${groupId}'`);
      } else {
        await queryRunner.query(`SET LOCAL app.current_group_id = 'bypass_rls'`);
      }
      return await operation(queryRunner);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Seed realistic finance records for the first group if no periods exist
   */
  private async seedInitialFinanceData() {
    try {
      const periodCount = await this.periodsRepo.count();
      if (periodCount > 0) return;

      const firstGroup = await this.groupsRepo.findOne({ where: { slug: 'acme-holding' } })
        || await this.groupsRepo.findOne({ where: {} });

      if (!firstGroup) return;

      this.logger.log(`🌱 Finans verileri tohumlanıyor (Group: ${firstGroup.name})...`);

      // 0. Create Finance Settings
      const existingSettings = await this.settingsRepo.findOne({ where: { groupId: firstGroup.id } });
      if (!existingSettings) {
        const settings = this.settingsRepo.create({
          groupId: firstGroup.id,
          defaultDuesAmount: 1250,
          duesDueDay: 30,
          autoGenerateMonthlyDues: true,
          calculationMode: 'equal',
          lateFeeEnabled: true,
          lateFeeRate: 5,
          annualBudget: 180000,
        });
        await this.settingsRepo.save(settings);
      }

      // 1. Create Active Period
      const period = this.periodsRepo.create({
        groupId: firstGroup.id,
        name: 'Ağustos 2026',
        amount: 1250,
        dueDate: '2026-08-31',
        status: 'active',
      });
      await this.periodsRepo.save(period);

      // 2. Create Accounts
      const accounts = [
        this.accountsRepo.create({
          groupId: firstGroup.id,
          name: 'Ana Aidat Hesabı',
          bankName: 'Ziraat Bankası',
          iban: 'TR42 0001 0090 1234 5678 5001',
          balance: 38450,
          type: 'bank',
          isPrimary: true,
          lastActivity: 'Bugün 14:20 · FAST Girişi',
        }),
        this.accountsRepo.create({
          groupId: firstGroup.id,
          name: 'Demirbaş & Asansör Fonu',
          bankName: 'Garanti BBVA',
          iban: 'TR18 0006 2000 9876 5432 5002',
          balance: 12800,
          type: 'reserve',
          isPrimary: false,
          lastActivity: '15 Ağu · Vadeli Faiz',
        }),
        this.accountsRepo.create({
          groupId: firstGroup.id,
          name: 'Yönetici Nakit Kasası',
          bankName: 'Nakit Kasa',
          iban: 'Elden Tahsilat & Küçük Cari',
          balance: 2625,
          type: 'cash',
          isPrimary: false,
          lastActivity: 'Dün 18:00 · D.9 Nakit Alındı',
        }),
      ];
      await this.accountsRepo.save(accounts);

      // 3. Create Expenses
      const expenses = [
        this.expensesRepo.create({
          groupId: firstGroup.id,
          title: 'Asansör Aylık Bakım & Yeşil Etiket',
          vendor: 'KONE Asansör Servisi',
          category: 'Periyodik Bakım',
          amount: 1850,
          dueDate: '2026-08-25',
          dueDay: '25',
          dueMonth: 'AĞU',
          status: 'unpaid',
        }),
        this.expensesRepo.create({
          groupId: firstGroup.id,
          title: 'Ortak Alan Elektrik Faturası',
          vendor: 'CK Boğaziçi Elektrik',
          category: 'Abonelik',
          amount: 3420,
          dueDate: '2026-08-28',
          dueDay: '28',
          dueMonth: 'AĞU',
          status: 'auto',
        }),
        this.expensesRepo.create({
          groupId: firstGroup.id,
          title: 'Bina Görevlisi Maaş & SGK Primi',
          vendor: 'Personel Gideri',
          category: 'Maaş',
          amount: 6500,
          dueDate: '2026-08-31',
          dueDay: '31',
          dueMonth: 'AĞU',
          status: 'unpaid',
        }),
        this.expensesRepo.create({
          groupId: firstGroup.id,
          title: 'Hidrofor & Su Deposu Dezenfeksiyon',
          vendor: 'Arıtma Sistemleri Ltd.',
          category: 'Sıhhi Tesisat',
          amount: 850,
          dueDate: '2026-09-02',
          dueDay: '02',
          dueMonth: 'EYL',
          status: 'unpaid',
        }),
      ];
      await this.expensesRepo.save(expenses);

      // 4. Create Debts for members/units
      const members = await this.usersRepo.find({
        where: { groupId: firstGroup.id, role: 'member' },
      });

      const debtsToCreate: DebtEntity[] = [];

      if (members.length > 0) {
        for (let i = 0; i < members.length; i++) {
          const m = members[i];
          const unit = m.units && m.units.length > 0 ? m.units[0] : `Daire ${i + 1}`;
          // Some paid, some unpaid
          const isPaid = i % 3 === 0;
          debtsToCreate.push(
            this.debtsRepo.create({
              groupId: firstGroup.id,
              userId: m.id,
              periodId: period.id,
              unit: unit,
              residentName: m.name,
              title: 'Ağustos 2026 Aidat & Ortak Gider',
              category: 'dues',
              amount: 1250,
              paidAmount: isPaid ? 1250 : 0,
              dueDate: '2026-08-31',
              status: isPaid ? 'paid' : 'unpaid',
              paidDate: isPaid ? '2026-08-15T10:00:00Z' : null,
            }),
          );
        }
      } else {
        // Fallback default units if no members yet
        for (let i = 1; i <= 5; i++) {
          debtsToCreate.push(
            this.debtsRepo.create({
              groupId: firstGroup.id,
              periodId: period.id,
              unit: `Daire ${i}`,
              residentName: `Sakin ${i}`,
              title: 'Ağustos 2026 Aidat & Ortak Gider',
              category: 'dues',
              amount: 1250,
              paidAmount: i === 1 ? 1250 : 0,
              dueDate: '2026-08-31',
              status: i === 1 ? 'paid' : 'unpaid',
              paidDate: i === 1 ? '2026-08-15T10:00:00Z' : null,
            }),
          );
        }
      }
      const savedDebts = await this.debtsRepo.save(debtsToCreate);

      // 5. Create Pending Approvals
      const unpaidDebts = savedDebts.filter((d) => d.status === 'unpaid');
      const payments = [
        this.paymentsRepo.create({
          groupId: firstGroup.id,
          debtId: unpaidDebts[0]?.id || null,
          unit: unpaidDebts[0]?.unit || 'A Blok D.7',
          residentName: unpaidDebts[0]?.residentName || 'Zeynep Çelik',
          amount: 625,
          channel: 'bank_transfer',
          referenceNo: 'FST84920192',
          status: 'pending',
          notes: 'Ziraat FAST ile gönderildi',
        }),
        this.paymentsRepo.create({
          groupId: firstGroup.id,
          debtId: unpaidDebts[1]?.id || null,
          unit: unpaidDebts[1]?.unit || 'A Blok D.2',
          residentName: unpaidDebts[1]?.residentName || 'Fatma Demir',
          amount: 1250,
          channel: 'bank_transfer',
          referenceNo: 'HAV3391024',
          status: 'pending',
          notes: 'İş Bankası Havale',
        }),
        this.paymentsRepo.create({
          groupId: firstGroup.id,
          debtId: unpaidDebts[2]?.id || null,
          unit: unpaidDebts[2]?.unit || 'B Blok D.10',
          residentName: unpaidDebts[2]?.residentName || 'Onur Yurt',
          amount: 1250,
          channel: 'bank_transfer',
          referenceNo: 'EFT7712034',
          status: 'pending',
          notes: 'Garanti BBVA EFT',
        }),
      ];
      await this.paymentsRepo.save(payments);

      this.logger.log('✅ Finansal başlangıç verileri başarıyla PostgreSQL tabanına kaydedildi.');
    } catch (err: any) {
      this.logger.error(`Finans tohumlama hatası: ${err.message}`);
    }
  }

  private async seedDemoResidentDebts() {
    try {
      await this.executeWithRLS(undefined, async (qr) => {
        const uRepo = qr.manager.getRepository(UserEntity);
        const dRepo = qr.manager.getRepository(DebtEntity);
        const pRepo = qr.manager.getRepository(PeriodEntity);

        const demoUser = await uRepo.findOne({ where: { email: 'ahmet.yilmaz@sitera.dev' } });
        if (!demoUser) return;

        const demoDebtCount = await dRepo.count({ where: { userId: demoUser.id } });
        if (demoDebtCount > 0) return;

        const period = await pRepo.findOne({
          where: { groupId: demoUser.groupId },
          order: { createdAt: 'DESC' },
        });

        const debts = [
          dRepo.create({
            groupId: demoUser.groupId,
            userId: demoUser.id,
            periodId: period?.id || null,
            unit: 'A Blok Daire 12',
            residentName: demoUser.name,
            title: 'Eylül 2026 Genel Aidat',
            category: 'dues',
            amount: 1250,
            paidAmount: 0,
            dueDate: '2026-09-15',
            status: 'unpaid',
          }),
          dRepo.create({
            groupId: demoUser.groupId,
            userId: demoUser.id,
            periodId: period?.id || null,
            unit: 'A Blok Daire 12',
            residentName: demoUser.name,
            title: 'Asansör Revizyonu Ek Masrafı',
            category: 'fixture',
            amount: 350,
            paidAmount: 0,
            dueDate: '2026-09-20',
            status: 'unpaid',
          }),
          dRepo.create({
            groupId: demoUser.groupId,
            userId: demoUser.id,
            periodId: period?.id || null,
            unit: 'A Blok Daire 12',
            residentName: demoUser.name,
            title: 'Ağustos 2026 Genel Aidat',
            category: 'dues',
            amount: 1250,
            paidAmount: 1250,
            dueDate: '2026-08-15',
            status: 'paid',
            paidDate: '2026-08-12T14:32:00.000Z',
          }),
        ];
        await dRepo.save(debts);
        this.logger.log('✅ Demo Sakin aidat borçları başarıyla veritabanına tohumlandı.');
      });
    } catch (err: any) {
      this.logger.warn(`Demo sakin borç tohumlama uyarısı: ${err.message}`);
    }
  }

  // --- SETTINGS ---
  async getSettings(groupId?: string): Promise<FinanceSettingsEntity> {
    const gid = this.resolveGroupId(groupId);
    return await this.executeWithRLS(gid, async (qr) => {
      const repo = qr.manager.getRepository(FinanceSettingsEntity);
      let settings = await repo.findOne({ where: { groupId: gid } });
      if (!settings) {
        settings = repo.create({
          groupId: gid,
          defaultDuesAmount: 0,
          duesDueDay: 30,
          autoGenerateMonthlyDues: false,
          calculationMode: 'equal',
          lateFeeEnabled: true,
          lateFeeRate: 5,
          annualBudget: 0,
        });
        settings = await repo.save(settings);
      }
      return settings;
    });
  }

  async updateSettings(dto: UpdateFinanceSettingsDto, groupId?: string): Promise<FinanceSettingsEntity> {
    const gid = this.resolveGroupId(groupId);
    return await this.executeWithRLS(gid, async (qr) => {
      const repo = qr.manager.getRepository(FinanceSettingsEntity);
      let settings = await repo.findOne({ where: { groupId: gid } });
      if (!settings) {
        settings = repo.create({ groupId: gid, ...dto });
      } else {
        Object.assign(settings, dto);
      }
      return await repo.save(settings);
    });
  }

  // --- AUTOMATED RECURRING DUES GENERATION ---
  async autoGenerateMonthlyDues(groupId?: string, force = false): Promise<{ period: PeriodEntity; createdDebtsCount: number }> {
    const gid = this.resolveGroupId(groupId);
    const settings = await this.getSettings(gid);

    const now = new Date();
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
    ];
    const currentPeriodName = `${months[now.getMonth()]} ${now.getFullYear()}`;

    // Check if period already exists
    const existingPeriod = await this.executeWithRLS<PeriodEntity | null>(gid, async (qr) =>
      qr.manager.getRepository(PeriodEntity).findOne({ where: { groupId: gid, name: currentPeriodName } })
    );

    if (existingPeriod && !force) {
      const debtsCount = await this.executeWithRLS<number>(gid, async (qr) =>
        qr.manager.getRepository(DebtEntity).count({ where: { periodId: existingPeriod.id } })
      );
      return { period: existingPeriod, createdDebtsCount: Number(debtsCount) };
    }

    // Due date
    const dueDay = settings.duesDueDay || 30;
    const dueYear = now.getFullYear();
    const dueMonth = String(now.getMonth() + 1).padStart(2, '0');
    const dueDateStr = `${dueYear}-${dueMonth}-${String(dueDay).padStart(2, '0')}`;

    const createdPeriod = await this.createPeriod(
      {
        name: currentPeriodName,
        amount: Number(settings.defaultDuesAmount) || 1250,
        calculationMode: settings.calculationMode || 'equal',
        category: 'dues',
        targetRole: 'resident',
        dueDate: dueDateStr,
        status: 'active',
        generateDebtsForUnits: true,
      },
      gid,
    );

    const debtsCount = await this.executeWithRLS<number>(gid, async (qr) =>
      qr.manager.getRepository(DebtEntity).count({ where: { periodId: createdPeriod.id } })
    );

    return { period: createdPeriod, createdDebtsCount: Number(debtsCount) };
  }

  // --- PERIODS ---
  async getPeriods(groupId?: string): Promise<PeriodEntity[]> {
    const gid = this.resolveGroupId(groupId);
    return await this.executeWithRLS(gid, (qr) =>
      qr.manager.getRepository(PeriodEntity).find({
        where: { groupId: gid },
        order: { createdAt: 'DESC' },
      }),
    );
  }

  async createPeriod(dto: CreatePeriodDto, groupId?: string): Promise<PeriodEntity> {
    const gid = this.resolveGroupId(groupId);
    return await this.executeWithRLS(gid, async (qr) => {
      const periodRepo = qr.manager.getRepository(PeriodEntity);
      const debtsRepo = qr.manager.getRepository(DebtEntity);
      const usersRepo = qr.manager.getRepository(UserEntity);

      // KURAL: Aynı anda yalnızca TEK BİR aktif dönem olabilir. Yeni aktif dönem açılırken eskiler kapanır.
      const targetStatus = dto.status || 'active';
      if (targetStatus === 'active') {
        await qr.query(`UPDATE periods SET status = 'closed' WHERE group_id = $1`, [gid]);
      }

      // Sitedeki tüm dairelerin (bağımsız bölümlerin) listesini topla
      const members = await usersRepo.find({
        where: { groupId: gid, role: 'member' },
      });

      const allUnitsList: { unit: string; member: UserEntity }[] = [];
      for (const m of members) {
        const uList = m.units && m.units.length > 0 ? m.units : [m.name];
        for (const u of uList) {
          allUnitsList.push({ unit: u, member: m });
        }
      }

      const totalUnits = allUnitsList.length > 0 ? allUnitsList.length : 5;
      let defaultBaseAmount = Number(dto.amount);

      if (dto.calculationMode === 'equal_split' && dto.totalAmount && totalUnits > 0) {
        defaultBaseAmount = Math.round((Number(dto.totalAmount) / totalUnits) * 100) / 100;
      }

      const period = periodRepo.create({
        groupId: gid,
        name: dto.name,
        amount: defaultBaseAmount,
        dueDate: dto.dueDate,
        status: targetStatus,
      });
      const savedPeriod = await periodRepo.save(period);

      if (dto.generateDebtsForUnits) {
        const newDebts: DebtEntity[] = [];
        const isFixture = dto.category === 'fixture';
        const targetRole: TargetRole = dto.targetRole || (isFixture ? 'owner' : 'resident');

        if (allUnitsList.length > 0) {
          const splitResults = FinanceCalculationEngine.calculateExpenseSplit({
            calculationMode: dto.calculationMode || 'equal',
            totalAmount: dto.totalAmount,
            baseAmount: defaultBaseAmount,
            units: allUnitsList.map((item) => ({
              unit: item.unit,
              userId: item.member.id,
              residentName: item.member.name,
            })),
            defaultTargetRole: targetRole,
            isFixture,
          });

          for (let index = 0; index < splitResults.length; index++) {
            const split = splitResults[index];
            const item = allUnitsList[index];

            // KMK Kuralı: Demirbaş ise Kat Maliki (Ev Sahibi), Rutin Aidat ise İkamet Eden/Kiracı
            let assignedUser = item.member;
            if (isFixture) {
              const ownerMember = members.find(
                (m) =>
                  m.units?.includes(item.unit) &&
                  (m.residentType === 'owner' || m.residentType === 'both'),
              );
              if (ownerMember) assignedUser = ownerMember;
            }

            const debtTitle = isFixture
              ? `${dto.name} (Demirbaş / Malik Payı)`
              : `${dto.name} Aidat & Ortak Gider`;

            newDebts.push(
              debtsRepo.create({
                groupId: gid,
                userId: assignedUser.id,
                periodId: savedPeriod.id,
                unit: split.unit,
                residentName: assignedUser.name,
                title: debtTitle,
                category: dto.category || 'dues',
                targetRole: split.targetRole,
                amount: split.amount,
                paidAmount: 0,
                dueDate: dto.dueDate,
                status: 'unpaid',
              }),
            );
          }
        } else {
          // Varsayılan daireler
          for (let i = 1; i <= 5; i++) {
            newDebts.push(
              debtsRepo.create({
                groupId: gid,
                periodId: savedPeriod.id,
                unit: `Daire ${i}`,
                residentName: `Daire ${i} Sakini`,
                title: `${dto.name} Aidat & Ortak Gider`,
                category: dto.category || 'dues',
                targetRole: targetRole,
                amount: defaultBaseAmount,
                paidAmount: 0,
                dueDate: dto.dueDate,
                status: 'unpaid',
              }),
            );
          }
        }

        if (newDebts.length > 0) {
          await debtsRepo.save(newDebts);
        }
      }

      return savedPeriod;
    });
  }

  async deletePeriod(id: string, groupId?: string): Promise<boolean> {
    const gid = this.resolveGroupId(groupId);
    return await this.executeWithRLS(gid, async (qr) => {
      const periodRepo = qr.manager.getRepository(PeriodEntity);
      const debtsRepo = qr.manager.getRepository(DebtEntity);

      await debtsRepo.delete({ periodId: id, status: 'unpaid' });
      await periodRepo.delete({ id, groupId: gid });
      return true;
    });
  }

  // --- DEBTS (WITH KMK LATE FEES CALCULATION) ---
  async getDebts(groupId?: string, userId?: string, unit?: string): Promise<DebtEntity[]> {
    const gid = this.resolveGroupId(groupId);
    const settings = await this.getSettings(gid);

    return await this.executeWithRLS(gid, async (qr) => {
      const debtRepo = qr.manager.getRepository(DebtEntity);
      const userRepo = qr.manager.getRepository(UserEntity);
      let debts: DebtEntity[] = [];

      if (userId) {
        const foundUser = await userRepo.findOne({ where: { id: userId } });
        const rawUnits = foundUser?.units;
        let userUnits: string[] = [];
        if (Array.isArray(rawUnits)) {
          userUnits = rawUnits.map((u) => u.trim()).filter(Boolean);
        } else if (typeof rawUnits === 'string') {
          userUnits = (rawUnits as string).split(',').map((u) => u.trim()).filter(Boolean);
        }
        if (userUnits.length === 0 && foundUser?.name) {
          userUnits = [foundUser.name.trim()];
        }

        const isAdmin = foundUser?.role === 'admin' || foundUser?.role === 'superadmin';

        if (unit && unit.trim() && unit !== 'all') {
          // Specific unit filter requested
          const qb = debtRepo
            .createQueryBuilder('debt')
            .leftJoinAndSelect('debt.payments', 'payments')
            .where('debt.groupId = :gid', { gid })
            .andWhere('debt.unit = :unit', { unit: unit.trim() });
          if (!isAdmin) {
            qb.andWhere('(debt.userId = :userId OR debt.unit IN (:...allUserUnits))', {
              userId,
              allUserUnits: userUnits.length > 0 ? userUnits : ['__NONE__'],
            });
          }
          debts = await qb
            .orderBy('debt.dueDate', 'DESC')
            .addOrderBy('debt.createdAt', 'DESC')
            .getMany();
        } else if (isAdmin) {
          // Admin sees all site debts when not filtering by specific resident unit
          debts = await debtRepo
            .createQueryBuilder('debt')
            .leftJoinAndSelect('debt.payments', 'payments')
            .where('debt.groupId = :gid', { gid })
            .orderBy('debt.dueDate', 'DESC')
            .addOrderBy('debt.createdAt', 'DESC')
            .getMany();
        } else {
          // Regular resident: all units for this user
          const allUserUnits = userUnits.length > 0 ? userUnits : ['__NONE__'];
          debts = await debtRepo
            .createQueryBuilder('debt')
            .leftJoinAndSelect('debt.payments', 'payments')
            .where('debt.groupId = :gid', { gid })
            .andWhere('(debt.userId = :userId OR debt.unit IN (:...allUserUnits))', {
              userId,
              allUserUnits,
            })
            .orderBy('debt.dueDate', 'DESC')
            .addOrderBy('debt.createdAt', 'DESC')
            .getMany();
        }
      } else if (unit && unit.trim() && unit !== 'all') {
        debts = await debtRepo
          .createQueryBuilder('debt')
          .leftJoinAndSelect('debt.payments', 'payments')
          .where('debt.groupId = :gid', { gid })
          .andWhere('debt.unit = :unit', { unit: unit.trim() })
          .orderBy('debt.dueDate', 'DESC')
          .addOrderBy('debt.createdAt', 'DESC')
          .getMany();
      } else {
        debts = await debtRepo.find({
          where: { groupId: gid },
          relations: ['payments'],
          order: { dueDate: 'DESC', createdAt: 'DESC' },
        });
      }

      return debts.map((d) => {
        if (d.status !== 'paid' && d.dueDate) {
          const lateInfo = FinanceCalculationEngine.calculateKmkLateFee({
            amount: Number(d.amount),
            paidAmount: Number(d.paidAmount || 0),
            dueDate: d.dueDate,
            lateFeeRate: Number(settings?.lateFeeRate || 5),
            lateFeeEnabled: settings?.lateFeeEnabled,
            currentStatus: d.status,
          });
          if (lateInfo.isOverdue) {
            (d as any).overdueDays = lateInfo.overdueDays;
            (d as any).status = lateInfo.status;
            (d as any).lateFee = lateInfo.lateFee;
            (d as any).totalWithLateFee = lateInfo.totalWithLateFee;
          }
        }
        return d;
      });
    });
  }

  async createDebt(dto: CreateDebtDto, groupId?: string): Promise<DebtEntity> {
    const gid = this.resolveGroupId(groupId);
    return await this.executeWithRLS(gid, (qr) => {
      const debtRepo = qr.manager.getRepository(DebtEntity);
      const debt = debtRepo.create({
        groupId: gid,
        userId: dto.userId || null,
        periodId: dto.periodId || null,
        unit: dto.unit,
        residentName: dto.residentName || null,
        title: dto.title,
        category: dto.category || 'dues',
        targetRole: dto.targetRole || 'resident',
        amount: dto.amount,
        paidAmount: 0,
        dueDate: dto.dueDate,
        status: 'unpaid',
      });
      return debtRepo.save(debt);
    });
  }

  // --- CASH COLLECTION & DISCHARGE ---
  async recordCashCollection(dto: CashCollectionDto, approvedBy?: string, groupId?: string): Promise<PaymentEntity> {
    const gid = this.resolveGroupId(groupId);
    return await this.executeWithRLS(gid, async (qr) => {
      const payRepo = qr.manager.getRepository(PaymentEntity);
      const debtRepo = qr.manager.getRepository(DebtEntity);
      const accRepo = qr.manager.getRepository(FinanceAccountEntity);

      let residentName = dto.residentName;
      if (dto.debtId) {
        const debt = await debtRepo.findOne({ where: { id: dto.debtId, groupId: gid } });
        if (debt) {
          residentName = residentName || debt.residentName || undefined;
          debt.paidAmount = dto.amount;
          debt.status = 'paid';
          debt.paidDate = new Date().toISOString();
          await debtRepo.save(debt);
        }
      }

      const payment = payRepo.create({
        groupId: gid,
        debtId: dto.debtId || null,
        unit: dto.unit,
        residentName: residentName || 'Daire Sakini',
        amount: dto.amount,
        channel: 'cash',
        referenceNo: `NAKIT-${Math.floor(100000 + Math.random() * 900000)}`,
        notes: dto.notes || 'Elden Nakit Tahsilat Alındı',
        status: 'approved',
        approvedBy: (approvedBy && approvedBy.length === 36) ? approvedBy : null,
        approvedAt: new Date().toISOString(),
      });
      const savedPayment = await payRepo.save(payment);

      const cashAcc =
        (await accRepo.findOne({ where: { groupId: gid, type: 'cash' } })) ||
        (await accRepo.findOne({ where: { groupId: gid, isPrimary: true } }));
      if (cashAcc) {
        cashAcc.balance = roundToPennies(Number(cashAcc.balance) + Number(dto.amount));
        cashAcc.lastActivity = `Bugün ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} · ${dto.unit} Nakit Tahsilat`;
        await accRepo.save(cashAcc);

        const transRepo = qr.manager.getRepository(AccountTransactionEntity);
        const trans = transRepo.create({
          groupId: gid,
          accountId: cashAcc.id,
          accountName: cashAcc.name,
          type: 'income',
          amount: Number(dto.amount),
          balanceAfter: Number(cashAcc.balance),
          title: 'Elden Nakit Aidat Tahsilatı',
          category: 'aidat',
          counterparty: `${residentName || 'Daire Sakini'} (${dto.unit})`,
          referenceType: 'payment',
          referenceId: savedPayment.id,
          transactionDate: new Date().toISOString(),
        });
        await transRepo.save(trans);
      }

      return savedPayment;
    });
  }

  async dischargeResident(dto: DischargeResidentDto, groupId?: string): Promise<{ success: boolean; unpaidDebtsTotal: number; message: string }> {
    const gid = this.resolveGroupId(groupId);
    return await this.executeWithRLS(gid, async (qr) => {
      const userRepo = qr.manager.getRepository(UserEntity);
      const debtRepo = qr.manager.getRepository(DebtEntity);

      const user = await userRepo.findOne({ where: { id: dto.userId, groupId: gid } });
      if (!user) {
        throw new NotFoundException('Sakin bulunamadı.');
      }

      const unpaidDebts = await debtRepo.find({
        where: { groupId: gid, userId: dto.userId, unit: dto.unit, status: 'unpaid' },
      });
      const { unpaidDebtsTotal } = FinanceCalculationEngine.calculateResidentDischargeBalance(unpaidDebts);

      if (user.units) {
        user.units = user.units.filter((u) => u !== dto.unit);
        await userRepo.save(user);
      }

      return {
        success: true,
        unpaidDebtsTotal: unpaidDebtsTotal,
        message: `${user.name} kullanıcısının ${dto.unit} dairesiyle ilişiği kesildi. Kalan ödenmemiş borç: ${unpaidDebtsTotal.toLocaleString('tr-TR')} ₺.`,
      };
    });
  }

  // --- PAYMENTS & APPROVALS ---
  async getPendingPayments(groupId?: string): Promise<PaymentEntity[]> {
    const gid = this.resolveGroupId(groupId);
    return await this.executeWithRLS(gid, (qr) =>
      qr.manager.getRepository(PaymentEntity).find({
        where: { groupId: gid, status: 'pending' },
        order: { createdAt: 'DESC' },
      }),
    );
  }

  async approvePayment(paymentId: string, approvedBy?: string, groupId?: string): Promise<PaymentEntity> {
    const gid = this.resolveGroupId(groupId);
    return await this.executeWithRLS(gid, async (qr) => {
      const payRepo = qr.manager.getRepository(PaymentEntity);
      const debtRepo = qr.manager.getRepository(DebtEntity);
      const accRepo = qr.manager.getRepository(FinanceAccountEntity);

      const payment = await payRepo.findOne({ where: { id: paymentId, groupId: gid } });
      if (!payment) {
        throw new NotFoundException('Ödeme kaydı bulunamadı.');
      }

      payment.status = 'approved';
      payment.approvedBy = approvedBy || null;
      payment.approvedAt = new Date().toISOString();
      const savedPayment = await payRepo.save(payment);

      // Close debt if linked
      if (payment.debtId) {
        const debt = await debtRepo.findOne({ where: { id: payment.debtId, groupId: gid } });
        if (debt) {
          debt.paidAmount = payment.amount;
          debt.status = 'paid';
          debt.paidDate = new Date().toISOString();
          await debtRepo.save(debt);
        }
      }

      // Add to primary bank account
      const primaryAcc = await accRepo.findOne({ where: { groupId: gid, isPrimary: true } })
        || await accRepo.findOne({ where: { groupId: gid } });

      if (primaryAcc) {
        primaryAcc.balance = roundToPennies(Number(primaryAcc.balance) + Number(payment.amount));
        primaryAcc.lastActivity = `Bugün ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} · ${payment.unit} Tahsilat`;
        await accRepo.save(primaryAcc);

        const transRepo = qr.manager.getRepository(AccountTransactionEntity);
        const trans = transRepo.create({
          groupId: gid,
          accountId: primaryAcc.id,
          accountName: primaryAcc.name,
          type: 'income',
          amount: Number(payment.amount),
          balanceAfter: Number(primaryAcc.balance),
          title: payment.channel === 'bank_transfer' ? 'Banka Havalesi Aidat Tahsilatı' : 'Aidat Tahsilatı',
          category: 'aidat',
          counterparty: `${payment.residentName || 'Daire Sakini'} (${payment.unit})`,
          referenceType: 'payment',
          referenceId: payment.id,
          transactionDate: new Date().toISOString(),
        });
        await transRepo.save(trans);
      }

      await this.auditLogsService.recordLog({
        groupId: gid,
        userId: approvedBy || null,
        userName: 'Yönetici',
        userRole: 'admin',
        action: 'PAYMENT_APPROVED',
        category: 'FINANCE',
        level: 'INFO',
        resource: `${payment.unit} - ${payment.amount} ₺`,
        details: {
          paymentId: payment.id,
          referenceNo: payment.referenceNo,
          channel: payment.channel,
          amount: payment.amount,
        },
      });

      // In-app Notification for resident
      if (this.notificationsService) {
        try {
          let recipientId = payment.userId;
          if (!recipientId && payment.unit) {
            const userRepo = qr.manager.getRepository(UserEntity);
            const residentUser = await userRepo
              .createQueryBuilder('user')
              .where('user.groupId = :gid', { gid })
              .andWhere('(:unit = ANY(string_to_array(user.units, \',\')) OR user.name = :unit)', {
                unit: payment.unit,
              })
              .getOne();
            recipientId = residentUser?.id;
          }

          if (recipientId) {
            await this.notificationsService.createNotification(
              {
                userId: recipientId,
                title: 'Ödemeniz Onaylandı',
                message: `${payment.unit} için iletilen ${Number(payment.amount).toLocaleString('tr-TR')} ₺ tutarındaki ödemeniz yönetim tarafından onaylandı.`,
                type: 'payment_approval',
                priority: 'normal',
                linkUrl: '/portal/payments',
                metadata: {
                  paymentId: payment.id,
                  amount: payment.amount,
                  unit: payment.unit,
                },
              },
              gid,
            );
          }
        } catch (notifyErr: any) {
          this.logger.warn(`Ödeme onay bildirim uyarısı: ${notifyErr.message}`);
        }
      }

      return savedPayment;
    });
  }

  async rejectPayment(paymentId: string, groupId?: string): Promise<PaymentEntity> {
    const gid = this.resolveGroupId(groupId);
    return await this.executeWithRLS(gid, async (qr) => {
      const payRepo = qr.manager.getRepository(PaymentEntity);
      const payment = await payRepo.findOne({ where: { id: paymentId, groupId: gid } });
      if (!payment) {
        throw new NotFoundException('Ödeme kaydı bulunamadı.');
      }
      payment.status = 'rejected';
      const saved = await payRepo.save(payment);

      await this.auditLogsService.recordLog({
        groupId: gid,
        userName: 'Yönetici',
        userRole: 'admin',
        action: 'PAYMENT_REJECTED',
        category: 'FINANCE',
        level: 'WARN',
        resource: `${payment.unit} - ${payment.amount} ₺`,
        details: {
          paymentId: payment.id,
          referenceNo: payment.referenceNo,
          amount: payment.amount,
        },
      });

      // In-app Notification for resident
      if (this.notificationsService) {
        try {
          let recipientId = payment.userId;
          if (!recipientId && payment.unit) {
            const userRepo = qr.manager.getRepository(UserEntity);
            const residentUser = await userRepo
              .createQueryBuilder('user')
              .where('user.groupId = :gid', { gid })
              .andWhere('(:unit = ANY(string_to_array(user.units, \',\')) OR user.name = :unit)', {
                unit: payment.unit,
              })
              .getOne();
            recipientId = residentUser?.id;
          }

          if (recipientId) {
            await this.notificationsService.createNotification(
              {
                userId: recipientId,
                title: 'Ödeme Bildirimi Reddedildi',
                message: `${payment.unit} için iletilen ${Number(payment.amount).toLocaleString('tr-TR')} ₺ tutarındaki ödeme dekontu reddedildi. Lütfen detayları kontrol ediniz.`,
                type: 'payment_approval',
                priority: 'high',
                linkUrl: '/portal/payments',
                metadata: {
                  paymentId: payment.id,
                  amount: payment.amount,
                  unit: payment.unit,
                },
              },
              gid,
            );
          }
        } catch (notifyErr: any) {
          this.logger.warn(`Ödeme ret bildirim uyarısı: ${notifyErr.message}`);
        }
      }

      return saved;
    });
  }

  async createPayment(dto: CreatePaymentDto, userId?: string, groupId?: string): Promise<PaymentEntity> {
    const gid = this.resolveGroupId(groupId);

    // 1. Receipt validation & security scan
    if (dto.receiptUrl) {
      const validation = validateDataUri(dto.receiptUrl, {
        maxSizeBytes: MAX_RECEIPT_SIZE_BYTES,
        allowedMimeTypes: RECEIPT_ALLOWED_MIME_TYPES,
        scanMaliciousSignatures: true,
      });

      if (!validation.isValid) {
        throw new BadRequestException(
          `Ödeme dekontu güvenlik doğrulamasından geçemedi: ${validation.error}`,
        );
      }
    }

    return await this.executeWithRLS(gid, async (qr) => {
      const payRepo = qr.manager.getRepository(PaymentEntity);
      const debtRepo = qr.manager.getRepository(DebtEntity);

      let residentName: string | null = null;
      if (dto.debtId) {
        const debt = await debtRepo.findOne({ where: { id: dto.debtId, groupId: gid } });
        if (debt) {
          residentName = debt.residentName || null;
        }
      }

      const payment = payRepo.create({
        groupId: gid,
        userId: userId || null,
        debtId: dto.debtId || null,
        unit: dto.unit,
        residentName: residentName || 'Daire Sakini',
        amount: dto.amount,
        channel: dto.channel,
        referenceNo: dto.referenceNo || null,
        receiptUrl: dto.receiptUrl || null,
        notes: dto.notes || null,
        status: (dto.channel === 'credit_card' || dto.channel === 'cash') ? 'approved' : 'pending',
      });

      const saved = await payRepo.save(payment);

      // If online card or cash payment, immediately mark debt as paid and update account
      if (saved.status === 'approved') {
        const accRepo = qr.manager.getRepository(FinanceAccountEntity);
        const transRepo = qr.manager.getRepository(AccountTransactionEntity);
        const posRepo = qr.manager.getRepository(PlatformPosFeeEntity);
        const groupRepo = qr.manager.getRepository(GroupEntity);
        const group = await groupRepo.findOne({ where: { id: gid } });

        let netAmountForSite = Number(dto.amount);

        if (dto.channel === 'credit_card') {
          // Sakinden çekilen tutar (brüt) içindeki %5 komisyon ayrımı
          const debt = dto.debtId ? await debtRepo.findOne({ where: { id: dto.debtId, groupId: gid } }) : null;
          if (debt && Number(dto.amount) > Number(debt.amount)) {
            netAmountForSite = Number(debt.amount);
          } else {
            netAmountForSite = roundToPennies(Number(dto.amount) / 1.05);
          }
          const grossAmount = Number(dto.amount);
          const totalCommission = roundToPennies(grossAmount - netAmountForSite);
          const gatewayFee = roundToPennies(totalCommission / 2); // PayTR %2.5
          const siteraRevenue = roundToPennies(totalCommission - gatewayFee); // Sitera %2.5

          // Sitera Platform POS gelirini kaydet
          const posRecord = posRepo.create({
            paymentId: saved.id,
            groupId: gid,
            siteName: group?.name || 'Site',
            unit: dto.unit,
            residentName: residentName || 'Daire Sakini',
            grossAmount,
            netAmount: netAmountForSite,
            totalCommission,
            gatewayFee,
            siteraRevenue,
            status: 'completed',
          });
          await posRepo.save(posRecord);

          this.logger.log(`💳 Sanal POS Ödeme: Çekilen: ${grossAmount} ₺ | Site Net: ${netAmountForSite} ₺ | PayTR Maliyet: ${gatewayFee} ₺ | Sitera Net Gelir: ${siteraRevenue} ₺`);
        }

        if (dto.debtId) {
          const debt = await debtRepo.findOne({ where: { id: dto.debtId, groupId: gid } });
          if (debt) {
            debt.paidAmount = debt.amount;
            debt.status = 'paid';
            debt.paidDate = new Date().toISOString();
            await debtRepo.save(debt);
          }
        }

        const targetAcc = dto.channel === 'cash'
          ? await accRepo.findOne({ where: { groupId: gid, type: 'cash' } }) || await accRepo.findOne({ where: { groupId: gid, isPrimary: true } })
          : await accRepo.findOne({ where: { groupId: gid, isPrimary: true } }) || await accRepo.findOne({ where: { groupId: gid } });

        if (targetAcc) {
          targetAcc.balance = roundToPennies(Number(targetAcc.balance) + netAmountForSite);
          targetAcc.lastActivity = `Bugün ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} · ${dto.unit} ${dto.channel === 'credit_card' ? 'Kartla Ödeme' : 'Tahsilat'}`;
          await accRepo.save(targetAcc);

          const trans = transRepo.create({
            groupId: gid,
            accountId: targetAcc.id,
            accountName: targetAcc.name,
            type: 'income',
            amount: netAmountForSite,
            balanceAfter: Number(targetAcc.balance),
            title: dto.channel === 'credit_card' ? 'Sanal POS Kartla Ödeme' : 'Nakit Tahsilat',
            category: 'aidat',
            counterparty: `${residentName || 'Daire Sakini'} (${dto.unit})`,
            referenceType: 'payment',
            referenceId: saved.id,
            transactionDate: new Date().toISOString(),
          });
          await transRepo.save(trans);
        }
      }

      return saved;
    });
  }

  private async ensureGroupAccounts(qr: any, gid: string): Promise<FinanceAccountEntity[]> {
    const accRepo = qr.manager.getRepository(FinanceAccountEntity);
    return await accRepo.find({
      where: { groupId: gid },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });
  }

  // --- ACCOUNTS & EXPENSES ---
  async getAccounts(groupId?: string): Promise<FinanceAccountEntity[]> {
    const gid = this.resolveGroupId(groupId);
    return await this.executeWithRLS(gid, (qr) => this.ensureGroupAccounts(qr, gid));
  }

  async createAccount(dto: CreateFinanceAccountDto, groupId?: string): Promise<FinanceAccountEntity> {
    const gid = this.resolveGroupId(groupId);
    return await this.executeWithRLS(gid, async (qr) => {
      const accRepo = qr.manager.getRepository(FinanceAccountEntity);
      const transRepo = qr.manager.getRepository(AccountTransactionEntity);

      if (dto.isPrimary) {
        await accRepo.update({ groupId: gid }, { isPrimary: false });
      }

      const initialBal = roundToPennies(Number(dto.initialBalance) || 0);
      const newAcc = accRepo.create({
        groupId: gid,
        name: dto.name,
        bankName: dto.bankName,
        iban: dto.iban || null,
        balance: initialBal,
        type: dto.type || 'bank',
        isPrimary: Boolean(dto.isPrimary),
        lastActivity: initialBal > 0 ? 'Bugün · Açılış Bakiyesi' : 'Aktif',
      });

      const saved = await accRepo.save(newAcc);

      if (initialBal > 0) {
        const trans = transRepo.create({
          groupId: gid,
          accountId: saved.id,
          accountName: saved.name,
          type: 'income',
          amount: initialBal,
          balanceAfter: initialBal,
          title: 'Hesap Açılış Bakiyesi',
          category: 'açılış',
          counterparty: 'Hesap Açılışı',
          referenceType: 'initial_balance',
          transactionDate: new Date().toISOString(),
        });
        await transRepo.save(trans);
      }

      return saved;
    });
  }

  async transferBetweenAccounts(
    dto: TransferFundsDto,
    userId?: string,
    groupId?: string,
  ): Promise<{ success: boolean; fromBalance: number; toBalance: number }> {
    const gid = this.resolveGroupId(groupId);
    const amount = roundToPennies(Number(dto.amount));
    if (amount <= 0) {
      throw new BadRequestException('Transfer tutarı 0’dan büyük olmalıdır.');
    }
    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException('Kaynak ve hedef hesap aynı olamaz.');
    }

    return await this.executeWithRLS(gid, async (qr) => {
      const accRepo = qr.manager.getRepository(FinanceAccountEntity);
      const transRepo = qr.manager.getRepository(AccountTransactionEntity);

      const fromAcc = await accRepo.findOne({ where: { id: dto.fromAccountId, groupId: gid } });
      const toAcc = await accRepo.findOne({ where: { id: dto.toAccountId, groupId: gid } });

      if (!fromAcc || !toAcc) {
        throw new NotFoundException('Transfer edilecek hesap(lar) bulunamadı.');
      }

      if (Number(fromAcc.balance) < amount) {
        throw new BadRequestException(
          `Yetersiz bakiye. ${fromAcc.name} hesabında mevcut: ${Number(fromAcc.balance).toLocaleString('tr-TR')} ₺, transfer edilmek istenen: ${amount.toLocaleString('tr-TR')} ₺`
        );
      }

      fromAcc.balance = roundToPennies(Number(fromAcc.balance) - amount);
      toAcc.balance = roundToPennies(Number(toAcc.balance) + amount);

      const timeStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      fromAcc.lastActivity = `Bugün ${timeStr} · ${toAcc.name} Virman Çıkışı`;
      toAcc.lastActivity = `Bugün ${timeStr} · ${fromAcc.name} Virman Girişi`;

      await accRepo.save([fromAcc, toAcc]);

      const transFrom = transRepo.create({
        groupId: gid,
        accountId: fromAcc.id,
        accountName: fromAcc.name,
        type: 'transfer_out',
        amount: amount,
        balanceAfter: fromAcc.balance,
        title: dto.description || `Virman Transferi -> ${toAcc.name}`,
        category: 'virman',
        counterparty: toAcc.name,
        referenceType: 'transfer',
        transactionDate: new Date().toISOString(),
      });

      const transTo = transRepo.create({
        groupId: gid,
        accountId: toAcc.id,
        accountName: toAcc.name,
        type: 'transfer_in',
        amount: amount,
        balanceAfter: toAcc.balance,
        title: dto.description || `Virman Transferi <- ${fromAcc.name}`,
        category: 'virman',
        counterparty: fromAcc.name,
        referenceType: 'transfer',
        transactionDate: new Date().toISOString(),
      });

      await transRepo.save([transFrom, transTo]);

      await this.auditLogsService.recordLog({
        groupId: gid,
        userId: userId || null,
        userName: 'Yönetici',
        userRole: 'admin',
        action: 'ACCOUNT_TRANSFER',
        category: 'FINANCE',
        level: 'INFO',
        resource: `${fromAcc.name} -> ${toAcc.name} (${amount} ₺)`,
        details: { fromAccountId: fromAcc.id, toAccountId: toAcc.id, amount, description: dto.description },
      });

      return {
        success: true,
        fromBalance: fromAcc.balance,
        toBalance: toAcc.balance,
      };
    });
  }

  async getAccountTransactions(accountId?: string, groupId?: string): Promise<AccountTransactionEntity[]> {
    const gid = this.resolveGroupId(groupId);
    return await this.executeWithRLS(gid, async (qr) => {
      const transRepo = qr.manager.getRepository(AccountTransactionEntity);
      const whereClause: any = { groupId: gid };
      if (accountId) {
        whereClause.accountId = accountId;
      }

      return await transRepo.find({
        where: whereClause,
        order: { transactionDate: 'DESC', createdAt: 'DESC' },
        take: 100,
      });
    });
  }

  async getPlatformPosRevenue(): Promise<PosRevenueSummary> {
    // Cross-tenant without RLS (SuperAdmin level)
    const records = await this.posFeesRepo.find({
      order: { createdAt: 'DESC' },
      take: 50,
    });

    const totalGrossVolume = roundToPennies(records.reduce((s, r) => s + Number(r.grossAmount), 0));
    const totalSiteraRevenue = roundToPennies(records.reduce((s, r) => s + Number(r.siteraRevenue), 0));
    const totalGatewayFees = roundToPennies(records.reduce((s, r) => s + Number(r.gatewayFee), 0));
    const totalNetToSites = roundToPennies(records.reduce((s, r) => s + Number(r.netAmount), 0));

    return {
      totalGrossVolume,
      totalSiteraRevenue,
      totalGatewayFees,
      totalNetToSites,
      totalTransactionsCount: records.length,
      recentTransactions: records,
    };
  }

  async getExpenses(groupId?: string): Promise<ExpenseEntity[]> {
    const gid = this.resolveGroupId(groupId);
    return await this.executeWithRLS(gid, (qr) =>
      qr.manager.getRepository(ExpenseEntity).find({
        where: { groupId: gid },
        order: { dueDate: 'ASC' },
      }),
    );
  }

  // --- SUMMARY METRICS ---
  async getSummary(groupId?: string): Promise<FinanceSummary> {
    const gid = this.resolveGroupId(groupId);
    const settings = await this.getSettings(gid);

    return await this.executeWithRLS(gid, async (qr) => {
      const debtRepo = qr.manager.getRepository(DebtEntity);
      const payRepo = qr.manager.getRepository(PaymentEntity);
      const periodRepo = qr.manager.getRepository(PeriodEntity);
      const expRepo = qr.manager.getRepository(ExpenseEntity);

      const accounts = await this.ensureGroupAccounts(qr, gid);
      const debts = await debtRepo.find({ where: { groupId: gid } });
      const expenses = await expRepo.find({ where: { groupId: gid } });
      const pendingApprovalsCount = await payRepo.count({
        where: { groupId: gid, status: 'pending' },
      });

      const activePeriod = await periodRepo.findOne({
        where: { groupId: gid, status: 'active' },
        order: { createdAt: 'DESC' },
      });

      return FinanceCalculationEngine.calculateFinancialSummaryMetrics({
        accounts,
        debts,
        expenses,
        annualBudget: settings?.annualBudget,
        activePeriodName: activePeriod?.name || 'Aktif Dönem',
        pendingApprovalsCount,
        lateFeeRate: settings?.lateFeeRate,
        lateFeeEnabled: settings?.lateFeeEnabled,
      });
    });
  }

  // --- YÖNETİM KURULU FİNANSAL RAPORLAMA ---
  async getFinancialReports(
    groupId?: string,
    periodId?: string,
    year?: number,
  ): Promise<FinancialReportPackage> {
    const gid = this.resolveGroupId(groupId);
    const settings = await this.getSettings(gid);
    const group = await this.groupsRepo.findOne({ where: { id: gid } });
    const siteName = group?.name || 'Site Yönetimi';

    return await this.executeWithRLS(gid, async (qr) => {
      const accRepo = qr.manager.getRepository(FinanceAccountEntity);
      const debtRepo = qr.manager.getRepository(DebtEntity);
      const periodRepo = qr.manager.getRepository(PeriodEntity);
      const expRepo = qr.manager.getRepository(ExpenseEntity);

      let activePeriod: PeriodEntity | null = null;
      if (periodId) {
        activePeriod = await periodRepo.findOne({ where: { id: periodId, groupId: gid } });
      }
      if (!activePeriod) {
        activePeriod = await periodRepo.findOne({
          where: { groupId: gid, status: 'active' },
          order: { createdAt: 'DESC' },
        });
      }

      const periodName = activePeriod?.name || (year ? `${year} Yılı Konsolide Rapor` : '2026 Yılı Konsolide Rapor');
      const debts = await debtRepo.find({ where: { groupId: gid } });
      const expenses = await expRepo.find({ where: { groupId: gid } });
      const accounts = await accRepo.find({ where: { groupId: gid } });

      // 1. GELİR - GİDER TABLOSU
      let duesAccrued = 0;
      let duesCollected = 0;
      let fixtureAccrued = 0;
      let fixtureCollected = 0;
      let otherAccrued = 0;
      let otherCollected = 0;

      for (const d of debts) {
        const amt = Number(d.amount) || 0;
        const paid = Number(d.paidAmount) || 0;
        if (d.category === 'fixture') {
          fixtureAccrued += amt;
          fixtureCollected += paid;
        } else if (d.category === 'dues') {
          duesAccrued += amt;
          duesCollected += paid;
        } else {
          otherAccrued += amt;
          otherCollected += paid;
        }
      }

      const totalAccruedIncome = roundToPennies(duesAccrued + fixtureAccrued + otherAccrued);
      const totalCollectedIncome = roundToPennies(duesCollected + fixtureCollected + otherCollected);

      const incomes: IncomeItem[] = [
        {
          category: 'Aidat Gelirleri',
          title: 'Aylık Rutin Aidat ve İşletme Avansı',
          accruedAmount: roundToPennies(duesAccrued),
          collectedAmount: roundToPennies(duesCollected),
          pendingAmount: roundToPennies(Math.max(0, duesAccrued - duesCollected)),
          collectionRate: duesAccrued > 0 ? Math.round((duesCollected / duesAccrued) * 100) : 0,
        },
        {
          category: 'Demirbaş & Yatırım Fonu',
          title: 'Demirbaş, Yenileme ve Asansör Payı',
          accruedAmount: roundToPennies(fixtureAccrued),
          collectedAmount: roundToPennies(fixtureCollected),
          pendingAmount: roundToPennies(Math.max(0, fixtureAccrued - fixtureCollected)),
          collectionRate: fixtureAccrued > 0 ? Math.round((fixtureCollected / fixtureAccrued) * 100) : 0,
        },
      ];

      if (otherAccrued > 0 || otherCollected > 0) {
        incomes.push({
          category: 'Diğer Gelirler',
          title: 'Gecikme Zammı ve Muhtelif Gelirler',
          accruedAmount: roundToPennies(otherAccrued),
          collectedAmount: roundToPennies(otherCollected),
          pendingAmount: roundToPennies(Math.max(0, otherAccrued - otherCollected)),
          collectionRate: otherAccrued > 0 ? Math.round((otherCollected / otherAccrued) * 100) : 0,
        });
      }

      const expenseItems: ExpenseReportItem[] = expenses.map((e) => ({
        id: e.id,
        category: e.category,
        title: e.title,
        vendor: e.vendor || 'Tedarikçi Firma',
        amount: roundToPennies(Number(e.amount) || 0),
        dueDate: e.dueDate || new Date().toISOString().slice(0, 10),
        status: e.status,
      }));

      const totalExpense = roundToPennies(expenseItems.reduce((s, e) => s + e.amount, 0));
      const netCashSurplus = roundToPennies(totalCollectedIncome - totalExpense);
      const accrualSurplus = roundToPennies(totalAccruedIncome - totalExpense);
      const annualBudget = Number(settings?.annualBudget) || 180000;
      const budgetSpentRate = annualBudget > 0 ? Math.round((totalExpense / annualBudget) * 100) : 0;
      const collectionRate = totalAccruedIncome > 0 ? Math.round((totalCollectedIncome / totalAccruedIncome) * 100) : 0;

      const incomeExpense: IncomeExpenseStatement = {
        periodName,
        totalAccruedIncome,
        totalCollectedIncome,
        totalExpense,
        netCashSurplus,
        accrualSurplus,
        budgetSpentRate,
        collectionRate,
        incomes,
        expenses: expenseItems,
      };

      // 2. AYLIK MİZAN (Trial Balance)
      const cashAcc = accounts.find((a) => a.type === 'cash');
      const bankAccs = accounts.filter((a) => a.type === 'bank');
      const fundAccs = accounts.filter((a) => a.type === 'fund');

      const cashBalance = roundToPennies(Number(cashAcc?.balance) || 0);
      const bankBalance = roundToPennies(bankAccs.reduce((s, a) => s + Number(a.balance), 0));
      const fundBalance = roundToPennies(fundAccs.reduce((s, a) => s + Number(a.balance), 0));
      const totalReceivable = roundToPennies(Math.max(0, totalAccruedIncome - totalCollectedIncome));
      const unpaidExpenses = roundToPennies(
        expenseItems.filter((e) => e.status === 'unpaid').reduce((s, e) => s + e.amount, 0),
      );

      const trialAccounts: TrialBalanceAccount[] = [
        {
          code: '100.01',
          name: 'Yönetici Nakit Kasası',
          type: 'asset',
          debit: cashBalance + 5000,
          credit: 5000,
          debitBalance: cashBalance,
          creditBalance: 0,
        },
        {
          code: '102.01',
          name: 'Ziraat Bankası Ana Vadesiz Hesap',
          type: 'asset',
          debit: bankBalance + totalExpense,
          credit: totalExpense,
          debitBalance: bankBalance,
          creditBalance: 0,
        },
        {
          code: '102.02',
          name: 'Yatırım & Demirbaş Fon Hesabı',
          type: 'asset',
          debit: fundBalance,
          credit: 0,
          debitBalance: fundBalance,
          creditBalance: 0,
        },
        {
          code: '120.01',
          name: 'Sakinlerden Aidat Alacakları',
          type: 'asset',
          debit: totalAccruedIncome,
          credit: totalCollectedIncome,
          debitBalance: totalReceivable,
          creditBalance: 0,
        },
        {
          code: '320.01',
          name: 'Satıcılar & Hizmet Borçları',
          type: 'liability',
          debit: roundToPennies(totalExpense - unpaidExpenses),
          credit: totalExpense,
          debitBalance: 0,
          creditBalance: unpaidExpenses,
        },
        {
          code: '600.01',
          name: 'Tahakkuk Eden Aidat Gelirleri',
          type: 'revenue',
          debit: 0,
          credit: totalAccruedIncome,
          debitBalance: 0,
          creditBalance: totalAccruedIncome,
        },
        {
          code: '770.01',
          name: 'Ortak Alan Yönetim & Tesis Giderleri',
          type: 'expense',
          debit: totalExpense,
          credit: 0,
          debitBalance: totalExpense,
          creditBalance: 0,
        },
      ];

      const rawDebitBalance = roundToPennies(trialAccounts.reduce((s, a) => s + a.debitBalance, 0));
      const rawCreditBalance = roundToPennies(trialAccounts.reduce((s, a) => s + a.creditBalance, 0));
      const balanceDiff = roundToPennies(rawDebitBalance - rawCreditBalance);

      if (balanceDiff !== 0) {
        if (balanceDiff > 0) {
          trialAccounts.push({
            code: '500.01',
            name: 'Önceki Dönem Devir & Fon Bakiyesi',
            type: 'equity',
            debit: 0,
            credit: balanceDiff,
            debitBalance: 0,
            creditBalance: balanceDiff,
          });
        } else {
          trialAccounts.push({
            code: '500.01',
            name: 'Önceki Dönem Devir Açığı',
            type: 'equity',
            debit: Math.abs(balanceDiff),
            credit: 0,
            debitBalance: Math.abs(balanceDiff),
            creditBalance: 0,
          });
        }
      }

      const totalDebit = roundToPennies(trialAccounts.reduce((s, a) => s + a.debit, 0));
      const totalCredit = roundToPennies(trialAccounts.reduce((s, a) => s + a.credit, 0));
      const totalDebitBalance = roundToPennies(trialAccounts.reduce((s, a) => s + a.debitBalance, 0));
      const totalCreditBalance = roundToPennies(trialAccounts.reduce((s, a) => s + a.creditBalance, 0));

      const trialBalance: TrialBalance = {
        periodName,
        asOfDate: new Date().toISOString().slice(0, 10),
        accounts: trialAccounts,
        totalDebit,
        totalCredit,
        totalDebitBalance,
        totalCreditBalance,
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.05 || Math.abs(totalDebitBalance - totalCreditBalance) < 0.05,
      };

      // 3. YÖNETİM KURULU BİLANÇOSU
      const currentAssets: BalanceSheetItem[] = [
        { code: '100', title: 'Hazır Değerler - Nakit Kasa', amount: cashBalance },
        { code: '102', title: 'Hazır Değerler - Banka Mevduatları', amount: bankBalance },
      ];
      if (fundBalance > 0) {
        currentAssets.push({ code: '108', title: 'Yatırım ve Rezerv Fonları', amount: fundBalance });
      }
      currentAssets.push({ code: '120', title: 'Sakinlerden Aidat Alacakları', amount: totalReceivable });

      const totalCurrentAssets = roundToPennies(currentAssets.reduce((s, a) => s + a.amount, 0));

      const shortTermLiabilities: BalanceSheetItem[] = [
        { code: '320', title: 'Ödenecek Tedarikçi & Fatura Borçları', amount: unpaidExpenses },
      ];
      const totalShortTermLiabilities = roundToPennies(shortTermLiabilities.reduce((s, l) => s + l.amount, 0));

      const equityAmount = roundToPennies(Math.max(0, totalCurrentAssets - totalShortTermLiabilities));
      const equity: BalanceSheetItem[] = [
        { code: '500', title: 'Yedek Demirbaş Rezerv Fonu', amount: roundToPennies(fundBalance) },
        { code: '590', title: 'Dönem Net Kasa Fazlası (Özkaynak)', amount: roundToPennies(Math.max(0, equityAmount - fundBalance)) },
      ];
      const totalEquity = roundToPennies(equity.reduce((s, e) => s + e.amount, 0));
      const totalLiabilitiesAndEquity = roundToPennies(totalShortTermLiabilities + totalEquity);

      const balanceSheet: BalanceSheet = {
        periodName,
        asOfDate: new Date().toISOString().slice(0, 10),
        currentAssets,
        totalCurrentAssets,
        totalAssets: totalCurrentAssets,
        shortTermLiabilities,
        totalShortTermLiabilities,
        equity,
        totalEquity,
        totalLiabilitiesAndEquity,
        isBalanced: Math.abs(totalCurrentAssets - totalLiabilitiesAndEquity) < 0.05,
      };

      return {
        siteName,
        periodName,
        asOfDate: new Date().toISOString().slice(0, 10),
        generatedAt: new Date().toISOString(),
        kpis: {
          totalLiquidity: roundToPennies(cashBalance + bankBalance + fundBalance),
          totalReceivable,
          totalCollected: totalCollectedIncome,
          totalExpenses: totalExpense,
          netSurplus: netCashSurplus,
          collectionRate,
          budgetSpentRate,
          annualBudget,
        },
        incomeExpense,
        trialBalance,
        balanceSheet,
      };
    });
  }

  /**
   * Get site info, bank details and management contact for resident portal
   */
  async getSiteInfo(groupId?: string): Promise<{
    siteName: string;
    bankName: string;
    accountHolder: string;
    iban: string;
    managerPhone: string;
    securityPhone: string;
  }> {
    const gid = this.resolveGroupId(groupId);

    return await this.executeWithRLS(gid, async (qr) => {
      const groupRepo = qr.manager.getRepository(GroupEntity);
      const accRepo = qr.manager.getRepository(FinanceAccountEntity);
      const uRepo = qr.manager.getRepository(UserEntity);

      const [group, accounts, users] = await Promise.all([
        groupRepo.findOne({ where: { id: gid } }),
        accRepo.find({ where: { groupId: gid } }),
        uRepo.find({ where: { groupId: gid } }),
      ]);

      const primaryAccount =
        accounts.find((a) => a.isPrimary && a.type === 'bank') ||
        accounts.find((a) => a.type === 'bank') ||
        accounts[0];

      const adminUser = users.find((u) => u.role === 'admin' || u.role === 'superadmin');
      const securityUser = users.find((u) => u.role === 'security');

      return {
        siteName: group?.name || 'Sitera Rezidans',
        bankName: primaryAccount?.bankName || 'Ziraat Bankası',
        accountHolder: primaryAccount?.name || `${group?.name || 'Site'} Yönetimi`,
        iban: primaryAccount?.iban || 'TR00 0001 0090 1234 5678 5001',
        managerPhone: adminUser?.phone || '0212 456 78 90',
        securityPhone: securityUser?.phone || '0212 456 78 99',
      };
    });
  }
}

