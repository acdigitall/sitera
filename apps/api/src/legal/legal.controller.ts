import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Headers,
  ForbiddenException,
} from '@nestjs/common';
import { LegalService } from './legal.service';
import { UpdateLegalDocumentDto } from '@sitera/shared';

@Controller('legal')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  /**
   * Belirli bir yasal belgeyi getirir (Halka açık - Giriş ekranı ve genel erişim).
   * Örnek: GET /api/legal/terms veya GET /api/legal/kvkk
   */
  @Get(':type')
  async getDocument(@Param('type') type: string) {
    if (type !== 'terms' && type !== 'kvkk') {
      type = 'terms';
    }
    const data = await this.legalService.getDocument(type as 'terms' | 'kvkk');
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Tüm yasal belgeleri listeler (Yalnızca Süper Admin).
   * GET /api/legal/admin/all
   */
  @Get('admin/all')
  async getAllDocuments(@Headers('x-user-role') userRole?: string) {
    if (userRole !== 'superadmin') {
      throw new ForbiddenException('Bu işlem yalnızca Süper Yöneticilere açıktır.');
    }
    const data = await this.legalService.getAllDocuments();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Yasal belgeyi günceller (Yalnızca Süper Admin).
   * PUT /api/legal/:type
   */
  @Put(':type')
  async updateDocument(
    @Param('type') type: string,
    @Body() dto: UpdateLegalDocumentDto,
    @Headers('x-user-role') userRole?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    if (userRole !== 'superadmin') {
      throw new ForbiddenException('Yasal metinleri yalnızca Süper Yönetici güncelleyebilir.');
    }
    if (type !== 'terms' && type !== 'kvkk') {
      type = 'terms';
    }
    const data = await this.legalService.updateDocument(
      type as 'terms' | 'kvkk',
      dto,
      userId,
    );
    return {
      success: true,
      data,
      message: `${data.title} başarıyla güncellendi.`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Yasal belgeyi orijinal varsayılan şablona sıfırlar (Yalnızca Süper Admin).
   * POST /api/legal/admin/reset/:type
   */
  @Post('admin/reset/:type')
  async resetToDefault(
    @Param('type') type: string,
    @Headers('x-user-role') userRole?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    if (userRole !== 'superadmin') {
      throw new ForbiddenException('Bu işlem yalnızca Süper Yöneticilere açıktır.');
    }
    if (type !== 'terms' && type !== 'kvkk') {
      type = 'terms';
    }
    const data = await this.legalService.resetToDefault(
      type as 'terms' | 'kvkk',
      userId,
    );
    return {
      success: true,
      data,
      message: `${data.title} varsayılan şablona başarıyla sıfırlandı.`,
      timestamp: new Date().toISOString(),
    };
  }
}
