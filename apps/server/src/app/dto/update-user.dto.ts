import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, IsNotEmpty } from 'class-validator';
import { UpdateUser } from '@p3d-hub/shared-types';

export class UpdateUserDto implements UpdateUser {
  @ApiProperty({ description: 'Поточний пароль для підтвердження змін' })
  @IsString()
  @IsNotEmpty({ message: 'Поточний пароль обовʼязковий для підтвердження змін' })
  currentPassword!: string;

  @ApiPropertyOptional({ description: 'Новий логін' })
  @IsString()
  @IsOptional()
  login?: string;

  @ApiPropertyOptional({ description: 'Новий пароль (мінімум 6 символів)' })
  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Новий пароль має містити мінімум 6 символів' })
  password?: string;
}
