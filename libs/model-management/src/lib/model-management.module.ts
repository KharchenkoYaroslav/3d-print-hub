import { Module } from '@nestjs/common';
import { ModelManagementService } from './model-management.service';
import { Categories, CategoriesSchema} from './categories.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Model, ModelSchema } from './model.schema';
import { RedisModule } from '@p3d-hub/redis';
import { StorageModule } from '@p3d-hub/minio';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Categories.name, schema: CategoriesSchema },
      { name: Model.name, schema: ModelSchema }
    ]),
    RedisModule,
    StorageModule,
  ],
  providers: [ModelManagementService],
  exports: [ModelManagementService],
})
export class ModelManagementModule {}
