import { Controller, Post, Get, Body, Param, Req, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { TrackInteractionDto } from './dto/track-interaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('public/:slug/track')
  @ApiOperation({ summary: 'Track a blog interaction (public)' })
  async trackInteraction(
    @Req() req: any,
    @Param('slug') slug: string,
    @Body() trackDto: TrackInteractionDto,
  ) {
    const tenantId = req.tenant?._id;
    return this.analyticsService.trackInteraction(tenantId, slug, trackDto.type);
  }

  @Get('overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get analytics overview for tenant' })
  async getOverview(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getOverview(tenantId);
  }

  @Get('trends')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get view trends for tenant' })
  async getTrends(
    @GetUser('tenantId') tenantId: string,
    @Query('days') days?: number,
  ) {
    return this.analyticsService.getTrends(tenantId, days);
  }

  @Get('top-posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get top performing posts' })
  async getTopPosts(
    @GetUser('tenantId') tenantId: string,
    @Query('limit') limit?: number,
  ) {
    return this.analyticsService.getTopPosts(tenantId, limit);
  }
}
