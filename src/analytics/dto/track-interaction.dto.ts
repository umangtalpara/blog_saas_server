import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TrackInteractionDto {
  @ApiProperty({ enum: ['view', 'like', 'share'] })
  @IsEnum(['view', 'like', 'share'])
  @IsNotEmpty()
  type: 'view' | 'like' | 'share';
}
