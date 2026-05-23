import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type BlogDocument = Blog & Document;

@Schema()
class SEO {
  @Prop()
  metaTitle: string;

  @Prop()
  metaDescription: string;

  @Prop([String])
  keywords: string[];

  @Prop()
  ogImage: string;
}

@Schema({ timestamps: true })
export class Blog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  authorId: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  subtitle: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  coverImage: string;

  @Prop([String])
  media: string[];

  @Prop([String])
  videos: string[];

  @Prop([String])
  tags: string[];

  @Prop([String])
  categories: string[];

  @Prop({ default: 'draft', enum: ['draft', 'published', 'scheduled', 'archived'] })
  status: string;

  @Prop({ type: SEO })
  seo: SEO;

  @Prop()
  scheduleAt?: Date;

  @Prop({ default: true })
  allowComments: boolean;

  @Prop({ default: false })
  featured: boolean;

  @Prop({ default: 'public', enum: ['public', 'private'] })
  visibility: string;

  @Prop()
  publishedAt?: Date;

  @Prop({ default: 0 })
  totalViews: number;

  @Prop({ default: 0 })
  totalLikes: number;

  @Prop({ default: 0 })
  totalShares: number;

  @Prop({ default: 0 })
  totalComments: number;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

// Index for multi-tenancy performance and unique slugs per tenant
BlogSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
