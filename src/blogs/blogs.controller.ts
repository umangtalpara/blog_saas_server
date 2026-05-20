import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('blogs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Post()
  @Roles('admin', 'editor')
  @ApiOperation({ summary: 'Create a new blog' })
  create(@GetUser('tenantId') tenantId: string, @GetUser('_id') userId: string, @Body() createBlogDto: CreateBlogDto) {
    return this.blogsService.create(tenantId, userId, createBlogDto);
  }

  @Get()
  @Roles('admin', 'editor', 'viewer')
  @ApiOperation({ summary: 'Get all blogs for the tenant' })
  findAll(@GetUser('tenantId') tenantId: string) {
    return this.blogsService.findAll(tenantId);
  }

  @Get(':id')
  @Roles('admin', 'editor', 'viewer')
  @ApiOperation({ summary: 'Get a blog by ID' })
  findOne(@GetUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.blogsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: 'Update a blog' })
  update(@GetUser('tenantId') tenantId: string, @Param('id') id: string, @Body() updateBlogDto: any) {
    return this.blogsService.update(tenantId, id, updateBlogDto);
  }

  @Post('autosave')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: 'Autosave a blog draft' })
  autosave(@GetUser('tenantId') tenantId: string, @Body() data: any) {
    const { id, ...updateData } = data;
    return this.blogsService.autosave(tenantId, id, updateData);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a blog' })
  remove(@GetUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.blogsService.remove(tenantId, id);
  }
}
