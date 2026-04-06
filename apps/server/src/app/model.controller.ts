import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, HttpCode, HttpStatus, UseInterceptors, UploadedFile, BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { AuthGuard } from '@p3d-hub/auth';
import { ModelManagementService } from '@p3d-hub/model-management';
import { AuthRequestDto } from './dto/auth-request.dto';
import { UpdateModelParamsDto } from './dto/update-model-params.dto';

@ApiTags('Model Management')
@Controller('model')
export class ModelController {
  constructor(private readonly modelManagementService: ModelManagementService) {}

  // Basic

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отримати детальну інформацію про модель' })
  @ApiOkResponse({ description: 'Детальна інформація про модель' })
  @UseGuards(AuthGuard)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getModel(@Param('id') id: string, @Request() req: AuthRequestDto){
    return this.modelManagementService.getModelById(id, req.user.sub);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Створити нову модель' })
  @ApiBody({ schema: { type: 'object', properties: { title: { type: 'string' } } } })
  @ApiOkResponse({ description: 'Модель успішно створено' })
  @UseGuards(AuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createModel(@Body('title') title: string, @Request() req: AuthRequestDto) {
    return this.modelManagementService.createModel(req.user.sub, title);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Видалити модель' })
  @ApiOkResponse({ description: 'Модель успішно видалено' })
  @UseGuards(AuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteModel(
    @Param('id') id: string,
    @Request() req: AuthRequestDto,
  ): Promise<void> {
    await this.modelManagementService.deleteModel(id, req.user.sub);
  }

  // Likes

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Поставити або зняти лайк' })
  @ApiOkResponse({ schema: { type: 'object', properties: { liked: { type: 'boolean' } } }, description: 'Статус лайку' })
  @UseGuards(AuthGuard)
  @Post(':id/toggle-like')
  @HttpCode(HttpStatus.OK)
  async toggleLike(
    @Param('id') id: string,
    @Request() req: AuthRequestDto,
  ): Promise<{ liked: boolean }> {
    const liked = await this.modelManagementService.toggleLike(id, req.user.sub);
    return { liked };
  }

  // Text

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Оновити категорії моделі' })
  @ApiBody({ schema: { type: 'object', properties: { categoryIds: { type: 'array', items: { type: 'string' } } } } })
  @ApiOkResponse({ description: 'Категорії успішно оновлено' })
  @UseGuards(AuthGuard)
  @Patch(':id/categories')
  @HttpCode(HttpStatus.OK)
  async updateModelCategories(
    @Param('id') id: string,
    @Body('categoryIds') categoryIds: string[],
    @Request() req: AuthRequestDto,
  ): Promise<void> {
    await this.modelManagementService.updateModelCategories(id, req.user.sub, categoryIds);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Оновити параметри моделі' })
  @ApiBody({ type: UpdateModelParamsDto })
  @ApiOkResponse({ description: 'Параметри успішно оновлено' })
  @UseGuards(AuthGuard)
  @Patch(':id/params')
  @HttpCode(HttpStatus.OK)
  async updateModelParams(
    @Param('id') id: string,
    @Body() params: UpdateModelParamsDto,
    @Request() req: AuthRequestDto,
  ): Promise<void> {
    await this.modelManagementService.updateModelParams(id, req.user.sub, params);
  }

  // Files

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Додати STL файл моделі' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOkResponse({ description: 'Файл успішно додано' })
  @UseGuards(AuthGuard)
  @Post(':id/files')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async addModelFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthRequestDto,
  ): Promise<void> {
    if (!file) {
      throw new BadRequestException('Файл не завантажено');
    }
    await this.modelManagementService.addModelFile(id, req.user.sub, file);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Видалити STL файл моделі' })
  @ApiOkResponse({ description: 'Файл успішно видалено' })
  @UseGuards(AuthGuard)
  @Delete(':id/files/:filename')
  @HttpCode(HttpStatus.OK)
  async removeModelFile(
    @Param('id') id: string,
    @Param('filename') filename: string,
    @Request() req: AuthRequestDto,
  ): Promise<void> {
    await this.modelManagementService.removeModelFile(id, req.user.sub, filename);
  }

  // Gallery

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Додати фото до галереї' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOkResponse({ description: 'Фото успішно додано' })
  @UseGuards(AuthGuard)
  @Post(':id/gallery')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async addGalleryPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthRequestDto,
  ): Promise<void> {
    if (!file) {
      throw new BadRequestException('Файл не завантажено');
    }
    await this.modelManagementService.addGalleryPhoto(id, req.user.sub, file);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Видалити фото з галереї' })
  @ApiOkResponse({ description: 'Фото успішно видалено' })
  @UseGuards(AuthGuard)
  @Delete(':id/gallery/:filename')
  @HttpCode(HttpStatus.OK)
  async removeGalleryPhoto(
    @Param('id') id: string,
    @Param('filename') filename: string,
    @Request() req: AuthRequestDto,
  ): Promise<void> {
    await this.modelManagementService.removeGalleryPhoto(id, req.user.sub, filename);
  }

  // Reorder

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Змінити порядок файлів (gallery або models)' })
  @ApiBody({ schema: { type: 'object', properties: { target: { type: 'string', enum: ['models', 'gallery'] }, newOrder: { type: 'array', items: { type: 'number' } } } } })
  @ApiOkResponse({ description: 'Порядок файлів успішно змінено' })
  @UseGuards(AuthGuard)
  @Patch(':id/reorder')
  @HttpCode(HttpStatus.OK)
  async reorderFiles(
    @Param('id') id: string,
    @Body('target') target: 'models' | 'gallery',
    @Body('newOrder') newOrder: number[],
    @Request() req: AuthRequestDto,
  ): Promise<void> {
    if (!target || !['models', 'gallery'].includes(target)) {
      throw new BadRequestException("Параметр target має бути 'models' або 'gallery'");
    }
    if (!Array.isArray(newOrder) || newOrder.length === 0) {
      throw new BadRequestException('newOrder має бути непорожнім масивом чисел');
    }

    await this.modelManagementService.reorderFiles(id, req.user.sub, target, newOrder);
  }
}
