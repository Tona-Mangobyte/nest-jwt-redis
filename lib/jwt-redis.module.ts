import { DynamicModule, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtRedisService } from './jwt-redis.service';
import { JwtRedisModuleOptions } from './interfaces';
import { createJwtRedisProvider } from './jwt-redis.providers';

@Module({
  imports: [JwtModule.register({ secret: 'hard!to-guess_secret' })],
  providers: [JwtRedisService],
  exports: [JwtRedisService]
})
export class JwtRedisModule {
  static register(options: JwtRedisModuleOptions): DynamicModule {
    return {
      module: JwtRedisModule,
      providers: createJwtRedisProvider(options)
    };
  }
}
