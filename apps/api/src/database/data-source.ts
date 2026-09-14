import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from potential root or package .env files
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { GroupEntity } from '../groups/group.entity';
import { UserEntity } from '../users/user.entity';
import { PeriodEntity } from '../finance/entities/period.entity';
import { DebtEntity } from '../finance/entities/debt.entity';
import { PaymentEntity } from '../finance/entities/payment.entity';
import { FinanceAccountEntity } from '../finance/entities/finance-account.entity';
import { AccountTransactionEntity } from '../finance/entities/account-transaction.entity';
import { PlatformPosFeeEntity } from '../finance/entities/platform-pos-fee.entity';
import { ExpenseEntity } from '../finance/entities/expense.entity';
import { FinanceSettingsEntity } from '../finance/entities/finance-settings.entity';
import { AnnouncementEntity } from '../announcements/announcement.entity';
import { TicketEntity } from '../tickets/ticket.entity';
import { AuditLogEntity } from '../audit/audit-log.entity';
import { NotificationEntity } from '../notifications/notification.entity';
import { SupportTicketEntity } from '../support/support-ticket.entity';
import { LegalDocumentEntity } from '../legal/legal-document.entity';

const dbUrl = process.env.DATABASE_URL;

export const AppDataSource = new DataSource(
  dbUrl
    ? {
        type: 'postgres',
        url: dbUrl,
        ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
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
        migrations: [path.join(__dirname, 'migrations/*{.ts,.js}')],
        synchronize: false,
        logging: false,
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        username: process.env.DB_USER || process.env.USER || 'cagataydalaman',
        password: process.env.DB_PASSWORD || undefined,
        database: process.env.DB_NAME || 'sitera_db',
        ssl: false,
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
        migrations: [path.join(__dirname, 'migrations/*{.ts,.js}')],
        synchronize: false,
        logging: false,
      },
);
