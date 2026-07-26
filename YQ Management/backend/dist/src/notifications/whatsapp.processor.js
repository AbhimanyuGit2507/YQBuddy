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
var WhatsappProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const notifications_service_1 = require("./notifications.service");
const common_1 = require("@nestjs/common");
let WhatsappProcessor = WhatsappProcessor_1 = class WhatsappProcessor extends bullmq_1.WorkerHost {
    notificationsService;
    logger = new common_1.Logger(WhatsappProcessor_1.name);
    constructor(notificationsService) {
        super();
        this.notificationsService = notificationsService;
    }
    async process(job) {
        this.logger.log(`Processing whatsapp job ${job.id}`);
        await this.notificationsService.executeWhatsAppMessage(job);
    }
};
exports.WhatsappProcessor = WhatsappProcessor;
exports.WhatsappProcessor = WhatsappProcessor = WhatsappProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('whatsapp'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], WhatsappProcessor);
//# sourceMappingURL=whatsapp.processor.js.map