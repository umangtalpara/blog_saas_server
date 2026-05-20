import { Controller, Get, Post, Body, Param, UseGuards, Request, NotFoundException, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { RequestTenantDto } from './dto/request-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, description: 'Tenant successfully created' })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Post('request')
  @ApiOperation({ summary: 'Request a new tenant account' })
  @ApiResponse({ status: 201, description: 'Tenant request submitted' })
  requestAccess(@Body() requestDto: RequestTenantDto) {
    return this.tenantsService.requestAccess(requestDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/approve')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Approve a pending tenant' })
  approve(@Param('id') id: string) {
    return this.tenantsService.approve(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Update a tenant' })
  update(@Param('id') id: string, @Body() updateTenantDto: any) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Get all tenants' })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get('public/info')
  @ApiOperation({ summary: 'Get public tenant info based on domain/subdomain' })
  getPublicInfo(@Request() req: any) {
    const tenant = req.tenant;
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return {
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      settings: tenant.settings,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Get a tenant by ID' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }
}
