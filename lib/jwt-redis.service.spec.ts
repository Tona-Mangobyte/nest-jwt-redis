import { JwtRedisModuleOptions } from './interfaces';
import { Test } from '@nestjs/testing';
import { JwtRedisModule } from './jwt-redis.module';
import { JwtRedisService } from './jwt-redis.service';
import { JwtSecretRequestType } from '@nestjs/jwt';

/*
* @see https://github.com/nestjs/jwt/blob/master/lib/jwt.service.spec.ts
* **/
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
  expiresPrefix: 'm',
  expiresTokenRefresh: 8400,
  signOptions: {
    expiresIn: '3600'
  },
  redis: {
    host: '127.0.0.1',
    port: 6379,
    password:
      'RRkMxz+1XhBzDQ4s1MTvUUVl6IY3sM8ADOoZ9AyrESP9l+WKNrCnmSemZrxWWpcOpTm1l8YXbXRMDa7F',
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
    const payload = { username: 'Admin@mb', email: 'admin@mango-byte.com' };
    const userId = '123';
    const tokenAPI = await jwtRedisService.sign(userId, payload);
    console.info(tokenAPI);
    expect(tokenAPI).not.toBeNull();
    const accessToken = tokenAPI.accessToken;
    const decode: any = await jwtRedisService.decode(accessToken);
    expect(decode).not.toBeNull();
    const userIdDecode = decode.rjwt.toString().split(':')[0];
    console.info(userIdDecode);
    expect(userIdDecode).toBe(userId);
  });
});
