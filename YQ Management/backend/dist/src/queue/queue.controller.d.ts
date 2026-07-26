import { QueueService } from './queue.service';
import { QueueStatus } from '@prisma/client';
export declare class QueueController {
    private readonly queueService;
    constructor(queueService: QueueService);
    createQueue(req: any, body: {
        name: string;
        formConfig?: any;
    }): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        nextQueueId: string | null;
        formConfig: import("@prisma/client/runtime/client").JsonValue | null;
        allowAppointments: boolean;
        requireManualCheckIn: boolean;
        appointmentGranularityMins: number;
        workspaceId: string;
    }>;
    getQueues(req: any): Promise<({
        _count: {
            tokens: number;
        };
    } & {
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        nextQueueId: string | null;
        formConfig: import("@prisma/client/runtime/client").JsonValue | null;
        allowAppointments: boolean;
        requireManualCheckIn: boolean;
        appointmentGranularityMins: number;
        workspaceId: string;
    })[]>;
    getHistory(req: any): Promise<({
        queue: {
            id: string;
            name: string;
            status: import("@prisma/client").$Enums.QueueStatus;
            nextQueueId: string | null;
            formConfig: import("@prisma/client/runtime/client").JsonValue | null;
            allowAppointments: boolean;
            requireManualCheckIn: boolean;
            appointmentGranularityMins: number;
            workspaceId: string;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.TokenStatus;
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
        language: string;
        servedAt: Date | null;
        completedAt: Date | null;
    })[]>;
    getQueue(id: string): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        nextQueueId: string | null;
        formConfig: import("@prisma/client/runtime/client").JsonValue | null;
        allowAppointments: boolean;
        requireManualCheckIn: boolean;
        appointmentGranularityMins: number;
        workspaceId: string;
    } | null>;
    updateQueue(id: string, body: {
        name?: string;
        formConfig?: any;
        nextQueueId?: string | null;
        allowAppointments?: boolean;
        requireManualCheckIn?: boolean;
        appointmentGranularityMins?: number;
    }): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        nextQueueId: string | null;
        formConfig: import("@prisma/client/runtime/client").JsonValue | null;
        allowAppointments: boolean;
        requireManualCheckIn: boolean;
        appointmentGranularityMins: number;
        workspaceId: string;
    }>;
    getQueueTokens(id: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.TokenStatus;
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
        language: string;
        servedAt: Date | null;
        completedAt: Date | null;
    }[]>;
    updateStatus(id: string, body: {
        status: QueueStatus;
    }): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        nextQueueId: string | null;
        formConfig: import("@prisma/client/runtime/client").JsonValue | null;
        allowAppointments: boolean;
        requireManualCheckIn: boolean;
        appointmentGranularityMins: number;
        workspaceId: string;
    }>;
}
