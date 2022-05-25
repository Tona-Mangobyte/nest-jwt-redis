export interface RedisOption {
    host?: string;
    port?: number;
    password?: string;
    connectionName?: string;
    db?: number;
    maxRetriesPerRequest?: number;
    multiple?: boolean;
    connectTimeout?: number;
    lazyConnect?: boolean;
    keyPrefix?: string;
}
