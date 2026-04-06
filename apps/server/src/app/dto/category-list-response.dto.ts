import { ApiProperty } from '@nestjs/swagger';
import { CategoryListResponse } from '@p3d-hub/shared-types';

export class CategoryListResponseDto implements CategoryListResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;
}
