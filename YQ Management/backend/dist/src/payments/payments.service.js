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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const billing_config_service_1 = require("../billing/config/billing-config.service");
const provider_registry_service_1 = require("../billing/providers/provider-registry.service");
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    prisma;
    configService;
    providerRegistry;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(prisma, configService, providerRegistry) {
        this.prisma = prisma;
        this.configService = configService;
        this.providerRegistry = providerRegistry;
    }
    async createCheckout(dto, workspaceId) {
        const plan = await this.prisma.plan.findUnique({
            where: { id: dto.planId },
        });
        if (!plan) {
            throw new common_1.NotFoundException(`Plan with id ${dto.planId} not found`);
        }
        if (plan.status !== 'ACTIVE') {
            throw new common_1.BadRequestException(`Plan ${plan.name} is not active`);
        }
        const amount = dto.amount ?? plan.price;
        const currency = dto.currency || plan.currency || 'ZAR';
        const billingInterval = dto.billingInterval || plan.billingInterval || 'MONTHLY';
        if (dto.amount !== undefined && dto.amount !== plan.price) {
            throw new common_1.BadRequestException(`Amount ${dto.amount} does not match plan price ${plan.price}`);
        }
        if (dto.currency && dto.currency !== plan.currency) {
            throw new common_1.BadRequestException(`Currency ${dto.currency} does not match plan currency ${plan.currency}`);
        }
        if (dto.billingInterval && dto.billingInterval !== plan.billingInterval) {
            throw new common_1.BadRequestException(`Billing interval ${dto.billingInterval} does not match plan interval ${plan.billingInterval}`);
        }
        const provider = this.providerRegistry.getProvider(client_1.PaymentProviderName.OZOW);
        const checkoutInput = {
            workspaceId,
            subscriptionId: '',
            planId: dto.planId,
            amount,
            currency,
            billingInterval,
            returnUrl: `${this.configService.getFrontendUrl()}/dashboard/settings/billing?status=success`,
            cancelUrl: `${this.configService.getFrontendUrl()}/dashboard/settings/billing?status=cancelled`,
            notifyUrl: `${this.configService.getBackendUrl()}/billing/payments/webhooks/ozow`,
        };
        const result = await provider.createCheckout(checkoutInput);
        await this.prisma.transaction.create({
            data: {
                workspaceId,
                transactionRef: result.providerTransactionId,
                internalRef: result.paymentReference,
                amount,
                currency,
                status: client_2.TransactionStatus.PENDING,
                providerTransactionId: result.providerTransactionId,
                paymentProvider: client_1.PaymentProviderName.OZOW,
            },
        });
        return result;
    }
    async getPaymentStatus(transactionRef) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { transactionRef },
            include: { workspace: { select: { name: true } } },
        });
        if (!transaction) {
            throw new common_1.NotFoundException(`Transaction ${transactionRef} not found`);
        }
        return {
            id: transaction.id,
            transactionRef: transaction.transactionRef,
            internalRef: transaction.internalRef,
            amount: transaction.amount,
            currency: transaction.currency,
            status: transaction.status,
            paymentProvider: transaction.paymentProvider,
            providerTransactionId: transaction.providerTransactionId,
            workspaceId: transaction.workspaceId,
            workspace: transaction.workspace,
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
        };
    }
    async getTransactionHistory(workspaceId, offset = 0, limit = 50) {
        return this.prisma.transaction.findMany({
            where: { workspaceId },
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
    }
    async getTransactionById(id) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
        });
        if (!transaction) {
            throw new common_1.NotFoundException(`Transaction ${id} not found`);
        }
        return transaction;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        billing_config_service_1.BillingConfigService,
        provider_registry_service_1.ProviderRegistry])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map