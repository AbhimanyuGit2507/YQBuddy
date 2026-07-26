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
exports.TokenController = void 0;
const common_1 = require("@nestjs/common");
const token_service_1 = require("./token.service");
const passport_1 = require("@nestjs/passport");
const client_1 = require("@prisma/client");
const permissions_enum_1 = require("../permissions/permissions.enum");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const workspace_guard_1 = require("../auth/workspace.guard");
const permissions_guard_1 = require("../permissions/permissions.guard");
const permissions_guard_2 = require("../permissions/permissions.guard");
const rate_limit_guard_1 = require("../auth/rate-limit.guard");
const validation_pipes_1 = require("../common/pipes/validation.pipes");
const token_dto_1 = require("./dto/token.dto");
let TokenController = class TokenController {
    tokenService;
    constructor(tokenService) {
        this.tokenService = tokenService;
    }
    async requestOtp(body) {
        return this.tokenService.requestOtp(body.phone);
    }
    async joinQueue(body) {
        return this.tokenService.joinQueue(body.queueId, body.customerName, body.phone, body.otp, body.formResponses, body.language, body.scheduledFor);
    }
    async getTokenStatus(id) {
        return this.tokenService.getTokenStatus(id);
    }
    async cancelToken(id) {
        return this.tokenService.cancelToken(id);
    }
    async checkInToken(id) {
        return this.tokenService.checkIn(id);
    }
    async advanceQueue(req, queueId) {
        return this.tokenService.advanceQueue(queueId);
    }
    async validateToken(req, body) {
        return this.tokenService.validateToken(body.tokenId);
    }
    async transferToken(req, id, body) {
        return this.tokenService.transferToken(id, body.nextQueueId);
    }
};
exports.TokenController = TokenController;
__decorate([
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, common_1.Post)('request-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [token_dto_1.RequestOtpDto]),
    __metadata("design:returntype", Promise)
], TokenController.prototype, "requestOtp", null);
__decorate([
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, common_1.Post)('join'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [token_dto_1.JoinQueueDto]),
    __metadata("design:returntype", Promise)
], TokenController.prototype, "joinQueue", null);
__decorate([
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, common_1.Get)(':id/status'),
    __param(0, (0, common_1.Param)('id', validation_pipes_1.UuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TokenController.prototype, "getTokenStatus", null);
__decorate([
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, common_1.Param)('id', validation_pipes_1.UuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TokenController.prototype, "cancelToken", null);
__decorate([
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, common_1.Post)(':id/checkin'),
    __param(0, (0, common_1.Param)('id', validation_pipes_1.UuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TokenController.prototype, "checkInToken", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), workspace_guard_1.WorkspaceGuard, roles_guard_1.RolesGuard, permissions_guard_2.PermissionsGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, permissions_guard_1.RequirePermissions)(permissions_enum_1.Permission.QUEUE_OPERATE),
    (0, common_1.Post)('advance/:queueId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('queueId', validation_pipes_1.UuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TokenController.prototype, "advanceQueue", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), workspace_guard_1.WorkspaceGuard, roles_guard_1.RolesGuard, permissions_guard_2.PermissionsGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, permissions_guard_1.RequirePermissions)(permissions_enum_1.Permission.QUEUE_OPERATE),
    (0, common_1.Post)('validate'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, token_dto_1.ValidateTokenDto]),
    __metadata("design:returntype", Promise)
], TokenController.prototype, "validateToken", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), workspace_guard_1.WorkspaceGuard, roles_guard_1.RolesGuard, permissions_guard_2.PermissionsGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, permissions_guard_1.RequirePermissions)(permissions_enum_1.Permission.QUEUE_OPERATE),
    (0, common_1.Post)(':id/transfer'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', validation_pipes_1.UuidPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, token_dto_1.TransferTokenDto]),
    __metadata("design:returntype", Promise)
], TokenController.prototype, "transferToken", null);
exports.TokenController = TokenController = __decorate([
    (0, common_1.Controller)('token'),
    __metadata("design:paramtypes", [token_service_1.TokenService])
], TokenController);
//# sourceMappingURL=token.controller.js.map