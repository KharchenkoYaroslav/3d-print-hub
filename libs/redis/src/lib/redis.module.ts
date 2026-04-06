import { Module } from '@nestjs/common';
import { RedisModule as NestJSRedisModule } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    NestJSRedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'single', 
        url: configService.getOrThrow<string>('REDIS_URI'),
      }),
    }),
  ],
  exports: [NestJSRedisModule],
})
export class RedisModule {}
