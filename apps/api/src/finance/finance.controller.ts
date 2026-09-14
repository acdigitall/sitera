import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import {
  CreatePeriodDto,
  CreateDebtDto,
  CreatePaymentDto,
  CreateFinanceAccountDto,
  TransferFundsDto,
  UpdateFinanceSettingsDto,
  CashCollectionDto,
  DischargeResidentDto,
} from '@sitera/shared';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';

@Controller('finance')
@UseGuards(PermissionsGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('settings')
  @RequirePermissions('finance:view')
  async getSettings(@Headers('x-group-id') groupId?: string) {
    const data = await this.financeService.getSettings(groupId);
    return { success: true, data };
  }

  @Patch('settings')
  @RequirePermissions('finance:manage')
  async updateSettings(
    @Body() dto: UpdateFinanceSettingsDto,
    @Headers('x-group-id') groupId?: string,
  ) {
    const data = await this.financeService.updateSettings(dto, groupId);
    return { success: true, data };
  }

  @Post('auto-generate')
  @RequirePermissions('finance:manage')
  async autoGenerate(
    @Body('force') force: boolean,
    @Headers('x-group-id') groupId?: string,
  ) {
    const data = await this.financeService.autoGenerateMonthlyDues(groupId, force);
    return { success: true, data };
  }

  @Get('periods')
  @RequirePermissions('finance:view')
  async getPeriods(@Headers('x-group-id') groupId?: string) {
    const data = await this.financeService.getPeriods(groupId);
    return { success: true, data };
  }

  @Post('periods')
  @RequirePermissions('finance:manage')
  async createPeriod(
    @Body() dto: CreatePeriodDto,
    @Headers('x-group-id') groupId?: string,
  ) {
    const data = await this.financeService.createPeriod(dto, groupId);
    return { success: true, data };
  }

  @Delete('periods/:id')
  @RequirePermissions('finance:manage')
  async deletePeriod(
    @Param('id') id: string,
    @Headers('x-group-id') groupId?: string,
  ) {
    const data = await this.financeService.deletePeriod(id, groupId);
    return { success: true, data };
  }

  @Get('debts')
  @RequirePermissions('finance:view')
  async getDebts(
    @Query('userId') userId?: string,
    @Query('unit') unit?: string,
    @Headers('x-group-id') groupId?: string,
  ) {
    const data = await this.financeService.getDebts(groupId, userId, unit);
    return { success: true, data };
  }

  @Get('debts/paginated')
  @RequirePermissions('finance:view')
  async getDebtsPaginated(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('periodId') periodId?: string,
    @Query('search') search?: string,
    @Headers('x-group-id') groupId?: string,
  ) {
    const data = await this.financeService.getDebtsPaginated(groupId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
      status: (status as any) || 'all',
      category: (category as any) || 'all',
      periodId: periodId || undefined,
      search: search || undefined,
    });
    return { success: true, data };
  }

  @Get('my-debts')
  async getMyDebts(
    @Query('userId') queryUserId?: string,
    @Query('unit') unit?: string,
    @Headers('x-user-id') headerUserId?: string,
    @Headers('x-group-id') groupId?: string,
  ) {
    const userId = headerUserId || queryUserId;
    const data = await this.financeService.getDebts(groupId, userId, unit);
    return { success: true, data };
  }

  @Get('site-info')
  async getSiteInfo(@Headers('x-group-id') groupId?: string) {
    const data = await this.financeService.getSiteInfo(groupId);
    return { success: true, data };
  }


  @Post('debts')
  @RequirePermissions('finance:manage')
  async createDebt(
    @Body() dto: CreateDebtDto,
    @Headers('x-group-id') groupId?: string,
  ) {
    const data = await this.financeService.createDebt(dto, groupId);
    return { success: true, data };
  }

  @Get('payments/pending')
  @RequirePermissions('finance:view')
  async getPendingPayments(@Headers('x-group-id') groupId?: string) {
    const data = await this.financeService.getPendingPayments(groupId);
    return { success: true, data };
  }

  @Post('payments/:id/approve')
  @RequirePermissions('finance:approve')
  async approvePayment(
    @Param('id') id: string,
    @Body('approvedBy') approvedBy?: string,
    @Headers('x-group-id') groupId?: string,
  ) {
    const data = await this.financeService.approvePayment(id, approvedBy, groupId);
    return { success: true, data };
  }

  @Post('payments/:id/reject')
  @RequirePermissions('finance:approve')
  async rejectPayment(
    @Param('id') id: string,
    @Headers('x-group-id') groupId?: string,
  ) {
    const data = await this.financeService.rejectPayment(id, groupId);
    return { success: true, data };
  }

  @Post('payments')
  async createPayment(
    @Body() dto: CreatePaymentDto,
    @Body('userId') userId?: string,
    @Headers('x-group-id') groupId?: string,
  ) {
    const data = await this.financeService.createPayment(dto, userId, groupId);
    return { success: true, data };
  }

  @Post('cash-collection')
  @RequirePermissions('finance:manage')
  async recordCashCollection(
    @Body() dto: CashCollectionDto,
    @Body('approvedBy') approvedBy?: string,
    @Headers('x-group-id') groupId?: string,
  ) {
    const data = await this.financeService.recordCashCollection(dto, approvedBy, groupId);
    return { success: true, data };
  }

  @Post('discharge')
  @RequirePermissions('finance:manage')
  async dischargeResident(
    @Body() dto: DischargeResidentDto,
    @Headers('x-group-id') groupId?: string,
  ) {
    const data = await this.financeService.dischargeResident(dto, groupId);
    return { success: true, data };
  }

  @Get('accounts')
  @RequirePermissions('finance:view')
  async getAccounts(@Headers('x-group-id') groupId?: string) {
    const data = await this.financeService.getAccounts(groupId);
    return { success: true, data };
  }

  @Post('accounts')
  @RequirePermissions('finance:manage')
  async createAccount(
    @Body() dto: CreateFinanceAccountDto,
    @Headers('x-group-id') groupId?: string,
  ) {
    const data = await this.financeService.createAccount(dto, groupId);
    return { success: true, data };
  }

  @Post('accounts/transfer')
  @RequirePermissions('finance:manage')
  async transferFunds(
    @Body() dto: TransferFundsDto,
    @Headers('x-user-id') userId?: string,
    @Headers('x-group-id') groupId?: string,
  ) {
    const data = await this.financeService.transferBetweenAccounts(dto, userId, groupId);
    return { success: true, data };
  }

  @Get('accounts/:id/transactions')
  @RequirePermissions('finance:view')
  async getAccountTransactions(
    @Param('id') accountId: string,
    @Headers('x-group-id') groupId?: string,
  ) {
    const data = await this.financeService.getAccountTransactions(accountId, groupId);
    return { success: true, data };
  }

  @Get('transactions')
  @RequirePermissions('finance:view')
  async getAllTransactions(@Headers('x-group-id') groupId?: string) {
    const data = await this.financeService.getAccountTransactions(undefined, groupId);
    return { success: true, data };
  }

  @Get('pos-revenue')
  @RequirePermissions('system:manage')
  async getPosRevenue() {
    const data = await this.financeService.getPlatformPosRevenue();
    return { success: true, data };
  }

  @Get('expenses')
  @RequirePermissions('finance:view')
  async getExpenses(@Headers('x-group-id') groupId?: string) {
    const data = await this.financeService.getExpenses(groupId);
    return { success: true, data };
  }

  @Get('summary')
  @RequirePermissions('finance:view')
  async getSummary(@Headers('x-group-id') groupId?: string) {
    const data = await this.financeService.getSummary(groupId);
    return { success: true, data };
  }

  @Get('reports')
  @RequirePermissions('reports:view')
  async getReports(
    @Query('periodId') periodId?: string,
    @Query('year') yearParam?: string,
    @Headers('x-group-id') groupId?: string,
  ) {
    const year = yearParam ? parseInt(yearParam, 10) : undefined;
    const data = await this.financeService.getFinancialReports(groupId, periodId, year);
    return { success: true, data };
  }
}
