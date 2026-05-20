import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase alphanumeric and dashes' })
  slug: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subdomain?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customDomain?: string;
}
