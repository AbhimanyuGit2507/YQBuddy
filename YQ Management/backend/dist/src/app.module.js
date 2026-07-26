"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("@nestjs/bullmq");
const schedule_1 = require("@nestjs/schedule");
const throttler_1 = require("@nestjs/throttler");
const nestjs_pino_1 = require("nestjs-pino");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const workspace_module_1 = require("./workspace/workspace.module");
const prisma_module_1 = require("./prisma/prisma.module");
const workspace_context_middleware_1 = require("./workspace/middlewares/workspace-context/workspace-context.middleware");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const queue_module_1 = require("./queue/queue.module");
const token_module_1 = require("./token/token.module");
const redis_module_1 = require("./redis/redis.module");
const notifications_module_1 = require("./notifications/notifications.module");
const whatsapp_module_1 = require("./whatsapp/whatsapp.module");
const super_admin_module_1 = require("./super-admin/super-admin.module");
const email_module_1 = require("./email/email.module");
const analytics_module_1 = require("./analytics/analytics.module");
const messages_module_1 = require("./messages/messages.module");
const permissions_module_1 = require("./permissions/permissions.module");
const invitation_module_1 = require("./invitation/invitation.module");
const plans_module_1 = require("./plans/plans.module");
const subscription_module_1 = require("./subscription/subscription.module");
const invoice_module_1 = require("./invoice/invoice.module");
const usage_module_1 = require("./usage/usage.module");
const communication_module_1 = require("./communication/communication.module");
const health_module_1 = require("./health/health.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(workspace_context_middleware_1.WorkspaceContextMiddleware)
            .exclude('/health', '/auth/(.*)')
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    transport: {
                        target: 'pino-pretty',
                        options: { singleLine: true },
                    },
                },
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            bullmq_1.BullModule.forRoot({
                connection: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: Number(process.env.REDIS_PORT) || 6379,
                },
            }),
            schedule_1.ScheduleModule.forRoot(),
            workspace_module_1.WorkspaceModule,
            prisma_module_1.PrismaModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            queue_module_1.QueueModule,
            token_module_1.TokenModule,
            redis_module_1.RedisModule,
            notifications_module_1.NotificationsModule,
            whatsapp_module_1.WhatsappModule,
            super_admin_module_1.SuperAdminModule,
            email_module_1.EmailModule,
            analytics_module_1.AnalyticsModule,
            messages_module_1.MessagesModule,
            permissions_module_1.PermissionsModule,
            invitation_module_1.InvitationModule,
            plans_module_1.PlansModule,
            subscription_module_1.SubscriptionModule,
            invoice_module_1.InvoiceModule,
            usage_module_1.UsageModule,
            communication_module_1.CommunicationModule,
            health_module_1.HealthModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map