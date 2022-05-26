import { DynamicModule, Module, Provider } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtRedisService } from './jwt-redis.service';
import {
  JwtModuleAsyncOptions,
  JwtRedisModuleOptions,
  JwtRedisOptionsFactory
} from './interfaces';
import { createJwtRedisProvider } from './jwt-redis.providers';
import { JWT_REDIS_MODULE_OPTIONS } from './jwt-redis.constants';

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
  static registerAsync(options: JwtModuleAsyncOptions): DynamicModule {
    return {
      module: JwtModule,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options)
    };
  }

  private static createAsyncProviders(
    options: JwtModuleAsyncOptions
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass
      }
    ];
  }

  private static createAsyncOptionsProvider(
    options: JwtModuleAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        provide: JWT_REDIS_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || []
      };
    }
    return {
      provide: JWT_REDIS_MODULE_OPTIONS,
      useFactory: async (optionsFactory: JwtRedisOptionsFactory) =>
        await optionsFactory.createJwtRedisOptions(),
      inject: [options.useExisting || options.useClass]
    };
  }
}
