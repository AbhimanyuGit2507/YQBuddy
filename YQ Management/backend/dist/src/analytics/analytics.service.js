"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardAnalytics(workspaceId, timeframe = 'today') {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        if (timeframe === '7d') {
            startDate.setDate(startDate.getDate() - 7);
        }
        else if (timeframe === '30d') {
            startDate.setDate(startDate.getDate() - 30);
        }
        const tokens = await this.prisma.token.findMany({
            where: {
                queue: { workspaceId },
                joinedAt: { gte: startDate },
            },
            select: {
                status: true,
                joinedAt: true,
                servedAt: true,
                completedAt: true,
                rating: true,
            },
        });
        let totalServed = 0;
        let totalMissed = 0;
        let totalCompleted = 0;
        let totalWaitTimeMs = 0;
        let waitTimeCount = 0;
        let totalServiceTimeMs = 0;
        let serviceTimeCount = 0;
        let totalRating = 0;
        let ratingCount = 0;
        tokens.forEach((t) => {
            if (t.status === 'COMPLETED')
                totalCompleted++;
            if (t.status === 'MISSED')
                totalMissed++;
            if (t.servedAt) {
                totalServed++;
                totalWaitTimeMs += t.servedAt.getTime() - t.joinedAt.getTime();
                waitTimeCount++;
                if (t.completedAt) {
                    totalServiceTimeMs += t.completedAt.getTime() - t.servedAt.getTime();
                    serviceTimeCount++;
                }
            }
            if (t.rating) {
                totalRating += t.rating;
                ratingCount++;
            }
        });
        const averageWaitTimeMins = waitTimeCount > 0
            ? Math.floor(totalWaitTimeMs / waitTimeCount / 60000)
            : 0;
        const averageServiceTimeMins = serviceTimeCount > 0
            ? Math.floor(totalServiceTimeMs / serviceTimeCount / 60000)
            : 0;
        const csatScore = ratingCount > 0 ? Number((totalRating / ratingCount).toFixed(1)) : 0;
        const dropOffRate = totalCompleted + totalMissed > 0
            ? Math.round((totalMissed / (totalCompleted + totalMissed)) * 100)
            : 0;
        let chartData = [];
        if (timeframe === 'today') {
            const hourlyDataMap = new Map();
            for (let i = 8; i <= 20; i++) {
                hourlyDataMap.set(i, {
                    timeLabel: `${i}:00`,
                    volume: 0,
                    waitTimeSum: 0,
                    waitCount: 0,
                });
            }
            tokens.forEach((t) => {
                const h = t.joinedAt.getHours();
                if (hourlyDataMap.has(h)) {
                    const entry = hourlyDataMap.get(h);
                    entry.volume++;
                    if (t.servedAt) {
                        entry.waitTimeSum +=
                            (t.servedAt.getTime() - t.joinedAt.getTime()) / 60000;
                        entry.waitCount++;
                    }
                }
            });
            chartData = Array.from(hourlyDataMap.values()).map((d) => ({
                timeLabel: d.timeLabel,
                volume: d.volume,
                avgWaitTime: d.waitCount > 0 ? Math.floor(d.waitTimeSum / d.waitCount) : 0,
            }));
        }
        else {
            const dailyDataMap = new Map();
            const daysCount = timeframe === '7d' ? 7 : 30;
            for (let i = daysCount - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const key = d.toISOString().split('T')[0];
                dailyDataMap.set(key, {
                    timeLabel: key,
                    volume: 0,
                    waitTimeSum: 0,
                    waitCount: 0,
                });
            }
            tokens.forEach((t) => {
                const key = t.joinedAt.toISOString().split('T')[0];
                if (dailyDataMap.has(key)) {
                    const entry = dailyDataMap.get(key);
                    entry.volume++;
                    if (t.servedAt) {
                        entry.waitTimeSum +=
                            (t.servedAt.getTime() - t.joinedAt.getTime()) / 60000;
                        entry.waitCount++;
                    }
                }
            });
            chartData = Array.from(dailyDataMap.values()).map((d) => ({
                timeLabel: d.timeLabel,
                volume: d.volume,
                avgWaitTime: d.waitCount > 0 ? Math.floor(d.waitTimeSum / d.waitCount) : 0,
            }));
        }
        return {
            kpis: {
                totalServed,
                averageWaitTimeMins,
                averageServiceTimeMins,
                dropOffRate,
                csatScore,
            },
            chartData,
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map