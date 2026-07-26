import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboardAnalytics(req: any, timeframe: string): Promise<{
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
