import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import 'multer';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.getOrThrow<string>('DO_SPACES_ENDPOINT');
    const region = this.config.getOrThrow<string>('DO_SPACES_REGION');

    this.bucket = this.config.getOrThrow<string>('DO_SPACES_BUCKET');

    this.s3 = new S3Client({
      endpoint: `https://${endpoint}`,
      region,
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('DO_SPACES_KEY'),
        secretAccessKey: this.config.getOrThrow<string>('DO_SPACES_SECRET'),
      },
      forcePathStyle: false,
    });

    // Prefer CDN URL if configured, fallback to Spaces public URL
    const cdnUrl = this.config.get<string>('DO_SPACES_CDN_URL');
    this.baseUrl = cdnUrl ?? `https://${this.bucket}.${endpoint}`;
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = 'uploads',
  ): Promise<string> {
    const ext = extname(file.originalname);
    const key = `${folder}/${randomUUID()}${ext}`;

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        }),
      );
    } catch (err) {
      throw new InternalServerErrorException(
        `Error al subir archivo: ${(err as Error).message}`,
      );
    }

    return `${this.baseUrl}/${key}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const key = fileUrl.replace(`${this.baseUrl}/`, '');

    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (err) {
      throw new InternalServerErrorException(
        `Error al eliminar archivo: ${(err as Error).message}`,
      );
    }
  }

  getPublicUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }
}
