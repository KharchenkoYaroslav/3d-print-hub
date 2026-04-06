import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { RefreshTokenGuard } from './refresh.guard';
import { UsersModule } from '@p3d-hub/user';

@Module({
  imports: [UsersModule, JwtModule.register({})],
  providers: [AuthService, AuthGuard, RefreshTokenGuard],
  exports: [AuthService, AuthGuard, RefreshTokenGuard, JwtModule],
})
export class AuthModule {}
