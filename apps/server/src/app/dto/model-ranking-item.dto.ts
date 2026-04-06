import { ApiProperty } from '@nestjs/swagger';
import { ModelRankingItem } from '@p3d-hub/shared-types';
import { FileItemDto } from './file-item.dto';

export class ModelRankingItemDto implements ModelRankingItem {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ type: FileItemDto, nullable: true, description: 'Перше фото з галереї як обкладинка' })
  cover!: FileItemDto | null;

  @ApiProperty()
  likes!: number;
}
