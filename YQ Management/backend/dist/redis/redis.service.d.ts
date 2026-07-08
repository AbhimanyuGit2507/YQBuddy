import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    readonly client: Redis;
    readonly subscriber: Redis;
    constructor();
    onModuleInit(): void;
    onModuleDestroy(): void;
}
