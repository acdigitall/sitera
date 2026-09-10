import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { GroupEntity } from '../groups/group.entity';
import { UserEntity } from '../users/user.entity';
import { PeriodEntity } from '../finance/entities/period.entity';
import { DebtEntity } from '../finance/entities/debt.entity';
import { PaymentEntity } from '../finance/entities/payment.entity';
import { FinanceAccountEntity } from '../finance/entities/finance-account.entity';
import { ExpenseEntity } from '../finance/entities/expense.entity';
import { FinanceSettingsEntity } from '../finance/entities/finance-settings.entity';
import { AnnouncementEntity } from '../announcements/announcement.entity';
import { TicketEntity } from '../tickets/ticket.entity';
import { AuditLogEntity } from '../audit/audit-log.entity';
import { NotificationEntity } from '../notifications/notification.entity';
import { SupportTicketEntity } from '../support/support-ticket.entity';
import { LegalDocumentEntity } from '../legal/legal-document.entity';
import { AccountTransactionEntity } from '../finance/entities/account-transaction.entity';
import { PlatformPosFeeEntity } from '../finance/entities/platform-pos-fee.entity';

const TENANT_TABLES = [
  'users',
  'periods',
  'debts',
  'payments',
  'finance_accounts',
  'account_transactions',
  'expenses',
  'finance_settings',
  'announcements',
  'tickets',
  'audit_logs',
  'notifications',
  'platform_support_tickets',
];

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST') || process.env.DB_HOST || 'localhost',
        port: Number(config.get<number>('DB_PORT') || process.env.DB_PORT || 5432),
        username: config.get<string>('DB_USER') || process.env.DB_USER || process.env.USER || 'cagataydalaman',
        password: config.get<string>('DB_PASSWORD') || process.env.DB_PASSWORD || undefined,
        database: config.get<string>('DB_NAME') || process.env.DB_NAME || 'sitera_db',
        entities: [
          GroupEntity,
          UserEntity,
          PeriodEntity,
          DebtEntity,
          PaymentEntity,
          FinanceAccountEntity,
          AccountTransactionEntity,
          PlatformPosFeeEntity,
          ExpenseEntity,
          FinanceSettingsEntity,
          AnnouncementEntity,
          TicketEntity,
          AuditLogEntity,
          NotificationEntity,
          SupportTicketEntity,
          LegalDocumentEntity,
        ],
        synchronize: true, // Auto-create tables in development
        logging: false,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      this.logger.log('PostgreSQL bağlantısı kuruldu. RLS (Row Level Security) politikaları yapılandırılıyor...');
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        // Enable UUID extension if available
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

        for (const tableName of TENANT_TABLES) {
          const tableExists = await queryRunner.hasTable(tableName);
          if (tableExists) {
            await queryRunner.query(`ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;`);
            await queryRunner.query(`ALTER TABLE "${tableName}" FORCE ROW LEVEL SECURITY;`);
            await queryRunner.query(`DROP POLICY IF EXISTS "tenant_isolation_policy" ON "${tableName}";`);
            await queryRunner.query(`
              CREATE POLICY "tenant_isolation_policy" ON "${tableName}"
              FOR ALL
              USING (
                group_id = NULLIF(current_setting('app.current_group_id', true), '')::uuid
                OR current_setting('app.current_group_id', true) = 'bypass_rls'
              )
              WITH CHECK (
                group_id = NULLIF(current_setting('app.current_group_id', true), '')::uuid
                OR current_setting('app.current_group_id', true) = 'bypass_rls'
              );
            `);
          }
        }

        this.logger.log('✅ PostgreSQL RLS (Row Level Security) tüm tenant tablolarına başarıyla uygulandı.');
      } finally {
        await queryRunner.release();
      }
    } catch (err: any) {
      this.logger.warn(`RLS konfigürasyonu sırasında uyarı: ${err.message}`);
    }
  }
}
