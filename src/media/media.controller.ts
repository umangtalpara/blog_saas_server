import { Controller, Post, Body, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Generate S3 presigned upload URL' })
  async getUploadUrl(@Req() req: any, @Body() createUploadDto: CreateUploadDto) {
    const tenantId = req.user.tenantId;
    return this.mediaService.generateUploadUrl(
      tenantId,
      createUploadDto.fileName,
      createUploadDto.contentType,
      createUploadDto.folder,
    );
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload file directly to S3 via backend' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string' },
      },
    },
  })
  async uploadFile(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string = 'blogs',
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    console.log(`Uploading file: ${file.originalname}, size: ${file.size}, mimetype: ${file.mimetype}`);
    const tenantId = req.user.tenantId;
    return this.mediaService.uploadFile(tenantId, file, folder);
  }
}
