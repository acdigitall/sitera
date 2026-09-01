import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiResponse, AppHealthStatus } from '@sitera/shared';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getWelcome(): ApiResponse<{ message: string; project: string; tenancyModel: string }> {
    return {
      success: true,
      data: this.appService.getWelcome(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  async getHealth(): Promise<ApiResponse<AppHealthStatus & { database: string; redis: string }>> {
    const health = await this.appService.getHealth();
    return {
      success: true,
      data: health,
      timestamp: new Date().toISOString(),
    };
  }
}
