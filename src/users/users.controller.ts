import { Controller, Get, Post, Body, Param, UseGuards, Query, Patch, ForbiddenException, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private validateId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID format');
    }
  }

  @Post()
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Create a new user' })
  async create(@Body() createUserDto: CreateUserDto, @GetUser() currentUser: any) {
    const { password, ...userData } = createUserDto;
    
    // Enforce tenant isolation for admins
    if (currentUser.role === 'admin') {
      userData.tenantId = currentUser.tenantId.toString();
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    return this.usersService.create({ ...userData, passwordHash });
  }

  @Get()
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Get users' })
  findAll(@Query('tenantId') tenantId?: string, @GetUser() currentUser?: any) {
    // If admin, force filter by their own tenantId
    if (currentUser?.role === 'admin') {
      return this.usersService.findAll(currentUser.tenantId.toString());
    }
    return this.usersService.findAll(tenantId);
  }

  @Get(':id')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Get a user by ID' })
  async findOne(@Param('id') id: string, @GetUser() currentUser?: any) {
    this.validateId(id);
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    
    const userTenantId = user.tenantId?.['_id'] || user.tenantId;
    if (currentUser?.role === 'admin' && userTenantId?.toString() !== currentUser.tenantId.toString()) {
      throw new ForbiddenException('Access denied');
    }
    
    return user;
  }

  @Patch(':id/password')
  @ApiOperation({ summary: 'Update user password' })
  async updatePassword(
    @Param('id') id: string, 
    @Body() updatePasswordDto: UpdatePasswordDto,
    @GetUser() currentUser: any
  ) {
    this.validateId(id);
    const isSelf = currentUser._id.toString() === id;
    const isSuperAdmin = currentUser.role === 'super_admin';
    const isAdmin = currentUser.role === 'admin';

    // Permission check
    if (!isSelf && !isSuperAdmin && !isAdmin) {
      throw new ForbiddenException('You do not have permission to change this password');
    }

    const targetUser = await this.usersService.findById(id);
    if (!targetUser) throw new NotFoundException('User not found');

    // Tenant check for admins resetting others' passwords
    if (isAdmin && !isSelf) {
      const targetTenantId = targetUser.tenantId?.['_id'] || targetUser.tenantId;
      if (targetTenantId?.toString() !== currentUser.tenantId.toString()) {
        throw new ForbiddenException('You can only manage users in your organization');
      }
    }

    // Security check for self-service updates
    if (isSelf && !isSuperAdmin) {
      if (!updatePasswordDto.currentPassword) {
        throw new UnauthorizedException('Current password is required');
      }
      
      const userWithPass = await this.usersService.findOneByEmail(targetUser.email);
      const isMatch = await bcrypt.compare(updatePasswordDto.currentPassword, userWithPass!.passwordHash);
      if (!isMatch) {
        throw new UnauthorizedException('Current password does not match');
      }
    }

    const passwordHash = await bcrypt.hash(updatePasswordDto.password, 10);
    return this.usersService.updatePassword(id, passwordHash);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user data' })
  async update(
    @Param('id') id: string, 
    @Body() updateData: UpdateUserDto,
    @GetUser() currentUser: any
  ) {
    this.validateId(id);
    const isSelf = currentUser._id.toString() === id;
    const isSuperAdmin = currentUser.role === 'super_admin';
    const isAdmin = currentUser.role === 'admin';

    if (!isSelf && !isSuperAdmin && !isAdmin) {
      throw new ForbiddenException('You do not have permission to update this profile');
    }

    if (isAdmin && !isSelf) {
      const targetUser = await this.usersService.findById(id);
      const targetTenantId = targetUser?.tenantId?.['_id'] || targetUser?.tenantId;
      if (!targetUser || targetTenantId?.toString() !== currentUser.tenantId.toString()) {
        throw new ForbiddenException('You can only update users in your organization');
      }
    }

    return this.usersService.update(id, updateData);
  }
}
