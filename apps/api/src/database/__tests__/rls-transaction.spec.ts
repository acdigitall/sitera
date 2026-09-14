import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FinanceService } from '../../finance/finance.service';
import { FinanceSettingsEntity } from '../../finance/entities/finance-settings.entity';

describe('PostgreSQL RLS Transaction Scoping (executeWithRLS Testleri)', () => {
  let service: FinanceService;
  let mockQueryRunner: any;
  let dataSource: any;
  let settingsRepo: any;
  let callOrder: string[];

  beforeEach(() => {
    callOrder = [];

    settingsRepo = {
      findOne: vi.fn().mockImplementation(async () => {
        callOrder.push('operation');
        return {
          id: 'settings-1',
          groupId: 'grp-test-rls',
          currency: 'TRY',
        };
      }),
      create: vi.fn((dto) => dto),
      save: vi.fn((entity) => Promise.resolve(entity)),
    };

    mockQueryRunner = {
      connect: vi.fn().mockImplementation(async () => {
        callOrder.push('connect');
      }),
      startTransaction: vi.fn().mockImplementation(async () => {
        callOrder.push('startTransaction');
      }),
      query: vi.fn().mockImplementation(async (sql: string) => {
        callOrder.push(`query: ${sql}`);
        return [];
      }),
      commitTransaction: vi.fn().mockImplementation(async () => {
        callOrder.push('commitTransaction');
      }),
      rollbackTransaction: vi.fn().mockImplementation(async () => {
        callOrder.push('rollbackTransaction');
      }),
      release: vi.fn().mockImplementation(async () => {
        callOrder.push('release');
      }),
      manager: {
        getRepository: vi.fn().mockReturnValue(settingsRepo),
      },
    };

    dataSource = {
      createQueryRunner: vi.fn().mockReturnValue(mockQueryRunner),
    };

    service = new FinanceService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      settingsRepo,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      dataSource,
      { recordLog: vi.fn() } as any,
    );
  });

  it('SET LOCAL app.current_group_id ifadesi mutlaka startTransaction sonrasında ve işlem öncesinde çalıştırılmalıdır', async () => {
    await service.getSettings('grp-test-rls');

    expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
    expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();

    // Verify exact call order for transaction integrity
    const startIndex = callOrder.indexOf('startTransaction');
    const queryIndex = callOrder.findIndex((entry) =>
      entry.includes("SET LOCAL app.current_group_id = 'grp-test-rls'"),
    );
    const opIndex = callOrder.indexOf('operation');
    const commitIndex = callOrder.indexOf('commitTransaction');
    const releaseIndex = callOrder.indexOf('release');

    expect(startIndex).toBeGreaterThanOrEqual(0);
    expect(queryIndex).toBeGreaterThan(startIndex);
    expect(opIndex).toBeGreaterThan(queryIndex);
    expect(commitIndex).toBeGreaterThan(opIndex);
    expect(releaseIndex).toBeGreaterThan(commitIndex);
  });

  it('İşlem sırasında hata meydana geldiğinde rollbackTransaction çağrılmalı ve bağlantı güvenle kapatılmalıdır', async () => {
    settingsRepo.findOne.mockRejectedValueOnce(new Error('Simüle edilmiş veritabanı hatası'));

    await expect(service.getSettings('grp-test-rls')).rejects.toThrow(
      'Simüle edilmiş veritabanı hatası',
    );

    expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();

    const rollbackIndex = callOrder.indexOf('rollbackTransaction');
    const releaseIndex = callOrder.indexOf('release');
    expect(releaseIndex).toBeGreaterThan(rollbackIndex);
  });
});
