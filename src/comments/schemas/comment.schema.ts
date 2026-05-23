import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Blog', required: true })
  blogId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  authorName: string;

  @Prop({ required: true })
  authorEmail: string;

  @Prop({ default: 'pending', enum: ['pending', 'approved', 'rejected'] })
  status: string;

  @Prop({ default: false })
  isFlagged: boolean;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// Index for fetching comments for a blog
CommentSchema.index({ blogId: 1, status: 1, createdAt: -1 });
// Index for admin management
CommentSchema.index({ tenantId: 1, createdAt: -1 });
