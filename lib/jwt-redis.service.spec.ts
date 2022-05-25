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

const config = {
    secretOrKeyProvider: (requestType: JwtSecretRequestType) =>
        requestType === JwtSecretRequestType.SIGN ? 'sign_secret' : 'verify_secret',
    secret: 'default_secret',
    publicKey: 'public_key',
    privateKey: 'private_key'
};

describe('should use config.secretOrKeyProvider', () => {
    let jwtRedisService: JwtRedisService = null;
    // let testPayload: string = getRandomString();

    beforeAll(async () => {
        console.info(config);
        jwtRedisService = await setup(config);
    });

    it('Check jwtRedisService Obj', () => {
        expect(jwtRedisService).not.toBeNull()
    });

})
