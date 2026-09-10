import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTicketEntity } from './support-ticket.entity';
import { GroupEntity } from '../groups/group.entity';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { AuditLogsModule } from '../audit/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupportTicketEntity, GroupEntity]),
    AuditLogsModule,
  ],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
