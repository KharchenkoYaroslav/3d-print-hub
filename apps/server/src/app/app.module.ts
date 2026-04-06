import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageModule } from '@p3d-hub/minio';
import { AuthModule } from '@p3d-hub/auth';
import { UsersModule } from '@p3d-hub/user';
import { ModelManagementModule } from '@p3d-hub/model-management';
import { DatabaseModule } from '@p3d-hub/database';
import { RedisModule } from '@p3d-hub/redis';
import { AuthController } from './auth.controller';
import { UsersController } from './user.controller';
import { CategoriesController } from './categories.controller';
import { ModelsController } from './models.controller';
import { ModelController } from './model.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    StorageModule,
    RedisModule,
    AuthModule,
    UsersModule,
    ModelManagementModule,
  ],
  controllers: [AuthController, UsersController, CategoriesController, ModelsController, ModelController],
})
export class AppModule {}
