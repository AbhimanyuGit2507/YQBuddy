import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { QueueStatus } from '@prisma/client';
import { QueueGateway } from './queue.gateway';
export declare class QueueService {
    private readonly prisma;
    private readonly redisService;
    private readonly queueGateway;
    constructor(prisma: PrismaService, redisService: RedisService, queueGateway: QueueGateway);
    createQueue(tenantId: string, name: string): Promise<{
        id: string;
        name: string;
        tenantId: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        nextQueueId: string | null;
    }>;
    getQueuesForTenant(tenantId: string): Promise<({
        _count: {
            tokens: number;
        };
    } & {
        id: string;
        name: string;
        tenantId: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        nextQueueId: string | null;
    })[]>;
    updateQueueStatus(queueId: string, status: QueueStatus): Promise<{
        id: string;
        name: string;
        tenantId: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        nextQueueId: string | null;
    }>;
    joinQueue(queueId: string, customerName: string, phone: string, isAppointment?: boolean): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.TokenStatus;
        customerName: string;
        phone: string;
        joinedAt: Date;
        isAppointment: boolean;
        scheduledFor: Date | null;
        rating: number | null;
        feedbackText: string | null;
        queueId: string;
    }>;
    getEstimatedWaitTime(queueId: string, tokenId: string): Promise<number>;
    advanceTurn(queueId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.TokenStatus;
        customerName: string;
        phone: string;
        joinedAt: Date;
        isAppointment: boolean;
        scheduledFor: Date | null;
        rating: number | null;
        feedbackText: string | null;
        queueId: string;
    } | null>;
    completeToken(tokenId: string): Promise<boolean>;
    skipToken(tokenId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.TokenStatus;
        customerName: string;
        phone: string;
        joinedAt: Date;
        isAppointment: boolean;
        scheduledFor: Date | null;
        rating: number | null;
        feedbackText: string | null;
        queueId: string;
    }>;
}
