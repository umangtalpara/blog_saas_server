import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlogAnalytics, BlogAnalyticsDocument } from './schemas/analytics.schema';
import { Blog, BlogDocument } from '../blogs/schemas/blog.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(BlogAnalytics.name) private analyticsModel: Model<BlogAnalyticsDocument>,
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
  ) {}

  async trackInteraction(tenantId: string, blogSlug: string, type: 'view' | 'like' | 'share') {
    const blog = await this.blogModel.findOne({ tenantId, slug: blogSlug }).exec();
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 1. Update/Create Daily Time-Series Data
    const incField = `${type}s`;
    await this.analyticsModel.findOneAndUpdate(
      { tenantId, blogId: blog._id, date } as any,
      { $inc: { [incField]: 1 } },
      { upsert: true, new: true },
    ).exec();

    // 2. Update Lifetime Metrics on Blog
    const lifetimeField = `total${type.charAt(0).toUpperCase() + type.slice(1)}s`;
    await this.blogModel.findByIdAndUpdate(blog._id, {
      $inc: { [lifetimeField]: 1 },
    }).exec();

    return { success: true };
  }

  async getOverview(tenantId: string) {
    const blogs = await this.blogModel.find({ tenantId }).exec();
    
    return {
      totalViews: blogs.reduce((sum, b) => sum + (b.totalViews || 0), 0),
      totalLikes: blogs.reduce((sum, b) => sum + (b.totalLikes || 0), 0),
      totalShares: blogs.reduce((sum, b) => sum + (b.totalShares || 0), 0),
      totalComments: blogs.reduce((sum, b) => sum + (b.totalComments || 0), 0),
      totalBlogs: blogs.length,
    };
  }

  async getTrends(tenantId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    return this.analyticsModel.find({
      tenantId,
      date: { $gte: startDateStr },
    }).sort({ date: 1 }).exec();
  }

  async getTopPosts(tenantId: string, limit = 5) {
    return this.blogModel
      .find({ tenantId })
      .sort({ totalViews: -1 })
      .limit(limit)
      .exec();
  }
}
