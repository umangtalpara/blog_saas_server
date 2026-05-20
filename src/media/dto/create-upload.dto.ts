import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUploadDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;

  @IsString()
  @IsOptional()
  folder: string = 'blogs';
}
