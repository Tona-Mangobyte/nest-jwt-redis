import {JwtRedisModuleOptions} from "./interfaces";
import {Test} from "@nestjs/testing";
import {JwtRedisModule} from "./jwt-redis.module";
import {JwtRedisService} from "./jwt-redis.service";
import {JwtSecretRequestType} from "@nestjs/jwt";

const setup = async (config: JwtRedisModuleOptions) => {
    const module = await Test.createTestingModule({
        imports: [JwtRedisModule.register(config)]
    }).compile();

    return module.get<JwtRedisService>(JwtRedisService);
};

const config: JwtRedisModuleOptions = {
    secretOrKeyProvider: (requestType: JwtSecretRequestType) =>
        requestType === JwtSecretRequestType.SIGN ? 'sign_secret' : 'verify_secret',
    secret: 'default_secret',
    publicKey: 'public_key',
    privateKey: 'private_key',
    signOptions: {
        expiresIn: '3600'
    },
    driver: 'redis',
    redis: {
        host: '127.0.0.1',
        port: 6379,
        password: 'RRkMxz+1XhBzDQ4s1MTvUUVl6IY3sM8ADOoZ9AyrESP9l+WKNrCnmSemZrxWWpcOpTm1l8YXbXRMDa7F',
        keyPrefix: 'testing_'
    }
};

describe('should use config.secretOrKeyProvider', () => {
    let jwtRedisService: JwtRedisService = null;
    // let testPayload: string = getRandomString();

    beforeAll(async () => {
        console.info(config);
        jwtRedisService = await setup(config);
    });

    it('Generate Token', async () => {
        const payload = { username: 'Admin@mb', email: 'admin@mango-byte.com'};
        const token = await jwtRedisService.sign('123', payload);
        console.info(token);
        expect(token).not.toBeNull();
    });

})
