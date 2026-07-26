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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
const payment_dto_1 = require("./dto/payment.dto");
const webhook_process_service_1 = require("../webhooks/webhook-process.service");
const workspace_guard_1 = require("../auth/workspace.guard");
const validation_pipes_1 = require("../common/pipes/validation.pipes");
let PaymentsController = class PaymentsController {
    paymentsService;
    webhookProcessService;
    constructor(paymentsService, webhookProcessService) {
        this.paymentsService = paymentsService;
        this.webhookProcessService = webhookProcessService;
    }
    async createCheckout(req, dto) {
        return this.paymentsService.createCheckout(dto, req.user.workspaceId);
    }
    async getPaymentStatus(transactionRef) {
        return this.paymentsService.getPaymentStatus(transactionRef);
    }
    async getTransactionHistory(req, offset, limit) {
        return this.paymentsService.getTransactionHistory(req.user.workspaceId, offset ?? 0, limit ?? 50);
    }
    async getTransaction(id) {
        return this.paymentsService.getTransactionById(id);
    }
    async handleOzowWebhook(body, req) {
        return this.webhookProcessService.processPaymentWebhook(body, req.headers);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('checkout'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, payment_dto_1.CreatePaymentDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createCheckout", null);
__decorate([
    (0, common_1.Get)('status/:transactionRef'),
    __param(0, (0, common_1.Param)('transactionRef')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getPaymentStatus", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('offset')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getTransactionHistory", null);
__decorate([
    (0, common_1.Get)('transaction/:id'),
    __param(0, (0, common_1.Param)('id', validation_pipes_1.UuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getTransaction", null);
__decorate([
    (0, common_1.Post)('webhooks/ozow'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "handleOzowWebhook", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('billing/payments'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard, workspace_guard_1.WorkspaceGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.OPERATOR),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        webhook_process_service_1.WebhookProcessService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map