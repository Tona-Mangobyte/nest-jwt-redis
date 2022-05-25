import {Inject, Injectable} from "@nestjs/common";
import {JwtService} from "@nestjs/jwt";

@Injectable()
export class JwtRedisService {

    constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}
}
