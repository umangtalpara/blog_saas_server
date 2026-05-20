import { Controller, Get, Post, Body, Param, UseGuards, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import * as bcrypt from 'bcrypt';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Create a new user' })
  async create(@Body() createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto;
    const passwordHash = await bcrypt.hash(password, 10);
    return this.usersService.create({ ...userData, passwordHash });
  }

  @Get()
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Get users' })
  findAll(@Query('tenantId') tenantId?: string) {
    // In a real multi-tenant app, we'd filter by req.user.tenantId if not super_admin
    // For now, simple find all or by tenantId
    return this.usersService.findAll(tenantId);
  }

  @Get(':id')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Get a user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id/password')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Update user password (Super Admin only)' })
  async updatePassword(@Param('id') id: string, @Body() updatePasswordDto: UpdatePasswordDto) {
    const passwordHash = await bcrypt.hash(updatePasswordDto.password, 10);
    return this.usersService.updatePassword(id, passwordHash);
  }

  @Patch(':id')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Update user data' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    // Prevent password update through this endpoint for security
    const { password, passwordHash, ...safeData } = updateData;
    return this.usersService.update(id, safeData);
  }
}
