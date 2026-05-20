import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './schemas/blog.schema';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { PublicBlogsController } from './public-blogs.controller';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
    TenantsModule,
  ],
  providers: [BlogsService],
  controllers: [BlogsController, PublicBlogsController],
  exports: [BlogsService],
})
export class BlogsModule {}
