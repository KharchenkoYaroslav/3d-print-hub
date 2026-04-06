import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ModelManagementService } from '@p3d-hub/model-management';
import { CategoryListResponseDto } from './dto/category-list-response.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly modelManagementService: ModelManagementService) {}

  @ApiOperation({ summary: 'Отримати список всіх категорій' })
  @ApiOkResponse({ type: [CategoryListResponseDto], description: 'Список категорій' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllCategories(): Promise<CategoryListResponseDto[]> {
    const categories = await this.modelManagementService.getAllCategoriesList();
    return categories.map((cat) => ({
      id: cat._id.toString(),
      title: cat.title,
      description: cat.description,
    }));
  }
}
