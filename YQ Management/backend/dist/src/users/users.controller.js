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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
const permissions_enum_1 = require("../permissions/permissions.enum");
const permissions_guard_1 = require("../permissions/permissions.guard");
const permissions_guard_2 = require("../permissions/permissions.guard");
const workspace_guard_1 = require("../auth/workspace.guard");
const validation_pipes_1 = require("../common/pipes/validation.pipes");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    getUsers(req) {
        return this.usersService.getUsersByWorkspace(req.user.workspaceId);
    }
    createUser(req, body) {
        return this.usersService.createUser(req.user.workspaceId, body);
    }
    deleteUser(req, id) {
        return this.usersService.deleteUser(req.user.workspaceId, id, req.user.userId);
    }
    updateUserRole(req, id, body) {
        return this.usersService.updateUserRole(req.user.workspaceId, id, body.role, req.user.userId);
    }
    toggleUserStatus(req, id) {
        return this.usersService.toggleUserStatus(req.user.workspaceId, id, req.user.userId);
    }
    transferOwnership(req, body) {
        return this.usersService.transferOwnership(req.user.workspaceId, req.user.userId, body.newAdminId);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, permissions_guard_1.RequirePermissions)(permissions_enum_1.Permission.USER_READ),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getUsers", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, permissions_guard_1.RequirePermissions)(permissions_enum_1.Permission.USER_INVITE),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "createUser", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, permissions_guard_1.RequirePermissions)(permissions_enum_1.Permission.USER_DELETE),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', validation_pipes_1.UuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deleteUser", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, permissions_guard_1.RequirePermissions)(permissions_enum_1.Permission.USER_UPDATE_ROLE),
    (0, common_1.Patch)(':id/role'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', validation_pipes_1.UuidPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateUserRole", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, permissions_guard_1.RequirePermissions)(permissions_enum_1.Permission.USER_DISABLE),
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', validation_pipes_1.UuidPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "toggleUserStatus", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, permissions_guard_1.RequirePermissions)(permissions_enum_1.Permission.WORKSPACE_TRANSFER),
    (0, common_1.Post)('transfer-ownership'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "transferOwnership", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard, permissions_guard_2.PermissionsGuard, workspace_guard_1.WorkspaceGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map