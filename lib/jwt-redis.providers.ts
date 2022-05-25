import { JwtRedisModuleOptions } from './interfaces/jwt-redis-module-options.interface';
import { JWT_REDIS_MODULE_OPTIONS } from './jwt-redis.constants';

export function createJwtRedisProvider(options: JwtRedisModuleOptions): any[] {
    return [{ provide: JWT_REDIS_MODULE_OPTIONS, useValue: options || {} }];
}
