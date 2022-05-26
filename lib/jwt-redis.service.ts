import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  JwtSecretRequestType,
  JwtService,
  JwtSignOptions,
  JwtVerifyOptions
} from '@nestjs/jwt';
import { IJwtVerifyOptions, JwtRedisModuleOptions } from './interfaces';
import * as jwt from 'jsonwebtoken';
import { JWT_REDIS_MODULE_OPTIONS } from './jwt-redis.constants';
import { RedisConnection } from './redis-connection';
import { RedisProvider } from './redis-provider';
import * as uuid from 'uuid';

@Injectable()
export class JwtRedisService {
  private readonly _logger = new Logger('JwtRedisService');
  private readonly _redisProvider: RedisProvider = null;
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(JWT_REDIS_MODULE_OPTIONS)
    private readonly _options: JwtRedisModuleOptions
  ) {
    this._options.expiresTokenRefresh = this._options.expiresTokenRefresh
      ? this._options.expiresTokenRefresh
      : 1296000;
    this._options.expiresPrefix = this._options.expiresPrefix
      ? this._options.expiresPrefix
      : 'm';
    this._redisProvider = new RedisProvider(this._options.redis);
    RedisConnection.getInstance().setRedis(this._redisProvider.exec());
  }

  async sign(id: any, options: any, config?: JwtSignOptions): Promise<any> {
    const configOption = config ? config : this._options.signOptions;
    const signOptions = this.mergeJwtOptions(
      { ...configOption },
      'signOptions'
    ) as jwt.SignOptions;
    const secret = this.getSecretKey(
      options,
      configOption,
      'privateKey',
      JwtSecretRequestType.SIGN
    );

    const key = `${id}:${uuid.v1()}`;
    const payload = { rjwt: key };
    const session = { rjwt: key };

    if (options) {
      if (options.dataToken) {
        Object.assign(payload, { dataToken: options.dataToken });
      }

      // If have data save in redis
      if (options.dataSession) {
        Object.assign(session, {
          dataSession: options.dataSession
        });
      }
    }

    // Sign Jwt
    let accessToken = null;
    let refreshToken = null;
    const expiresTokenRefresh = this._options.expiresTokenRefresh; // 15d <=> ( 60 * 60 * 24 * 15 )/minutes
    try {
      accessToken = jwt.sign(payload, secret, {
        ...signOptions,
        expiresIn: `${signOptions.expiresIn}${this._options.expiresPrefix}`
      });
      refreshToken = jwt.sign(payload, secret, {
        expiresIn: `${expiresTokenRefresh}${this._options.expiresPrefix}`
      });
    } catch (err) {
      throw new Error(`redis-jwt->  Error creating token ${err}`);
    }

    // Stringify info session
    const data = JSON.stringify(session);

    // Set in Redis
    await this._redisProvider.create(
      key,
      data,
      `${signOptions.expiresIn}${this._options.expiresPrefix}`
    );
    const expiresIn = parseInt(String(signOptions.expiresIn), 10);
    return { accessToken, refreshToken, expiresIn, expiresTokenRefresh };
  }

  async verify<T extends Record<any, any> = any>(
    token: string,
    valueSession?: boolean,
    options?: IJwtVerifyOptions
  ): Promise<any> {
    const configOption = options ? options : this._options.verifyOptions;
    const verifyOptions = this.mergeJwtOptions(
      { ...configOption },
      'verifyOptions'
    );
    const secret = this.getSecretKey(
      token,
      configOption,
      'publicKey',
      JwtSecretRequestType.VERIFY
    );

    const decode = jwt.verify(token, secret, verifyOptions) as T;
    return this.validatePayload(decode, valueSession);
  }

  decode(
    token: string,
    options?: jwt.DecodeOptions
  ): null | { [key: string]: any } | string {
    return jwt.decode(token, options);
  }

  async validatePayload(decode, valueSession?: boolean): Promise<any> {
    if (!decode) {
      return false;
    }
    // get current TTL
    // const ttl = await this._driver.ttl(key);
    // get Id
    const id = decode.rjwt.split(':')[0];

    // Merge
    Object.assign(decode, { id });

    if (!this._redisProvider) {
      return decode;
    }
    // get key in redis
    const key = decode.rjwt;

    // Verify if exits key in redis
    if (!(await this._redisProvider.exists(key))) {
      return false;
    }

    // if full get value from redis
    if (valueSession) {
      const value = JSON.parse(
        <string>await this._redisProvider.getValueByKey(key)
      );
      if (value.dataSession) {
        Object.assign(decode, { dataSession: value.dataSession });
      }
    }

    return decode;
  }

  private mergeJwtOptions(
    options: JwtVerifyOptions | JwtSignOptions,
    key: 'verifyOptions' | 'signOptions'
  ): jwt.VerifyOptions | jwt.SignOptions {
    delete options.secret;
    if (key === 'signOptions') {
      delete (options as JwtSignOptions).privateKey;
    } else {
      delete (options as JwtVerifyOptions).publicKey;
    }
    return options
      ? {
          ...(this._options[key] || {}),
          ...options
        }
      : this._options[key];
  }

  private getSecretKey(
    token: string | object | Buffer,
    options: JwtVerifyOptions | JwtSignOptions,
    key: 'publicKey' | 'privateKey',
    secretRequestType: JwtSecretRequestType
  ): string | Buffer | jwt.Secret {
    let secret = this._options.secretOrKeyProvider
      ? this._options.secretOrKeyProvider(secretRequestType, token, options)
      : options?.secret ||
        this._options.secret ||
        (key === 'privateKey'
          ? (options as JwtSignOptions)?.privateKey || this._options.privateKey
          : (options as JwtVerifyOptions)?.publicKey ||
            this._options.publicKey) ||
        this._options[key];

    if (this._options.secretOrPrivateKey) {
      this._logger.warn(
        `"secretOrPrivateKey" has been deprecated, please use the new explicit "secret" or use "secretOrKeyProvider" or "privateKey"/"publicKey" exclusively.`
      );
      secret = this._options.secretOrPrivateKey;
    }
    return secret;
  }
}
