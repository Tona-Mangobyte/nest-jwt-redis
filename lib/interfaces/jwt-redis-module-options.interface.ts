import { JwtModuleOptions } from '@nestjs/jwt'
import { ModuleMetadata, Type } from '@nestjs/common';
import { RedisOption } from "./redis-option.interface";

export interface JwtRedisModuleOptions extends JwtModuleOptions {
    driver?: string;
    redis?: RedisOption;
}

export interface JwtRedisOptionsFactory {
    createJwtRedisOptions(): Promise<JwtRedisModuleOptions> | JwtRedisModuleOptions;
}

export interface JwtModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useExisting?: Type<JwtRedisOptionsFactory>;
    useClass?: Type<JwtRedisOptionsFactory>;
    useFactory?: (...args: any[]) => Promise<JwtRedisModuleOptions> | JwtRedisModuleOptions;
    inject?: any[];
}
