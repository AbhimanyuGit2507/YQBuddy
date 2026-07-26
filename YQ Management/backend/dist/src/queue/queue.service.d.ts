import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { QueueStatus } from '@prisma/client';
import { QueueGateway } from './queue.gateway';
import { WebhooksService } from '../webhooks/webhooks.service';
export declare class QueueService {
    private readonly prisma;
    private readonly redisService;
    private readonly queueGateway;
    private readonly webhooksService;
    constructor(prisma: PrismaService, redisService: RedisService, queueGateway: QueueGateway, webhooksService: WebhooksService);
    createQueue(workspaceId: string, name: string, formConfig?: any): Promise<{
        name: string;
        id: string;
        workspaceId: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        nextQueueId: string | null;
        formConfig: import("@prisma/client/runtime/client").JsonValue | null;
        allowAppointments: boolean;
        requireManualCheckIn: boolean;
        appointmentGranularityMins: number;
    }>;
    updateQueue(queueId: string, data: {
        name?: string;
        formConfig?: any;
        nextQueueId?: string | null;
        allowAppointments?: boolean;
        requireManualCheckIn?: boolean;
        appointmentGranularityMins?: number;
    }): Promise<{
        name: string;
        id: string;
        workspaceId: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        nextQueueId: string | null;
        formConfig: import("@prisma/client/runtime/client").JsonValue | null;
        allowAppointments: boolean;
        requireManualCheckIn: boolean;
        appointmentGranularityMins: number;
    }>;
    getQueuesForTenant(workspaceId: string): Promise<({
        _count: {
            tokens: number;
        };
    } & {
        name: string;
        id: string;
        workspaceId: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        nextQueueId: string | null;
        formConfig: import("@prisma/client/runtime/client").JsonValue | null;
        allowAppointments: boolean;
        requireManualCheckIn: boolean;
        appointmentGranularityMins: number;
    })[]>;
    getQueueById(id: string): Promise<{
        name: string;
        id: string;
        workspaceId: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        nextQueueId: string | null;
        formConfig: import("@prisma/client/runtime/client").JsonValue | null;
        allowAppointments: boolean;
        requireManualCheckIn: boolean;
        appointmentGranularityMins: number;
    } | null>;
    getQueueTokens(queueId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.TokenStatus;
        language: string;
        queueId: string;
        customerName: string;
        phone: string | null;
        joinedAt: Date;
        isAppointment: boolean;
        scheduledFor: Date | null;
        checkedIn: boolean;
        rating: number | null;
        feedbackText: string | null;
        formResponses: import("@prisma/client/runtime/client").JsonValue | null;
        purpose: string | null;
        servedAt: Date | null;
        completedAt: Date | null;
    }[]>;
    getHistory(workspaceId: string): Promise<({
        queue: {
            name: string;
            id: string;
            workspaceId: string;
            status: import("@prisma/client").$Enums.QueueStatus;
            nextQueueId: string | null;
            formConfig: import("@prisma/client/runtime/client").JsonValue | null;
            allowAppointments: boolean;
            requireManualCheckIn: boolean;
            appointmentGranularityMins: number;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.TokenStatus;
        language: string;
        queueId: string;
        customerName: string;
        phone: string | null;
        joinedAt: Date;
        isAppointment: boolean;
        scheduledFor: Date | null;
        checkedIn: boolean;
        rating: number | null;
        feedbackText: string | null;
        formResponses: import("@prisma/client/runtime/client").JsonValue | null;
        purpose: string | null;
        servedAt: Date | null;
        completedAt: Date | null;
    })[]>;
    updateQueueStatus(queueId: string, status: QueueStatus): Promise<{
        name: string;
        id: string;
        workspaceId: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        nextQueueId: string | null;
        formConfig: import("@prisma/client/runtime/client").JsonValue | null;
        allowAppointments: boolean;
        requireManualCheckIn: boolean;
        appointmentGranularityMins: number;
    }>;
    joinQueue(queueId: string, customerName: string, phone: string | null, isAppointment?: boolean): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.TokenStatus;
        language: string;
        queueId: string;
        customerName: string;
        phone: string | null;
        joinedAt: Date;
        isAppointment: boolean;
        scheduledFor: Date | null;
        checkedIn: boolean;
        rating: number | null;
        feedbackText: string | null;
        formResponses: import("@prisma/client/runtime/client").JsonValue | null;
        purpose: string | null;
        servedAt: Date | null;
        completedAt: Date | null;
    }>;
    getEstimatedWaitTime(queueId: string, tokenId: string): Promise<number>;
    advanceTurn(queueId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.TokenStatus;
        language: string;
        queueId: string;
        customerName: string;
        phone: string | null;
        joinedAt: Date;
        isAppointment: boolean;
        scheduledFor: Date | null;
        checkedIn: boolean;
        rating: number | null;
        feedbackText: string | null;
        formResponses: import("@prisma/client/runtime/client").JsonValue | null;
        purpose: string | null;
        servedAt: Date | null;
        completedAt: Date | null;
    } | null>;
    completeToken(tokenId: string): Promise<boolean>;
    skipToken(tokenId: string): Promise<{
        queue: {
            name: string;
            id: string;
            workspaceId: string;
            status: import("@prisma/client").$Enums.QueueStatus;
            nextQueueId: string | null;
            formConfig: import("@prisma/client/runtime/client").JsonValue | null;
            allowAppointments: boolean;
            requireManualCheckIn: boolean;
            appointmentGranularityMins: number;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.TokenStatus;
        language: string;
        queueId: string;
        customerName: string;
        phone: string | null;
        joinedAt: Date;
        isAppointment: boolean;
        scheduledFor: Date | null;
        checkedIn: boolean;
        rating: number | null;
        feedbackText: string | null;
        formResponses: import("@prisma/client/runtime/client").JsonValue | null;
        purpose: string | null;
        servedAt: Date | null;
        completedAt: Date | null;
    }>;
}
