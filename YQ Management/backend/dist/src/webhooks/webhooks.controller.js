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
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const webhooks_service_1 = require("./webhooks.service");
const webhook_process_service_1 = require("./webhook-process.service");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
const workspace_guard_1 = require("../auth/workspace.guard");
const validation_pipes_1 = require("../common/pipes/validation.pipes");
let WebhooksController = class WebhooksController {
    webhooksService;
    webhookProcessService;
    constructor(webhooksService, webhookProcessService) {
        this.webhooksService = webhooksService;
        this.webhookProcessService = webhookProcessService;
    }
    async createWebhook(req, body) {
        return this.webhooksService.createWebhook(req.user.workspaceId, body.url, body.secret || null, body.events);
    }
    async getWebhooks(req) {
        return this.webhooksService.getWebhooks(req.user.workspaceId);
    }
    async deleteWebhook(id) {
        return this.webhooksService.deleteWebhook(id);
    }
    async getWebhookEvents(req, offset, limit) {
        return this.webhookProcessService.getWebhookEvents(req.user.workspaceId, offset ?? 0, limit ?? 50);
    }
    async getWebhookEvent(id) {
        return this.webhookProcessService.getWebhookEvent(id);
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "createWebhook", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "getWebhooks", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', validation_pipes_1.UuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "deleteWebhook", null);
__decorate([
    (0, common_1.Get)('events'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('offset')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "getWebhookEvents", null);
__decorate([
    (0, common_1.Get)('events/:id'),
    __param(0, (0, common_1.Param)('id', validation_pipes_1.UuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "getWebhookEvent", null);
exports.WebhooksController = WebhooksController = __decorate([
    (0, common_1.Controller)('webhooks'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard, workspace_guard_1.WorkspaceGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __metadata("design:paramtypes", [webhooks_service_1.WebhooksService,
        webhook_process_service_1.WebhookProcessService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map