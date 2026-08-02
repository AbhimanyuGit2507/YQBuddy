# Phase 2: Backend Core & Authentication Review

## Core Configuration & Architecture
**Rating: 8/10**
- **Framework & Libraries**: NestJS is used effectively. Global pipes (`ValidationPipe`), global filters (`AllExceptionsFilter`), Helmet, and `cookie-parser` are correctly initialized in `main.ts`.
- **Logging**: `nestjs-pino` is configured for high-performance structured logging.
- **Rate Limiting**: `ThrottlerModule` is globally configured (100 requests / 60 seconds). This is a solid baseline for DDoS protection.
- **CORS**: Correctly configured to use `process.env.FRONTEND_URL` and allow credentials (for cookies).

## Multi-Tenancy Middleware
**Rating: 7/10**
- `TenantContextMiddleware` intercepts requests and extracts the subdomain from the `Host` header or `x-tenant-subdomain`. It attaches the `Tenant` entity to the request.
- **Positive**: Seamless tenant resolution for API calls.
- **Negative / Edge Case**: It silently ignores missing subdomains (`next()`). While intentional for admin/global routes, if a tenant-specific endpoint forgets to validate the presence of `req.tenant`, it could throw null reference errors or operate globally.

## Authentication & Authorization
**Rating: 6.5/10**

### Authentication Flow
- Supports OTP (Email) and Google OAuth (`google.strategy.ts`).
- Uses HTTP-Only cookies OR Bearer tokens (via `ExtractJwt.fromExtractors`), which provides good flexibility for both web clients and potential mobile apps.
- **Auto-Provisioning**: In `auth.service.ts`, if an unknown user logs in via OAuth or registers, a new `Tenant` and `Workspace` ("My Company") are automatically created, and the user is assigned `TENANT_ADMIN`.
  - **Risk**: If a user meant to join an existing company but used an unregistered email, they are instantly provisioned a new company instead of being denied access. This is standard PLG (Product-Led Growth) behavior but can lead to "ghost tenants" in the database.

### Authorization (Guards & Roles)
- **Roles Guard**: `roles.guard.ts` checks if `user.role` matches the `@Roles()` decorator.
- **Workspace Guard**: `workspace.guard.ts` simply checks if `user.workspaceId` exists.
- **Critical Security Gap**: The `RolesGuard` only verifies the *claim* (e.g., "I am a TENANT_ADMIN"). It **does not** verify boundaries. If a controller endpoint looks like `PATCH /queues/:id`, the `RolesGuard` allows the request. Unless the controller explicitly verifies `queue.tenantId === user.tenantId`, a `TENANT_ADMIN` from Tenant A could modify a Queue in Tenant B (Insecure Direct Object Reference - IDOR). The codebase relies entirely on the controllers/services to enforce tenant isolation.

### Session Management
- Sessions are completely stateless (JWT based).
- **Missing**: There is no mechanism to invalidate a JWT before it expires (e.g., no Redis token blocklist). If a user is removed from a workspace or changes roles, their existing JWT remains valid with the old claims until expiration.
- **Missing**: No explicit "Refresh Token" mechanism is visible in the standard `jwt.strategy.ts` setup.

---

## Actionable Takeaways for Backend Core
1. **Security (IDOR)**: Enforce a global `TenantAccessGuard` that asserts `user.tenantId === req.tenant.id` for all tenant-specific routes.
2. **Session Security**: Implement a JWT blocklist in Redis for immediate session revocation upon logout, role change, or workspace removal.
3. **Ghost Tenants**: Implement a cron job to clean up unused "My Company" tenants that were created by accidental logins.

*End of Phase 2*
