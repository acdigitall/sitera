import { Module } from '@nestjs/common';
import { FileSecurityService } from './file-security.service';
import { RateLimitGuard } from './rate-limit.guard';
import { DtoValidationInterceptor } from './dto-validation.interceptor';
import { DtoValidationPipe } from './dto-validation.pipe';
import { AuditLogsModule } from '../audit/audit-logs.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [AuditLogsModule, RedisModule],
  providers: [
    FileSecurityService,
    RateLimitGuard,
    DtoValidationInterceptor,
    DtoValidationPipe,
  ],
  exports: [
    FileSecurityService,
    RateLimitGuard,
    DtoValidationInterceptor,
    DtoValidationPipe,
  ],
})
export class SecurityModule {}
export { SecurityModule as FileSecurityModule };
export * from './rate-limit.decorator';
export * from './validate-dto.decorator';
export * from './rate-limit.guard';
export * from './dto-validation.interceptor';
export * from './dto-validation.pipe';
export * from './file-security.service';
