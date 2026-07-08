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
let TokenController = class TokenController {
    tokenService;
    constructor(tokenService) {
        this.tokenService = tokenService;
    }
    async joinQueue(body) {
        return this.tokenService.joinQueue(body.queueId, body.customerName, body.phone);
    }
    async getTokenStatus(id) {
        return this.tokenService.getTokenStatus(id);
    }
    async advanceQueue(queueId) {
        return this.tokenService.advanceQueue(queueId);
    }
    async validateToken(body) {
        return this.tokenService.validateToken(body.tokenId);
    }
};
exports.TokenController = TokenController;
__decorate([
    (0, common_1.Post)('join'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TokenController.prototype, "joinQueue", null);
__decorate([
    (0, common_1.Get)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TokenController.prototype, "getTokenStatus", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('advance/:queueId'),
    __param(0, (0, common_1.Param)('queueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TokenController.prototype, "advanceQueue", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('validate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TokenController.prototype, "validateToken", null);
exports.TokenController = TokenController = __decorate([
    (0, common_1.Controller)('token'),
    __metadata("design:paramtypes", [token_service_1.TokenService])
], TokenController);
//# sourceMappingURL=token.controller.js.map