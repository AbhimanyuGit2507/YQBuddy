import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
export declare class TokenService {
    private readonly prisma;
    private readonly redisService;
    constructor(prisma: PrismaService, redisService: RedisService);
    joinQueue(queueId: string, customerName: string, phone: string): Promise<{
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
    advanceQueue(queueId: string): Promise<{
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
    getTokenStatus(tokenId: string): Promise<{
        token: {
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
        };
        position: number;
        estimatedWaitTime: number;
    }>;
    validateToken(tokenId: string): Promise<{
        valid: boolean;
        reason: string;
        status?: undefined;
    } | {
        valid: boolean;
        status: string;
        reason?: undefined;
    } | {
        valid: boolean;
        status: string;
        reason: string;
    }>;
}
