import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Blog, BlogDocument } from './schemas/blog.schema';
import { CreateBlogDto } from './dto/create-blog.dto';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import { PLAN_LIMITS } from '../billing/plan-limits';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  async create(tenantId: string, authorId: string, createBlogDto: CreateBlogDto): Promise<BlogDocument> {
    const tenant = await this.tenantModel.findById(tenantId).exec();
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const plan = tenant.plan || 'free';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    const postCount = await this.blogModel.countDocuments({ tenantId }).exec();
    if (postCount >= limits.maxBlogPosts) {
      throw new ForbiddenException(`You have reached the limit of ${limits.maxBlogPosts} blog posts for the ${plan} plan. Please upgrade to create more posts.`);
    }

    const existingBlog = await this.blogModel.findOne({ tenantId, slug: createBlogDto.slug }).exec();
    if (existingBlog) {
      throw new ConflictException('Blog with this slug already exists for this tenant');
    }

    const createdBlog = new this.blogModel({
      ...createBlogDto,
      tenantId,
      authorId,
      publishedAt: createBlogDto.status === 'published' ? new Date() : undefined,
    });
    return createdBlog.save();
  }

  async findAll(tenantId: string): Promise<BlogDocument[]> {
    return this.blogModel.find({ tenantId }).exec();
  }

  async findAllPublished(tenantId: string): Promise<BlogDocument[]> {
    return this.blogModel.find({ tenantId, status: 'published' }).sort({ publishedAt: -1 }).exec();
  }

  async findOne(tenantId: string, id: string): Promise<BlogDocument> {
    const blog = await this.blogModel.findOne({ _id: id, tenantId }).exec();
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    return blog;
  }

  async update(tenantId: string, id: string, updateBlogDto: any): Promise<BlogDocument> {
    const existingBlog = await this.blogModel.findOne({ _id: id, tenantId }).exec();
    if (!existingBlog) {
      throw new NotFoundException('Blog not found');
    }

    const updateData = { ...updateBlogDto };
    if (updateBlogDto.status === 'published' && existingBlog.status !== 'published') {
      updateData.publishedAt = new Date();
    }

    const blog = await this.blogModel.findOneAndUpdate(
      { _id: id, tenantId },
      updateData,
      { new: true },
    ).exec();
    
    return blog!;
  }

  async autosave(tenantId: string, id: string, updateData: any): Promise<BlogDocument> {
    const blog = await this.blogModel.findOne({ _id: id, tenantId }).exec();
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    // When autosaving, we only update fields and never change status to published
    // We also don't update publishedAt
    return this.blogModel.findOneAndUpdate(
      { _id: id, tenantId },
      { ...updateData },
      { new: true },
    ).exec() as Promise<BlogDocument>;
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const result = await this.blogModel.deleteOne({ _id: id, tenantId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Blog not found');
    }
  }

  async findBySlug(tenantId: string, slug: string): Promise<BlogDocument> {
    const blog = await this.blogModel.findOne({ tenantId, slug, status: 'published' }).exec();
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    return blog;
  }
}
