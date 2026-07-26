# Billing Architecture - Implementation Report

## Overview

This document describes the production-ready, subscription-based billing architecture implemented for the YQ Queue Management system. The architecture uses Ozow Sandbox as the current payment provider and is designed to be extensible for future providers (Stripe, PayFast, etc.) with zero code changes.

## Architecture

### Module Structure

```
backend/src/
├── billing/                     # Core billing infrastructure
│   ├── billing.module.ts        # Aggregate module
│   ├── billing.controller.ts    # Unified billing REST endpoints
│   ├── config/
│   │   └── config.service.ts    # Centralized configuration management
│   ├── errors/
│   │   └── billing-exceptions.ts # Structured exception hierarchy
│   ├── interfaces/
│   │   └── payment-provider.interface.ts # Provider abstraction
│   └── providers/
│       └── provider-registry.service.ts  # Provider registry
├── plans/                       # Plan management CRUD
│   ├── plans.module.ts
│   ├── plans.controller.ts
│   ├── plans.service.ts
│   └── dto/plan.dto.ts
├── subscription/                # Subscription lifecycle management
│   ├── subscription.module.ts
│   ├── subscription.controller.ts
│   ├── subscription.service.ts
│   └── dto/subscription.dto.ts
├── payments/                    # Payment processing (provider communication only)
│   ├── payments.module.ts
│   ├── payments.controller.ts
│   ├── payments.service.ts
│   ├── dto/payment.dto.ts
│   └── providers/
│       └── ozow.provider.ts     # Ozow provider implementation
├── webhooks/                    # Webhook handling with idempotency
│   ├── webhooks.module.ts
│   ├── webhooks.controller.ts
│   ├── webhooks.service.ts
│   ├── webhook-process.service.ts
│   └── dto/webhook.dto.ts
├── invoice/                     # Invoice module (future-ready)
│   ├── invoice.module.ts
│   └── invoice.service.ts
├── usage/                       # Usage tracking (future-ready)
│   ├── usage.module.ts
│   └── usage.service.ts
└── billing/                     # Legacy payments (deprecated, delegates to new)
```

### Design Principles

1. **Separation of Concerns**: Each module has a single responsibility.
2. **Provider Abstraction**: All payment provider logic is behind the `PaymentProvider` interface.
3. **Database-Driven Plans**: Plans are stored in the database, not hardcoded.
4. **No Business Logic in Payment Module**: The Payments module only communicates with providers.
5. **Idempotent Webhooks**: Duplicate webhooks are detected and safely ignored.
6. **Configuration Over Code**: All provider settings come from environment variables.

## Database Schema

### New Entities

| Entity | Purpose |
|--------|---------|
| `Plan` | Subscription plans with pricing, limits, features |
| `Subscription` | Workspace subscription with lifecycle status |
| `PaymentProvider` | Payment provider configuration |
| `PaymentMethod` | Future payment method storage |
| `Invoice` | Future invoice generation |
| `WebhookEvent` | Webhook event log with idempotency |
| `WorkspaceUsage` | Usage tracking for metered billing |
| `BillingSettings` | Per-workspace billing configuration |
| `AuditLog` | Audit trail for all billing operations |

### Key Relationships

- `Workspace` has one `Subscription` (1:1)
- `Subscription` references one `Plan` (N:1)
- `Subscription` has many `Transaction`s (1:N)
- `Workspace` has many `Transaction`s (1:N)
- `PaymentProvider` is a shared global configuration

### Subscription Lifecycle

```
TRIAL -> PENDING_PAYMENT -> ACTIVE -> PAST_DUE -> SUSPENDED -> CANCELLED
                    |                            |
                    v                            v
                  ACTIVE                        EXPIRED
```

## Payment Provider Abstraction

### Interface

```typescript
interface PaymentProvider {
  readonly providerName: PaymentProviderName;
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult>;
  verifyWebhook(input: VerifyWebhookInput): Promise<VerifyWebhookResult>;
  validateSignature(payload: object, signature: string, secret: string): Promise<boolean>;
  refund(input: RefundInput): Promise<RefundResult>;
  cancelSubscription(input: CancelSubscriptionInput): Promise<CancelSubscriptionResult>;
  getTransaction(input: GetTransactionInput): Promise<GetTransactionResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;
}
```

### OzowProvider

The `OzowProvider` implements the `PaymentProvider` interface using Ozow Sandbox. All configuration is read from environment variables:

- `OZOW_SITE_CODE` - Ozow site code
- `OZOW_PRIVATE_KEY` - API private key for signature generation
- `OZOW_API_KEY` - API key
- `OZOW_SANDBOX` - Toggle between sandbox and live mode
- `OZOW_BASE_URL` - Provider base URL
- `OZOW_WEBHOOK_SECRET` - Webhook signature verification secret

### Switching to Live

To switch Ozow from Sandbox to Live:
1. Set `OZOW_SANDBOX=false` in environment variables
2. Update `OZOW_SITE_CODE`, `OZOW_PRIVATE_KEY`, `OZOW_API_KEY` with live credentials
3. Update `OZOW_BASE_URL` to `https://pay.ozow.com`
4. No code changes required

### Adding a New Provider

To add a new provider (e.g., Stripe):
1. Create a new class implementing `PaymentProvider`
2. Register it in the `ProviderRegistry` service
3. Add configuration environment variables
4. No changes to billing services are needed

## Webhook Handling

### Verification Flow

1. Receive webhook payload and headers
2. Check idempotency key - if already processed, return 200
3. Store webhook event in database with `PENDING` status
4. Verify Ozow signature using SHA512 hash
5. Validate payload fields (amount, currency, workspace, subscription, transaction, payment reference)
6. Process the event (update transaction, subscription, workspace status)
7. Update webhook event with processing result
8. Return HTTP 200

### Idempotency

Each webhook event is tracked by:
- `providerEventId` (unique per provider)
- `idempotencyKey` (constructed from provider event ID)
- `processingStatus` (PENDING, PROCESSING, SUCCESS, FAILED, SKIPPED_DUPLICATE)

Duplicate webhooks are detected by `idempotencyKey` and return HTTP 200 without re-processing.

## API Endpoints

### Plans

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/billing/plans` | List all plans |
| GET | `/billing/plans/:id` | Get plan details |
| POST | `/billing/plans` | Create plan (ADMIN) |
| PUT | `/billing/plans/:id` | Update plan (ADMIN) |
| PATCH | `/billing/plans/:id/status` | Change plan status (ADMIN) |
| POST | `/billing/plans/:id/duplicate` | Duplicate plan (ADMIN) |
| DELETE | `/billing/plans/:id` | Archive plan (ADMIN) |

### Subscriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/billing/subscriptions/current` | Get current subscription |
| POST | `/billing/subscriptions` | Create subscription (ADMIN) |
| POST | `/billing/subscriptions/trial` | Start free trial (ADMIN) |
| PUT | `/billing/subscriptions/upgrade` | Upgrade plan (ADMIN) |
| PUT | `/billing/subscriptions/downgrade` | Downgrade plan (ADMIN) |
| POST | `/billing/subscriptions/cancel` | Cancel subscription (ADMIN) |
| POST | `/billing/subscriptions/resume` | Resume subscription (ADMIN) |
| GET | `/billing/subscriptions/history` | Get subscription history |
| POST | `/billing/subscriptions/renew` | Renew subscription (ADMIN) |
| POST | `/billing/subscriptions/expire-trial` | Force expire trial (ADMIN) |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/billing/payments/checkout` | Create checkout session |
| GET | `/billing/payments/status/:ref` | Get payment status |
| GET | `/billing/payments/history` | Get transaction history |
| GET | `/billing/payments/transaction/:id` | Get transaction details |

### Workspace Billing

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/billing/workspace` | Get full billing dashboard |
| GET | `/billing/workspace/usage` | Get usage metrics |

### Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/billing/invoices` | List invoices |
| POST | `/billing/invoices/generate` | Generate invoice (ADMIN) |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/billing/webhooks/ozow` | Ozow webhook receiver |
| GET | `/webhooks/events` | List webhook events |
| GET | `/webhooks/events/:id` | Get webhook event details |

## Configuration

All payment configuration is managed through environment variables:

```env
# Ozow Payments
OZOW_SITE_CODE="MOCK_SITE_CODE"
OZOW_PRIVATE_KEY="000c8b4cbe3243b5a61017b6fad446ea"
OZOW_API_KEY="dcc66709b7654b6bbcbefa638e1f4bd1"
OZOW_SANDBOX="true"
OZOW_BASE_URL="https://sandbox.ozow.com"
OZOW_WEBHOOK_SECRET=""
BACKEND_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3001"
```

The `ConfigService` reads all these values and provides them to services. Switching between Sandbox and Live requires only changing environment variables.

## Email Notifications

The `BillingEmailService` provides transactional emails for all billing events:
- Verify email before first purchase
- Welcome after successful payment
- Payment successful
- Payment failed
- Trial ending (N days before)
- Subscription renewed
- Subscription cancelled
- Subscription expired
- Payment reminder

All templates are provider-independent (Brevo-based but easily swappable).

## Security

- JWT authentication on all billing endpoints
- Role-based access control (ADMIN/OPERATOR)
- Webhook signature verification
- Request validation via class-validator DTOs
- Rate limiting via ThrottlerModule (100 requests per 60 seconds)
- Audit logging for all billing operations
- Idempotent webhook processing prevents replay attacks

## Error Handling

Structured exception hierarchy:
- `BillingException` - Base billing exception
- `PaymentFailedException` - Payment processing failures
- `SubscriptionException` - Subscription lifecycle errors
- `PlanException` - Plan management errors
- `WebhookVerificationException` - Webhook signature validation failures
- `DuplicateWebhookException` - Idempotent duplicate detection (returns 200)
- `InsufficientPermissionsException` - RBAC violations
- `RateLimitException` - Throttling violations
- `InvalidTransactionException` - Transaction validation errors

All errors are logged, never silently swallowed, and return structured error responses.

## Extension Points

### Adding a New Provider

1. Implement the `PaymentProvider` interface
2. Register in `ProviderRegistry`
3. Add environment variables
4. Done - no billing service changes needed

### Adding Metered Billing

1. Populate `WorkspaceUsage` records via usage tracking
2. Add usage-based pricing logic in `PlansService`
3. Update `BillingSettings` for dunning configuration
4. Usage data is already collected; limits enforcement can be added later

### Adding Invoice Generation

The `InvoiceService` is already prepared. It generates invoices linked to transactions and subscriptions. The `Invoice` entity is in the database schema. To enable:
1. Set invoice status to `SENT` after generation
2. Connect to email service for delivery
3. Add PDF generation (provider-independent template)

### Migrating from Ozow to Stripe

1. Create `StripeProvider` implementing `PaymentProvider`
2. Register in `ProviderRegistry`
3. Configure Stripe credentials via environment variables
4. Update per-workspace `PaymentProvider` preference if needed
5. All billing logic remains unchanged

## Testing

Unit tests cover:
- Plan CRUD operations (create, list, update, archive, duplicate)
- Subscription lifecycle (create, upgrade, downgrade, cancel, resume, trial, renew)
- Payment checkout creation
- Payment status retrieval
- Transaction history
- Webhook idempotency (duplicate detection)
- Webhook processing (success, failure, cancelled)
- Missing transaction reference handling

## Migration from Old Architecture

The old `PaymentsService` and `PaymentsController` are preserved for backward compatibility but delegate to the new provider-based architecture. The new `BillingController` provides a clean REST API that replaces the old endpoints:

Old: `GET /payments/generate-link` -> New: `POST /billing/payments/checkout`
Old: `POST /payments/webhook` -> New: `POST /billing/webhooks/ozow`

The database migration (`20260724180000_billing_schema`) adds all new tables and enums, and the existing `Transaction` table is extended with new fields (`subscriptionId`, `providerTransactionId`, `internalRef`, `rawProviderResponse`, `paymentProvider`, `metadata`).

The `Workspace.subscriptionStatus` field is gradually replaced by the `Subscription` entity, which provides full lifecycle tracking.

## Steps to Switch Ozow from Sandbox to Live

1. **Update environment variables**:
   ```env
   OZOW_SANDBOX="false"
   OZOW_SITE_CODE="<live-site-code>"
   OZOW_PRIVATE_KEY="<live-private-key>"
   OZOW_API_KEY="<live-api-key>"
   OZOW_BASE_URL="https://pay.ozow.com"
   ```

2. **Restart the application** (or the `ConfigService` will read the new values on next request)

3. **Verify** the `PaymentProvider` record in the database shows `sandboxEnabled: false`

4. **Test** with a small live transaction before processing real payments

No code deployment is required. The entire system is configuration-driven.