import { Controller, Get, Param, NotFoundException, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BlogsService } from './blogs.service';
import type { Request } from 'express';

@ApiTags('public-blogs')
@Controller('public/blogs')
export class PublicBlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all published blogs for the current tenant' })
  async findAll(@Req() req: Request) {
    const tenant = (req as any).tenant;
    if (!tenant) {
      throw new NotFoundException('Tenant context not found');
    }
    return this.blogsService.findAllPublished(tenant._id);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a published blog by slug' })
  async findOne(@Req() req: Request, @Param('slug') slug: string) {
    const tenant = (req as any).tenant;
    if (!tenant) {
      throw new NotFoundException('Tenant context not found');
    }
    return this.blogsService.findBySlug(tenant._id, slug);
  }
}
