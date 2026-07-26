import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboardAnalytics(workspaceId: string, timeframe?: string): Promise<{
        kpis: {
            totalServed: number;
            averageWaitTimeMins: number;
            averageServiceTimeMins: number;
            dropOffRate: number;
            csatScore: number;
        };
        chartData: {
            timeLabel: string;
            volume: number;
            avgWaitTime: number;
        }[];
    }>;
}
