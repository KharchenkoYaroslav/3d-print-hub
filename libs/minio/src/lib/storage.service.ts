import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID, createHash } from 'crypto';
import * as Minio from 'minio';
import { InjectMinio } from './minio/minio.decorator';
import { PhysicalFile, PhysicalFileDocument } from './physical-file.schema';

export const MAIN_BUCKET = 'main' as const;

export const PREFIXES = {
  MODELS: 'models',
  PHOTOS: 'photos',
} as const;

export type PrefixName = (typeof PREFIXES)[keyof typeof PREFIXES];

const STL_MIME_TYPES = ['model/stl', 'application/sla'];
const STL_EXTENSIONS = ['.stl'];

const IMAGE_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff',
];
const IMAGE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.svg+xml', '.bmp', '.tiff', '.tif',
];

@Injectable()
export class StorageService {
  constructor(
    @InjectMinio() private readonly minioService: Minio.Client,
    @InjectModel(PhysicalFile.name) private physicalFileModel: Model<PhysicalFileDocument>
  ) {}

  async onModuleInit() {
    const buckets = await this.minioService.listBuckets();
    const existingBuckets = new Set(buckets.map((b) => b.name));

    if (!existingBuckets.has(MAIN_BUCKET)) {
      await this.minioService.makeBucket(MAIN_BUCKET);
    }

    const readOnlyPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${MAIN_BUCKET}/*`],
        },
      ],
    };

    await this.minioService.setBucketPolicy(
      MAIN_BUCKET,
      JSON.stringify(readOnlyPolicy),
    );
  }

  async uploadFile(file: Express.Multer.File): Promise<{ filename: string }> {
    const etag = createHash('md5').update(file.buffer).digest('hex');

    const existingFile = await this.physicalFileModel.findOne({ etag });

    if (existingFile) {
      await this.physicalFileModel.updateOne(
        { _id: existingFile._id },
        { $inc: { ref_count: 1 } }
      );
      return { filename: existingFile.filename };
    }

    const prefix = this.determinePrefix(file);
    const objectPath = `${prefix}/${randomUUID()}-${file.originalname}`;

    await this.minioService.putObject(
      MAIN_BUCKET,
      objectPath,
      file.buffer,
      file.size,
    );

    await this.physicalFileModel.create({
      filename: objectPath,
      etag: etag,
      ref_count: 1,
    });

    return { filename: objectPath };
  }

  async deleteFile(filename: string): Promise<void> {
    const file = await this.physicalFileModel.findOneAndUpdate(
      { filename },
      { $inc: { ref_count: -1 } },
      { new: true }
    );

    if (file && file.ref_count <= 0) {
      await this.minioService.removeObject(MAIN_BUCKET, filename);
      await this.physicalFileModel.deleteOne({ filename });
    }
  }

  determinePrefix(file: Express.Multer.File): PrefixName {
    const extension = this.getFileExtension(file.originalname).toLowerCase();
    const mimeType = file.mimetype?.toLowerCase() || '';

    const isStl = STL_EXTENSIONS.includes(extension) || STL_MIME_TYPES.includes(mimeType);
    const isImage = IMAGE_EXTENSIONS.includes(extension) || IMAGE_MIME_TYPES.includes(mimeType);

    if (isStl) {
      return PREFIXES.MODELS;
    }

    if (isImage) {
      return PREFIXES.PHOTOS;
    }

    throw new BadRequestException(
      `Unsupported file type: ${file.originalname} (${mimeType || extension}). Only STL files and images are allowed.`,
    );
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) {
      return '';
    }
    return filename.substring(lastDot);
  }
}
