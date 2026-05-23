import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { Blog, BlogDocument } from '../blogs/schemas/blog.schema';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
  ) {}

  async create(tenantId: string, blogSlug: string, createDto: CreateCommentDto) {
    const blog = await this.blogModel.findOne({ tenantId, slug: blogSlug }).exec();
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    if (!blog.allowComments) {
      throw new ForbiddenException('Comments are disabled for this post');
    }

    const comment = new this.commentModel({
      ...createDto,
      blogId: blog._id,
      tenantId,
      status: 'pending', // Default to pending for moderation
    });

    await comment.save();

    // Increment total comments count on blog
    await this.blogModel.findByIdAndUpdate(blog._id, {
      $inc: { totalComments: 1 },
    }).exec();

    return comment;
  }

  async findByBlog(tenantId: string, blogSlug: string) {
    const blog = await this.blogModel.findOne({ tenantId, slug: blogSlug }).exec();
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    return this.commentModel
      .find({ blogId: blog._id, status: 'approved' } as any)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAllForTenant(tenantId: string) {
    return this.commentModel
      .find({ tenantId })
      .populate('blogId', 'title slug')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateStatus(tenantId: string, commentId: string, status: string) {
    const comment = await this.commentModel.findOneAndUpdate(
      { _id: commentId, tenantId },
      { status },
      { new: true },
    ).exec();

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async remove(tenantId: string, commentId: string) {
    const comment = await this.commentModel.findOne({ _id: commentId, tenantId }).exec();
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.commentModel.deleteOne({ _id: commentId, tenantId }).exec();

    // Decrement total comments count on blog
    await this.blogModel.findByIdAndUpdate(comment.blogId, {
      $inc: { totalComments: -1 },
    }).exec();

    return { success: true };
  }
}
