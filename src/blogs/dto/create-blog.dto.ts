import { IsString, IsNotEmpty, IsArray, IsOptional, IsEnum, ValidateNested, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SeoDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  metaTitle: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  metaDescription: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  keywords: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  ogImage: string;
}

export class CreateBlogDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  subtitle: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  coverImage: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  media: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  videos: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  tags: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  categories: string[];

  @ApiProperty({ enum: ['draft', 'published', 'scheduled', 'archived'], default: 'draft' })
  @IsEnum(['draft', 'published', 'scheduled', 'archived'])
  @IsOptional()
  status: string;

  @ApiProperty({ type: SeoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SeoDto)
  seo: SeoDto;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  scheduleAt?: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  allowComments: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  featured: boolean;

  @ApiProperty({ enum: ['public', 'private'], default: 'public' })
  @IsEnum(['public', 'private'])
  @IsOptional()
  visibility: string;
}
