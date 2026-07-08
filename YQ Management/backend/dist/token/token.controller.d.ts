import { TokenService } from './token.service';
export declare class TokenController {
    private readonly tokenService;
    constructor(tokenService: TokenService);
    joinQueue(body: {
        queueId: string;
        customerName: string;
        phone: string;
    }): Promise<{
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
    getTokenStatus(id: string): Promise<{
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
    validateToken(body: {
        tokenId: string;
    }): Promise<{
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
