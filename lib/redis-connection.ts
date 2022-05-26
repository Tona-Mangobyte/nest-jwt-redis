import Redis from 'ioredis';

export class RedisConnection {
  public static getInstance(): RedisConnection {
    if (!RedisConnection._instance) {
      RedisConnection._instance = new RedisConnection();
    }
    return RedisConnection._instance;
  }
  private static _instance: RedisConnection = null;
  private _redis: Redis.Redis = null;

  private constructor() {
    //
  }
  setRedis(redis: Redis.Redis): void {
    this._redis = redis;
  }

  getRedis(): Redis.Redis {
    return this._redis;
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

  async create(key, value, ttl: number | string = 86400): Promise<boolean> {
    try {
      await this._redis.set(key, value, 'EX', ttl);
    } catch (err) {
      throw new Error(`redis-> Error Redis ${err}`);
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
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
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
      match: `${pattern}:*`,
    });
  }

  async createHashValues(key: string, data: { [key: string]: any }): Promise<void> {
    const success = await this._redis.multi().hset(key, data).expire(key, 86400).exec();
    console.error(success);
  }
  async getHashValues(key: string, fields?: string | string[]): Promise<any> {
    let result: any = {};
    if (fields) {
      if (!Array.isArray(fields)) {
        fields = [fields];
      }
      for (const field of fields) {
        result[field] = await this._redis.hget(key, field);
      }
    } else {
      result = await this._redis.hgetall(key);
    }
    return Object.keys(result).length ? result : null;
  }
}
