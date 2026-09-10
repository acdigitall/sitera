import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiResponse, AuthResponse, AuthUser, LoginDto } from '@sitera/shared';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: any,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-forwarded-for') forwardedFor?: string,
  ): Promise<ApiResponse<AuthResponse>> {
    const ipAddress = (forwardedFor ? forwardedFor.split(',')[0].trim() : req.ip) || '127.0.0.1';
    const data = await this.authService.login(dto, ipAddress, userAgent || 'Web Client');
    return {
      success: true,
      message: 'Giriş başarılı',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('me')
  async getMe(
    @Headers('authorization') authHeader?: string,
  ): Promise<ApiResponse<AuthUser>> {
    const user = await this.authService.getMe(authHeader || '');
    return {
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Headers('authorization') authHeader?: string,
    @Req() req?: any,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-forwarded-for') forwardedFor?: string,
  ): Promise<ApiResponse<{ loggedOut: boolean }>> {
    const ipAddress = (forwardedFor ? forwardedFor.split(',')[0].trim() : req?.ip) || '127.0.0.1';
    await this.authService.logout(authHeader || '', ipAddress, userAgent || 'Web Client');
    return {
      success: true,
      message: 'Başarıyla çıkış yapıldı',
      data: { loggedOut: true },
      timestamp: new Date().toISOString(),
    };
  }
}
