import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DomainsService } from './domains.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('domains')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Add a new custom domain' })
  create(@GetUser('tenantId') tenantId: string, @Body() createDomainDto: CreateDomainDto) {
    return this.domainsService.create(tenantId, createDomainDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all domains for the tenant' })
  findAll(@GetUser('tenantId') tenantId: string) {
    return this.domainsService.findAll(tenantId);
  }

  @Post(':id/verify')
  @Roles('admin')
  @ApiOperation({ summary: 'Verify domain ownership via DNS TXT record' })
  verify(@GetUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.domainsService.verify(tenantId, id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Remove a domain' })
  remove(@GetUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.domainsService.remove(tenantId, id);
  }
}
