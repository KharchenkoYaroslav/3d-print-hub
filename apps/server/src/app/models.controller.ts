import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { ModelManagementService } from '@p3d-hub/model-management';
import { ModelRankingItemDto } from './dto/model-ranking-item.dto';

@ApiTags('Models')
@Controller('models')
export class ModelsController {
  constructor(private readonly modelManagementService: ModelManagementService) {}

  @ApiOperation({ summary: 'Отримати загальну кількість моделей (для пагінації)' })
  @ApiQuery({ name: 'categoryId', type: String, required: false, description: 'ID категорії для фільтрації' })
  @ApiQuery({ name: 'authorId', type: String, required: false, description: 'ID автора для фільтрації' })
  @ApiOkResponse({ schema: { type: 'object', properties: { count: { type: 'number' } } }, description: 'Кількість моделей' })
  @Get('count')
  @HttpCode(HttpStatus.OK)
  async getModelsCount(
    @Query('categoryId') categoryId?: string,
    @Query('authorId') authorId?: string,
  ): Promise<{ count: number }> {
    const count = await this.modelManagementService.getModelsCount(categoryId, authorId);
    return { count };
  }

  @ApiOperation({ summary: 'Отримати список моделей, відсортованих за лайками' })
  @ApiQuery({ name: 'from', type: Number, description: 'Початковий індекс' })
  @ApiQuery({ name: 'to', type: Number, description: 'Кінцевий індекс' })
  @ApiQuery({ name: 'categoryId', type: String, required: false, description: 'ID категорії для фільтрації' })
  @ApiQuery({ name: 'authorId', type: String, required: false, description: 'ID автора для фільтрації' })
  @ApiOkResponse({ type: [ModelRankingItemDto], description: 'Список моделей' })
  @Get('bylikes')
  @HttpCode(HttpStatus.OK)
  async getModelsSortedByLikes(
    @Query('from') from: number,
    @Query('to') to: number,
    @Query('categoryId') categoryId?: string,
    @Query('authorId') authorId?: string,
  ): Promise<ModelRankingItemDto[]> {
    return this.modelManagementService.getModelsSortedByLikes(from, to, categoryId, authorId);
  }
}
