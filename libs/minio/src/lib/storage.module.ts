import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { MinioModule } from './minio/minio.module';
import { MongooseModule } from '@nestjs/mongoose';
import { PhysicalFile, PhysicalFileSchema } from './physical-file.schema';

@Module({
  imports: [
    MinioModule,
    MongooseModule.forFeature([
      { name: PhysicalFile.name, schema: PhysicalFileSchema },
    ]),
  ],
  controllers: [],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
