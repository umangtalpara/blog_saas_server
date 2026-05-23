import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type BlogAnalyticsDocument = BlogAnalytics & Document;

@Schema({ timestamps: true })
export class BlogAnalytics {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Blog', required: true })
  blogId: string;

  @Prop({ required: true })
  date: string; // YYYY-MM-DD for time-series grouping

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  likes: number;

  @Prop({ default: 0 })
  shares: number;
}

export const BlogAnalyticsSchema = SchemaFactory.createForClass(BlogAnalytics);

// Index for fast lookups by tenant/blog and date range
BlogAnalyticsSchema.index({ tenantId: 1, date: 1 });
BlogAnalyticsSchema.index({ blogId: 1, date: 1 });
BlogAnalyticsSchema.index({ tenantId: 1, blogId: 1, date: 1 }, { unique: true });
