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
exports.TenantContextMiddleware = void 0;
const common_1 = require("@nestjs/common");
const tenant_service_1 = require("../../tenant.service");
let TenantContextMiddleware = class TenantContextMiddleware {
    tenantService;
    constructor(tenantService) {
        this.tenantService = tenantService;
    }
    async use(req, res, next) {
        const host = req.headers.host;
        if (!host) {
            throw new common_1.BadRequestException('Host header is missing');
        }
        const manualSubdomain = req.headers['x-tenant-subdomain'];
        let subdomain = manualSubdomain;
        if (!subdomain) {
            const parts = host.split('.');
            if (parts.length > 1) {
                subdomain = parts[0];
            }
        }
        if (!subdomain) {
            throw new common_1.BadRequestException('Subdomain or x-tenant-subdomain header is required');
        }
        try {
            const tenant = await this.tenantService.getTenantBySubdomain(subdomain);
            req.tenant = tenant;
            next();
        }
        catch (err) {
            next(err);
        }
    }
};
exports.TenantContextMiddleware = TenantContextMiddleware;
exports.TenantContextMiddleware = TenantContextMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tenant_service_1.TenantService])
], TenantContextMiddleware);
//# sourceMappingURL=tenant-context.middleware.js.map