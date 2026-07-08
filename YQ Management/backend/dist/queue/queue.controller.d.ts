import { QueueService } from './queue.service';
import { QueueStatus } from '@prisma/client';
export declare class QueueController {
    private readonly queueService;
    constructor(queueService: QueueService);
    createQueue(req: any, body: {
        name: string;
    }): Promise<{
        id: string;
        name: string;
        tenantId: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        nextQueueId: string | null;
    }>;
    getQueues(req: any): Promise<({
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
    updateStatus(id: string, body: {
        status: QueueStatus;
    }): Promise<{
        id: string;
        name: string;
        tenantId: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        nextQueueId: string | null;
    }>;
}
