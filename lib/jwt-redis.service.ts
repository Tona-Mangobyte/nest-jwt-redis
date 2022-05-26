import {Inject, Injectable, Logger} from "@nestjs/common";
import {JwtSecretRequestType, JwtService, JwtSignOptions, JwtVerifyOptions} from "@nestjs/jwt";
import {JwtRedisModuleOptions} from "./interfaces";
import * as jwt from 'jsonwebtoken';
import {JWT_REDIS_MODULE_OPTIONS} from "./jwt-redis.constants";
import {RedisConnection} from "./redis-connection";
import {RedisProvider} from "./redis-provider";
import * as uuid from 'uuid';

@Injectable()
export class JwtRedisService {
    private readonly _logger = new Logger('JwtRedisService');
    private readonly _driver: RedisProvider = null;
    constructor(@Inject(JwtService) private readonly jwtService: JwtService,
                @Inject(JWT_REDIS_MODULE_OPTIONS)
                private readonly _options: JwtRedisModuleOptions) {
        if (this._options.driver === 'redis') {
            this._driver = new RedisProvider(this._options.redis);
            RedisConnection.getInstance().setRedis(this._driver.exec());
        }
    }

    async sign(id: any, options: any, config?: JwtSignOptions): Promise<any> {
        const configOption = config ? config : this._options.signOptions
        const signOptions = this.mergeJwtOptions({ ...configOption }, 'signOptions') as jwt.SignOptions;
        const secret = this.getSecretKey(options, configOption, 'privateKey', JwtSecretRequestType.SIGN);

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
                    dataSession: options.dataSession,
                });
            }
        }

        // Sign Jwt
        let accessToken = null;
        let refreshToken = null;
        const expiresTokenRefresh = 1296000; // 15d <=> ( 60 * 60 * 24 * 15 )/minutes
        try {
            accessToken = jwt.sign(payload, secret, { ...signOptions, expiresIn: `${signOptions.expiresIn}m` });
            refreshToken = jwt.sign(payload, secret, { expiresIn: `${expiresTokenRefresh}m` });
        } catch (err) {
            throw new Error(`redis-jwt->  Error creating token ${err}`);
        }

        // Stringify info session
        const data = JSON.stringify(session);

        // Set in Redis
        if (this._driver) {
            await this._driver.create(key, data, signOptions.expiresIn);
        }
        const expiresIn = parseInt(String(signOptions.expiresIn), 10);
        return { accessToken, refreshToken, expiresIn, expiresTokenRefresh };
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
