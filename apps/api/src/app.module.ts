import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { GroupsModule } from './groups/groups.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { FinanceModule } from './finance/finance.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { AuditLogsModule } from './audit/audit-logs.module';
import { TicketsModule } from './tickets/tickets.module';
import { SupportModule } from './support/support.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SecurityModule, RateLimitGuard, DtoValidationInterceptor } from './security/security.module';
import { ObservabilityModule } from './observability/observability.module';
import { GlobalExceptionFilter } from './observability/global-exception.filter';
import { LoggingInterceptor } from './observability/logging.interceptor';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TenantMiddleware } from './tenancy/tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    DatabaseModule,
    RedisModule,
    GroupsModule,
    UsersModule,
    AuthModule,
    FinanceModule,
    AnnouncementsModule,
    AuditLogsModule,
    TicketsModule,
    SupportModule,
    NotificationsModule,
    SecurityModule,
    ObservabilityModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DtoValidationInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
