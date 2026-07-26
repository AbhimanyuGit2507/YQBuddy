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
var AppointmentCron_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentCron = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const token_service_1 = require("./token.service");
let AppointmentCron = AppointmentCron_1 = class AppointmentCron {
    prisma;
    tokenService;
    logger = new common_1.Logger(AppointmentCron_1.name);
    constructor(prisma, tokenService) {
        this.prisma = prisma;
        this.tokenService = tokenService;
    }
    async handleAutoCheckIn() {
        const fifteenMinsFromNow = new Date(Date.now() + 15 * 60000);
        const appointmentsToAutoCheckIn = await this.prisma.token.findMany({
            where: {
                isAppointment: true,
                checkedIn: false,
                status: 'WAITING',
                scheduledFor: { lte: fifteenMinsFromNow },
                queue: {
                    requireManualCheckIn: false,
                },
            },
        });
        for (const token of appointmentsToAutoCheckIn) {
            try {
                await this.tokenService.checkIn(token.id);
                this.logger.log(`Auto-checked in appointment token: ${token.id}`);
            }
            catch (e) {
                this.logger.error(`Failed to auto-check in token: ${token.id}`, e);
            }
        }
    }
};
exports.AppointmentCron = AppointmentCron;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppointmentCron.prototype, "handleAutoCheckIn", null);
exports.AppointmentCron = AppointmentCron = AppointmentCron_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        token_service_1.TokenService])
], AppointmentCron);
//# sourceMappingURL=appointment.cron.js.map