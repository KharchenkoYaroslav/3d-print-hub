import { ApiProperty } from '@nestjs/swagger';
import { FileItem } from '@p3d-hub/shared-types';

export class FileItemDto implements FileItem {
  @ApiProperty()
  originalName!: string;

  @ApiProperty()
  filename!: string;

  @ApiProperty()
  order!: number;
}
