import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiResponse, User, CreateUserDto, UpdateUserDto, PaginatedResult } from '@sitera/shared';
import { CurrentGroupId } from '../tenancy/tenant.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @CurrentGroupId() groupId?: string,
    @Query('page') pageParam?: string,
    @Query('limit') limitParam?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ): Promise<ApiResponse<User[] | PaginatedResult<User>>> {
    const page = pageParam !== undefined ? parseInt(pageParam, 10) : undefined;
    const limit = limitParam !== undefined ? parseInt(limitParam, 10) : undefined;
    const data = await this.usersService.findAll(groupId, { page, limit, search, role });
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentGroupId() groupId?: string,
  ): Promise<ApiResponse<User>> {
    const user = await this.usersService.findOne(id, groupId);
    return {
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  async create(
    @Body() dto: CreateUserDto,
    @CurrentGroupId() groupId?: string,
  ): Promise<ApiResponse<User>> {
    const user = await this.usersService.create(dto, groupId);
    return {
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      data: user,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('bulk')
  async createBulk(
    @Body() dtos: CreateUserDto[],
    @CurrentGroupId() groupId?: string,
  ): Promise<ApiResponse<User[]>> {
    const users = await this.usersService.createBulk(dtos, groupId);
    return {
      success: true,
      message: `${users.length} daire başarıyla oluşturuldu`,
      data: users,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentGroupId() groupId?: string,
  ): Promise<ApiResponse<User>> {
    const user = await this.usersService.update(id, dto, groupId);
    return {
      success: true,
      message: 'Kullanıcı güncellendi',
      data: user,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentGroupId() groupId?: string,
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    const deleted = await this.usersService.remove(id, groupId);
    return {
      success: true,
      message: 'Kullanıcı silindi',
      data: { deleted },
      timestamp: new Date().toISOString(),
    };
  }
}
