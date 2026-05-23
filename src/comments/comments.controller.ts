import { Controller, Post, Get, Patch, Delete, Body, Param, Req, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('public/:slug')
  @ApiOperation({ summary: 'Submit a new comment (public)' })
  async create(
    @Req() req: any,
    @Param('slug') slug: string,
    @Body() createDto: CreateCommentDto,
  ) {
    const tenantId = req.tenant?._id;
    return this.commentsService.create(tenantId, slug, createDto);
  }

  @Get('public/:slug')
  @ApiOperation({ summary: 'Get approved comments for a blog post' })
  async findByBlog(@Req() req: any, @Param('slug') slug: string) {
    const tenantId = req.tenant?._id;
    return this.commentsService.findByBlog(tenantId, slug);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all comments for tenant (admin)' })
  async findAll(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.commentsService.findAllForTenant(tenantId);
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update comment status (approve/reject)' })
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.commentsService.updateStatus(tenantId, id, status);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.commentsService.remove(tenantId, id);
  }
}
