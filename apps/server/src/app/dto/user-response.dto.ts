import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { UserProfile } from '@p3d-hub/shared-types';
import { User } from '@p3d-hub/user';

@Exclude()
export class UserResponseDto implements UserProfile {
  @ApiProperty({ description: 'Логін користувача' })
  @Expose()
  login!: string;

  @ApiProperty({ description: 'Дата створення акаунту' })
  @Expose()
  createdAt!: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
