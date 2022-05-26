// import { AppLogger } from '@libs/core';
import * as Redis from 'ioredis';
import * as timespan from 'jsonwebtoken/lib/timespan';

import { RedisOption } from './interfaces';

export class RedisProvider {
  // private _logger = new AppLogger('RedisJWT Driver');
  private readonly _config: RedisOption = {
    host: '127.0.0.1',
    port: 6379,
    password: '',
    connectionName: 'redis-jwt',
    db: 0,
    maxRetriesPerRequest: 10,
    connectTimeout: 10000,
    multiple: true,
    keyPrefix: ''
  };
  private readonly _redis = null;

  constructor(config) {
    this._config = { ...this._config, ...config };
    this._redis = new Redis(this._config);
  }

  exec() {
    return this._redis;
  }

  on(event, cb) {
    return this._redis.on(event, cb);
  }

  async ping() {
    /*
            return new Promise((resolve) => {
                this._redis.rawCall(['ping'], (err, result) => {
                    if (result) {
                        resolve(result);
                    }
                    resolve(null);
                });
            });
             */
  }

  async create(key, value, ttl: any) {
    try {
      const id = key.split(':')[0];
      if (!this._config.multiple) {
        await this.destroyMultiple(id);
      }
      if (ttl) {
        await this._redis.set(key, value, 'EX', timespan(ttl));
      } else {
        await this._redis.set(key, value);
      }
    } catch (err) {
      throw new Error(`redis-jwt-> Error Redis ${err}`);
    }
    return true;
  }

  async exists(key) {
    return this.getValueByKey(key);
  }

  async getValueByKey(key) {
    return new Promise((resolve) => {
      this._redis.get(key, (err, result) => {
        if (result) {
          resolve(result);
        }
        resolve(null);
      });
    });
  }

  async getValuesByPattern(pattern) {
    return new Promise((resolve) => {
      this._scan(pattern)
        .on('data', function (results) {
          resolve(results);
        })
        .on('error', () => {
          resolve(null);
        });
    });
  }

  async getCountByPattern(pattern) {
    return new Promise((resolve) => {
      this._scan(pattern)
        .on('data', (keys) => resolve(keys.length))
        .on('error', () => {
          resolve(null);
        });
    });
  }

  async destroy(key) {
    return new Promise((resolve) => {
      this._redis.del(key, (err, result) => {
        if (result) {
          resolve(result);
        }
        resolve(null);
      });
    });
  }

  async destroyMultiple(pattern) {
    return new Promise<void>((resolve) => {
      this._scan(pattern)
        .on('data', (keys) => {
          if (keys.length) {
            const pipeline = this._redis.pipeline();
            keys.forEach(function (key) {
              pipeline.del(key);
            });
            pipeline.exec();
          }
        })
        .on('end', () => {
          resolve();
        })
        .on('error', () => {
          resolve();
        });
    });
  }

  private _scan(pattern): any {
    return this._redis.scanStream({
      match: `${pattern}:*`
    });
  }
}
