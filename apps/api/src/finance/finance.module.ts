import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeriodEntity } from './entities/period.entity';
import { DebtEntity } from './entities/debt.entity';
import { PaymentEntity } from './entities/payment.entity';
import { FinanceAccountEntity } from './entities/finance-account.entity';
import { ExpenseEntity } from './entities/expense.entity';
import { FinanceSettingsEntity } from './entities/finance-settings.entity';
import { GroupEntity } from '../groups/group.entity';
import { UserEntity } from '../users/user.entity';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PeriodEntity,
      DebtEntity,
      PaymentEntity,
      FinanceAccountEntity,
      ExpenseEntity,
      FinanceSettingsEntity,
      GroupEntity,
      UserEntity,
    ]),
    NotificationsModule,
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
