import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
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
  async login(@Body() dto: LoginDto): Promise<ApiResponse<AuthResponse>> {
    const data = await this.authService.login(dto);
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
  ): Promise<ApiResponse<{ loggedOut: boolean }>> {
    await this.authService.logout(authHeader || '');
    return {
      success: true,
      message: 'Başarıyla çıkış yapıldı',
      data: { loggedOut: true },
      timestamp: new Date().toISOString(),
    };
  }
}
