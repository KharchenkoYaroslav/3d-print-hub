import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { UpdateModelParams } from '@p3d-hub/shared-types';

export class UpdateModelParamsDto implements UpdateModelParams {
  @ApiPropertyOptional({ description: 'Назва моделі' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Опис моделі' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Розмір моделі' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ description: 'Рекомендований матеріал' })
  @IsOptional()
  @IsString()
  recommendedMaterial?: string;

  @ApiPropertyOptional({ description: 'Орієнтовний час друку (хвилини)' })
  @IsOptional()
  @IsNumber()
  estimatedPrintTime?: number;

  @ApiPropertyOptional({ description: 'Орієнтовний обʼєм (см³)' })
  @IsOptional()
  @IsNumber()
  estimatedVolume?: number;

  @ApiPropertyOptional({ description: 'Дозволити комерційне використання' })
  @IsOptional()
  @IsBoolean()
  allowCommercialUse?: boolean;
}
