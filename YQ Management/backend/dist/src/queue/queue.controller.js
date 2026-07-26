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
exports.QueueController = void 0;
const common_1 = require("@nestjs/common");
const queue_service_1 = require("./queue.service");
const passport_1 = require("@nestjs/passport");
const client_1 = require("@prisma/client");
const permissions_enum_1 = require("../permissions/permissions.enum");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const permissions_guard_1 = require("../permissions/permissions.guard");
const permissions_guard_2 = require("../permissions/permissions.guard");
const workspace_guard_1 = require("../auth/workspace.guard");
const validation_pipes_1 = require("../common/pipes/validation.pipes");
let QueueController = class QueueController {
    queueService;
    constructor(queueService) {
        this.queueService = queueService;
    }
    async createQueue(req, body) {
        return this.queueService.createQueue(req.user.workspaceId, body.name, body.formConfig);
    }
    async getQueues(req) {
        return this.queueService.getQueuesForTenant(req.user.workspaceId);
    }
    async getHistory(req) {
        return this.queueService.getHistory(req.user.workspaceId);
    }
    async getQueue(id) {
        return this.queueService.getQueueById(id);
    }
    async updateQueue(id, body) {
        return this.queueService.updateQueue(id, body);
    }
    async getQueueTokens(id) {
        return this.queueService.getQueueTokens(id);
    }
    async updateStatus(id, body) {
        return this.queueService.updateQueueStatus(id, body.status);
    }
};
exports.QueueController = QueueController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, permissions_guard_1.RequirePermissions)(permissions_enum_1.Permission.QUEUE_CREATE),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "createQueue", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard, permissions_guard_2.PermissionsGuard),
    (0, permissions_guard_1.RequirePermissions)(permissions_enum_1.Permission.QUEUE_READ),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "getQueues", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard, permissions_guard_2.PermissionsGuard),
    (0, permissions_guard_1.RequirePermissions)(permissions_enum_1.Permission.QUEUE_READ),
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', validation_pipes_1.UuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "getQueue", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, permissions_guard_1.RequirePermissions)(permissions_enum_1.Permission.QUEUE_UPDATE),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', validation_pipes_1.UuidPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "updateQueue", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard, permissions_guard_2.PermissionsGuard),
    (0, permissions_guard_1.RequirePermissions)(permissions_enum_1.Permission.QUEUE_READ),
    (0, common_1.Get)(':id/tokens'),
    __param(0, (0, common_1.Param)('id', validation_pipes_1.UuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "getQueueTokens", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, permissions_guard_1.RequirePermissions)(permissions_enum_1.Permission.QUEUE_OPERATE),
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id', validation_pipes_1.UuidPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "updateStatus", null);
exports.QueueController = QueueController = __decorate([
    (0, common_1.Controller)('queue'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), workspace_guard_1.WorkspaceGuard),
    __metadata("design:paramtypes", [queue_service_1.QueueService])
], QueueController);
//# sourceMappingURL=queue.controller.js.map