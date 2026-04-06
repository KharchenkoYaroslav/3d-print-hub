import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Categories, CategoriesDocument } from './categories.schema';
import { ModelDocument } from './model.schema';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { StorageService, PREFIXES } from '@p3d-hub/minio';
import { ModelRankingItem, ModelWithLikes, UpdateModelParams } from '@p3d-hub/shared-types';

@Injectable()
export class ModelManagementService {
  constructor(
    @InjectModel(Categories.name)
    private categoriesModel: Model<CategoriesDocument>,
    @InjectModel(Model.name) private modelBuilder: Model<ModelDocument>,
    @InjectRedis() private readonly redis: Redis,
    private readonly storageService: StorageService,
  ) {}

  // Categories

  async getAllCategoriesList(): Promise<CategoriesDocument[]> {
    return this.categoriesModel.find().lean().exec();
  }

  // Model

  // Model/basic

  async getModelById(
    id: string,
    userId: string,
  ): Promise<ModelWithLikes | null> {
    const model = await this.modelBuilder.findById(id).lean().exec();

    if (!model) {
      return null;
    }

    const [likesCount, hasLiked] = await Promise.all([
      this.getLikesCount(id),
      this.hasUserLiked(id, userId),
    ]);

    return {
      id: model._id.toString(),
      title: model.title,
      description: model.description || '',
      authorId: model.authorId.toString(),
      categoryIds: model.categoryIds?.map((id) => id.toString()) || [],
      size: model.size || '',
      recommendedMaterial: model.recommendedMaterial || '',
      estimatedPrintTime: model.estimatedPrintTime || 0,
      estimatedVolume: model.estimatedVolume || 0,
      allowCommercialUse: model.allowCommercialUse || false,
      files: {
        gallery: model.files?.gallery || [],
        models: model.files?.models || [],
      },
      likesCount,
      hasLiked,
    };
  }

  async createModel(userId: string, title: string): Promise<void> {
    const newModel = new this.modelBuilder({
      title,
      authorId: userId,
    });
    const savedModel = await newModel.save();
    const modelId = savedModel._id.toString();

    const pipeline = this.redis.pipeline();
    pipeline.zadd(`models:likes_ranking`, 0, modelId);
    pipeline.zadd(`author:${userId}:likes_ranking`, 0, modelId);

    pipeline.hmset(`model:${modelId}:info`, {
      authorId: userId,
      categoryIds: '[]',
    });

    await pipeline.exec();
  }

  async deleteModel(modelId: string, userId: string): Promise<void> {
    const model = await this.checkAccessAndGetModel(modelId, userId);

    const filesToDelete: string[] = [];

    if (model.files?.models?.length) {
      filesToDelete.push(...model.files.models.map((f) => f.filename));
    }
    if (model.files?.gallery?.length) {
      filesToDelete.push(...model.files.gallery.map((f) => f.filename));
    }

    if (filesToDelete.length > 0) {
      await Promise.all(
        filesToDelete.map((filename) =>
          this.storageService
            .deleteFile(filename)
            .catch((err) =>
              console.error(
                `Помилка видалення файлу ${filename} з MinIO:`,
                err,
              ),
            ),
        ),
      );
    }

    const categoryIds = model.categoryIds?.map((id) => id.toString()) || [];
    const authorId = model.authorId.toString();
    const pipeline = this.redis.pipeline();

    const usersWhoLiked = await this.redis.smembers(`model:${modelId}:likes`);
    usersWhoLiked.forEach((uid) => {
      pipeline.srem(`user:${uid}:likes`, modelId);
    });

    pipeline.zrem(`models:likes_ranking`, modelId);
    pipeline.zrem(`author:${authorId}:likes_ranking`, modelId);

    categoryIds.forEach((catId) => {
      pipeline.zrem(`category:${catId}:likes_ranking`, modelId);
    });

    pipeline.del(`model:${modelId}:likes`);
    pipeline.del(`model:${modelId}:info`);

    await pipeline.exec();

    await this.modelBuilder.findByIdAndDelete(modelId).exec();
  }

  async deleteAllUserModels(userId: string): Promise<void> {
    const userModels = await this.modelBuilder
      .find({ authorId: userId })
      .select('_id')
      .lean()
      .exec();

    if (userModels.length === 0) {
      return;
    }

    for (const model of userModels) {
      await this.deleteModel(model._id.toString(), userId);
    }
  }

  // Model/likes

  async toggleLike(modelId: string, userId: string): Promise<boolean> {
    let authorId: string;
    let categoryIds: string[] = [];
    const infoKey = `model:${modelId}:info`;

    const modelInfo = await this.redis.hgetall(infoKey);

    if (modelInfo && Object.keys(modelInfo).length > 0) {
      authorId = modelInfo['authorId'];
      categoryIds = JSON.parse(modelInfo['categoryIds'] || '[]');
    } else {
      const model = await this.modelBuilder
        .findById(modelId)
        .select('categoryIds authorId')
        .lean()
        .exec();

      if (!model) {
        await this.redis.srem(`user:${userId}:likes`, modelId);
        return false;
      }

      authorId = model.authorId.toString();
      categoryIds = model.categoryIds?.map((id) => id.toString()) || [];

      await this.redis.hmset(infoKey, {
        authorId: authorId,
        categoryIds: JSON.stringify(categoryIds),
      });
    }

    const setKey = `model:${modelId}:likes`;
    const userLikesKey = `user:${userId}:likes`;
    const globalRankingKey = `models:likes_ranking`;

    const wantsToUnlike = await this.redis.sismember(setKey, userId);

    let wasChanged = false;
    let increment = 0;
    let finalState = false;

    if (wantsToUnlike) {
      const removed = await this.redis.srem(setKey, userId);
      if (removed === 1) {
        await this.redis.srem(userLikesKey, modelId);
        wasChanged = true;
        increment = -1;
        finalState = false;
      }
    } else {
      const added = await this.redis.sadd(setKey, userId);
      if (added === 1) {
        await this.redis.sadd(userLikesKey, modelId);
        wasChanged = true;
        increment = 1;
        finalState = true;
      } else {
        finalState = true;
      }
    }

    if (wasChanged) {
      const pipeline = this.redis.pipeline();
      pipeline.zincrby(globalRankingKey, increment, modelId);

      if (authorId) {
        pipeline.zincrby(`author:${authorId}:likes_ranking`, increment, modelId);
      }

      categoryIds.forEach((catId) => {
        pipeline.zincrby(`category:${catId}:likes_ranking`, increment, modelId);
      });

      await pipeline.exec();
    }

    return finalState;
  }

  async removeAllUserLikes(userId: string): Promise<void> {
    const userLikesKey = `user:${userId}:likes`;
    const likedModelIds = await this.redis.smembers(userLikesKey);

    for (const modelId of likedModelIds) {
      await this.toggleLike(modelId, userId);
    }
    await this.redis.del(userLikesKey);
  }

  // Model/text

  async updateModelParams(
    modelId: string,
    userId: string,
    params: UpdateModelParams,
  ): Promise<void> {
    const model = await this.modelBuilder
      .findById(modelId)
      .select('authorId')
      .lean()
      .exec();

    if (!model) {
      throw new NotFoundException(`Model with ID ${modelId} not found`);
    }

    if (model.authorId.toString() !== userId) {
      throw new ForbiddenException('You are not the author of this model');
    }

    const updateData: Record<string, unknown> = {};

    if (params.title !== undefined) updateData['title'] = params.title;
    if (params.description !== undefined)
      updateData['description'] = params.description;
    if (params.size !== undefined) updateData['size'] = params.size;
    if (params.recommendedMaterial !== undefined)
      updateData['recommendedMaterial'] = params.recommendedMaterial;
    if (params.estimatedPrintTime !== undefined)
      updateData['estimatedPrintTime'] = params.estimatedPrintTime;
    if (params.estimatedVolume !== undefined)
      updateData['estimatedVolume'] = params.estimatedVolume;
    if (params.allowCommercialUse !== undefined)
      updateData['allowCommercialUse'] = params.allowCommercialUse;

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No valid parameters provided for update');
    }

    await this.modelBuilder
      .updateOne({ _id: modelId }, { $set: updateData })
      .exec();
  }

  async updateModelCategories(
    modelId: string,
    userId: string,
    categoryIds: string[],
  ): Promise<void> {
    if (!Array.isArray(categoryIds)) {
      throw new BadRequestException('categoryIds must be an array');
    }

    const oldModel = await this.modelBuilder
      .findById(modelId)
      .select('categoryIds authorId')
      .lean()
      .exec();

    if (!oldModel) {
      throw new NotFoundException(`Model with ID ${modelId} not found`);
    }

    if (oldModel.authorId.toString() !== userId) {
      throw new ForbiddenException('You are not the author of this model');
    }

    const oldCategoryIds =
      oldModel.categoryIds?.map((id) => id.toString()) || [];

    if (categoryIds.length > 0) {
      const validCategories = await this.categoriesModel
        .find({ _id: { $in: categoryIds } })
        .select('_id')
        .lean()
        .exec();

      const validCategoryIds = new Set(
        validCategories.map((cat) => cat._id.toString()),
      );

      const invalidIds = categoryIds.filter(
        (id) => !validCategoryIds.has(id.toString()),
      );

      if (invalidIds.length > 0) {
        throw new BadRequestException(
          `Invalid category: ${invalidIds.join(', ')}`,
        );
      }
    }

    const categoryObjectIds = categoryIds.map((id) => new Types.ObjectId(id));

    await this.modelBuilder
      .updateOne({ _id: modelId }, { $set: { categoryIds: categoryObjectIds } })
      .exec();

    await this.updateCategoryRankings(modelId, categoryIds, oldCategoryIds);
  }

  // Model/files/models-files

  async addModelFile(
    modelId: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<void> {
    const model = await this.checkAccessAndGetModel(modelId, userId);

    const prefix = this.storageService.determinePrefix(file);
    if (prefix !== PREFIXES.MODELS) {
      throw new BadRequestException('File must be a 3D model (STL)');
    }

    const { filename } = await this.storageService.uploadFile(file);

    const currentModels = model.files?.models || [];

    const existingFile = currentModels.find((m) => m.filename === filename);
    if (existingFile) {
      throw new BadRequestException('This model file already exists in the model');
    }

    const nextOrder =
      currentModels.length > 0
        ? Math.max(...currentModels.map((m) => m.order)) + 1
        : 1;

    await this.modelBuilder
      .updateOne(
        { _id: modelId },
        {
          $push: {
            'files.models': {
              originalName: file.originalname,
              filename,
              order: nextOrder,
            },
          },
        },
      )
      .exec();
  }

  async removeModelFile(
    modelId: string,
    userId: string,
    filenameToRemove: string,
  ): Promise<void> {
    const model = await this.checkAccessAndGetModel(modelId, userId);
    const currentModels = model.files?.models || [];

    const targetFile = currentModels.find(
      (f) => f.filename === filenameToRemove,
    );
    if (!targetFile) {
      throw new NotFoundException('File not found in this model');
    }

    await this.storageService.deleteFile(filenameToRemove);

    const updatedModels = currentModels
      .filter((f) => f.filename !== filenameToRemove)
      .sort((a, b) => a.order - b.order)
      .map((f, index) => ({ ...f, order: index + 1 }));

    await this.modelBuilder
      .updateOne({ _id: modelId }, { $set: { 'files.models': updatedModels } })
      .exec();
  }

  // Model/files/gallery

  async addGalleryPhoto(
    modelId: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<void> {
    const model = await this.checkAccessAndGetModel(modelId, userId);

    const prefix = this.storageService.determinePrefix(file);
    if (prefix !== PREFIXES.PHOTOS) {
      throw new BadRequestException('File must be an image');
    }

    const { filename } = await this.storageService.uploadFile(file);

    const currentGallery = model.files?.gallery || [];

    const existingPhoto = currentGallery.find((p) => p.filename === filename);
    if (existingPhoto) {
      throw new BadRequestException('This photo already exists in the model gallery');
    }

    const nextOrder =
      currentGallery.length > 0
        ? Math.max(...currentGallery.map((p) => p.order)) + 1
        : 1;

    await this.modelBuilder
      .updateOne(
        { _id: modelId },
        {
          $push: {
            'files.gallery': {
              originalName: file.originalname,
              filename,
              order: nextOrder,
            },
          },
        },
      )
      .exec();
  }

  async removeGalleryPhoto(
    modelId: string,
    userId: string,
    filenameToRemove: string,
  ): Promise<void> {
    const model = await this.checkAccessAndGetModel(modelId, userId);
    const currentGallery = model.files?.gallery || [];

    const targetFile = currentGallery.find(
      (f) => f.filename === filenameToRemove,
    );
    if (!targetFile) {
      throw new NotFoundException('Photo not found in this gallery');
    }

    await this.storageService.deleteFile(filenameToRemove);

    const updatedGallery = currentGallery
      .filter((f) => f.filename !== filenameToRemove)
      .sort((a, b) => a.order - b.order)
      .map((f, index) => ({ ...f, order: index + 1 }));

    await this.modelBuilder
      .updateOne(
        { _id: modelId },
        { $set: { 'files.gallery': updatedGallery } },
      )
      .exec();
  }

  // Model/files/reorder

  async reorderFiles(
    modelId: string,
    userId: string,
    target: 'models' | 'gallery',
    newOrder: number[],
  ): Promise<void> {
    const model = await this.checkAccessAndGetModel(modelId, userId);
    let items =
      target === 'models'
        ? model.files?.models || []
        : model.files?.gallery || [];

    if (items.length !== newOrder.length) {
      throw new BadRequestException(
        `Очікується масив розміром ${items.length}, отримано ${newOrder.length}`,
      );
    }

    if (items.length === 0) {
      return;
    }

    const sortedNewOrder = [...newOrder].sort((a, b) => a - b);
    for (let i = 0; i < sortedNewOrder.length; i++) {
      if (sortedNewOrder[i] !== i + 1) {
        throw new BadRequestException(
          'Неправильний формат порядку. Масив повинен містити унікальні та послідовні числа від 1 до N (наприклад, [2, 3, 1]).',
        );
      }
    }

    items = items.sort((a, b) => a.order - b.order);

    const updatedItems = items.map((item, index) => ({
      ...item,
      order: newOrder[index],
    }));

    const updateField = target === 'models' ? 'files.models' : 'files.gallery';

    await this.modelBuilder
      .updateOne({ _id: modelId }, { $set: { [updateField]: updatedItems } })
      .exec();
  }

  // Model/helpers

  private async updateCategoryRankings(
    modelId: string,
    newCategoryIds: string[],
    oldCategoryIds: string[],
  ): Promise<void> {
    const pipeline = this.redis.pipeline();

    pipeline.hset(`model:${modelId}:info`, 'categoryIds', JSON.stringify(newCategoryIds));

    if (
      newCategoryIds.length === oldCategoryIds.length &&
      newCategoryIds.every((id) => oldCategoryIds.includes(id))
    ) {
      await pipeline.exec();
      return;
    }

    const likesCount = await this.getLikesCount(modelId);

    oldCategoryIds.forEach((catId) => {
      if (!newCategoryIds.includes(catId)) {
        pipeline.zrem(`category:${catId}:likes_ranking`, modelId);
      }
    });

    newCategoryIds.forEach((catId) => {
      if (!oldCategoryIds.includes(catId)) {
        pipeline.zadd(`category:${catId}:likes_ranking`, likesCount, modelId);
      }
    });

    await pipeline.exec();
  }

  private async getLikesCount(modelId: string): Promise<number> {
    return this.redis.scard(`model:${modelId}:likes`);
  }

  private async hasUserLiked(
    modelId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await this.redis.sismember(`model:${modelId}:likes`, userId);
    return result === 1;
  }

  private async checkAccessAndGetModel(modelId: string, userId: string) {
    const model = await this.modelBuilder.findById(modelId).lean().exec();
    if (!model) {
      throw new NotFoundException(`Model with ID ${modelId} not found`);
    }
    if (model.authorId.toString() !== userId) {
      throw new ForbiddenException('You are not the author of this model');
    }
    return model;
  }

  // Models

  async getModelsCount(
    categoryId?: string,
    authorId?: string,
  ): Promise<number> {
    let rankingKey = `models:likes_ranking`;
    if (authorId) {
      rankingKey = `author:${authorId}:likes_ranking`;
    } else if (categoryId) {
      rankingKey = `category:${categoryId}:likes_ranking`;
    }

    return this.redis.zcard(rankingKey);
  }

  async getModelsSortedByLikes(
    from: number,
    to: number,
    categoryId?: string,
    authorId?: string,
  ): Promise<ModelRankingItem[]> {

    let rankingKey = `models:likes_ranking`;
    if (authorId) {
      rankingKey = `author:${authorId}:likes_ranking`;
    } else if (categoryId) {
      rankingKey = `category:${categoryId}:likes_ranking`;
    }

    const redisResult = await this.redis.zrevrange(
      rankingKey,
      from,
      to,
      'WITHSCORES',
    );

    if (redisResult.length === 0) {
      return [];
    }

    const modelsStats: { id: string; likes: number }[] = [];
    for (let i = 0; i < redisResult.length; i += 2) {
      modelsStats.push({
        id: redisResult[i],
        likes: parseInt(redisResult[i + 1], 10),
      });
    }

    const modelIds = modelsStats.map((stat) => stat.id);

    const filter = { _id: { $in: modelIds } };

    const modelsFromDb = await this.modelBuilder
      .find(filter)
      .select('title files.gallery')
      .lean()
      .exec();

    const modelsMap = new Map(
      modelsFromDb.map((model) => [model._id.toString(), model]),
    );

    return modelsStats
      .map((stat) => {
        const modelDoc = modelsMap.get(stat.id);
        if (!modelDoc) {
          return null;
        }

        let coverItem = null;
        if (modelDoc.files?.gallery && modelDoc.files.gallery.length > 0) {
          const sortedGallery = [...modelDoc.files.gallery].sort(
            (a, b) => a.order - b.order,
          );
          coverItem = sortedGallery[0];
        }

        return {
          id: stat.id,
          title: modelDoc.title,
          cover: coverItem,
          likes: stat.likes,
        };
      })
      .filter((item): item is ModelRankingItem => item !== null);
  }
}
