import * as jwt from 'jsonwebtoken';

export interface RedisOption {
  host: string;
  port: number;
  password?: string;
  connectionName?: string;
  db?: number;
  maxRetriesPerRequest?: number;
  multiple?: boolean;
  connectTimeout?: number;
  lazyConnect?: boolean;
  keyPrefix?: string;
}

export interface IJwtSignOptions extends jwt.SignOptions {
  secret?: string | Buffer;
}

export interface IJwtVerifyOptions extends jwt.VerifyOptions {
  secret?: string | Buffer;
}
