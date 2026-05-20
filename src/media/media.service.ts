import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class MediaService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('aws.region'),
      credentials: {
        accessKeyId: this.configService.get<string>('aws.accessKeyId') || '',
        secretAccessKey: this.configService.get<string>('aws.secretAccessKey') || '',
      },
    });
    this.bucketName = this.configService.get<string>('aws.bucketName') || '';
  }

  async generateUploadUrl(tenantId: any, fileName: string, contentType: string, folder: string = 'blogs') {
    const tId = this.extractTenantId(tenantId);
    const key = `${folder}/${tId}/${Date.now()}-${fileName}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    const region = this.configService.get<string>('aws.region');
    const fileUrl = `https://${this.bucketName}.s3.${region}.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl, key };
  }

  async uploadFile(tenantId: any, file: Express.Multer.File, folder: string = 'blogs') {
    try {
      const tId = this.extractTenantId(tenantId);
      const key = `${folder}/${tId}/${Date.now()}-${file.originalname}`;
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      console.log(`Sending to S3: bucket=${this.bucketName}, key=${key}`);
      await this.s3Client.send(command);
      
      const region = this.configService.get<string>('aws.region');
      const fileUrl = `https://${this.bucketName}.s3.${region}.amazonaws.com/${key}`;

      return { fileUrl, key };
    } catch (error) {
      console.error('S3 Upload Service Error:', error);
      throw error;
    }
  }

  private extractTenantId(tenantId: any): string {
    if (!tenantId) return 'system';
    if (typeof tenantId === 'string') return tenantId;
    if (tenantId._id) return tenantId._id.toString();
    return tenantId.toString();
  }

  async deleteMedia(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return this.s3Client.send(command);
  }
}
