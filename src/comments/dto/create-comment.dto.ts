import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  authorName: string;

  @ApiProperty()
  @IsEmail()
  authorEmail: string;
}
