import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { BlogAnalytics, BlogAnalyticsSchema } from './schemas/analytics.schema';
import { Blog, BlogSchema } from '../blogs/schemas/blog.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BlogAnalytics.name, schema: BlogAnalyticsSchema },
      { name: Blog.name, schema: BlogSchema },
    ]),
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
