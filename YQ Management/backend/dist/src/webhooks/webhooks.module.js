"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksModule = void 0;
const common_1 = require("@nestjs/common");
const webhook_process_service_1 = require("./webhook-process.service");
const webhooks_controller_1 = require("./webhooks.controller");
const webhooks_service_1 = require("./webhooks.service");
const prisma_module_1 = require("../prisma/prisma.module");
const billing_module_1 = require("../billing/billing.module");
const payments_module_1 = require("../payments/payments.module");
const subscription_module_1 = require("../subscription/subscription.module");
const permissions_module_1 = require("../permissions/permissions.module");
let WebhooksModule = class WebhooksModule {
};
exports.WebhooksModule = WebhooksModule;
exports.WebhooksModule = WebhooksModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, billing_module_1.BillingModule, payments_module_1.PaymentsModule, subscription_module_1.SubscriptionModule, permissions_module_1.PermissionsModule],
        controllers: [webhooks_controller_1.WebhooksController],
        providers: [webhook_process_service_1.WebhookProcessService, webhooks_service_1.WebhooksService],
        exports: [webhook_process_service_1.WebhookProcessService, webhooks_service_1.WebhooksService],
    })
], WebhooksModule);
//# sourceMappingURL=webhooks.module.js.map