# Phase 1: Architecture & Database Review

## Overall Architecture Overview
YQ Queue is structured as a modern Monorepo-style application separating concerns into a `frontend` and `backend` directory.

- **Frontend**: Next.js (React), likely App Router (or Pages based on `pages/` dir), utilizing Tailwind CSS and TanStack Query.
- **Backend**: NestJS framework using Prisma ORM against a PostgreSQL database. It integrates Redis (via `ioredis` and `BullMQ`) for queues, and Socket.IO for real-time web socket events. 
- **Package Manager**: npm/yarn workspaces or independent packages.

### Backend Folder Structure Rating: 8/10
The `backend/src` directory is highly modular, following NestJS best practices. Features are split into dedicated domains: `auth`, `tenant`, `workspace`, `queue`, `token`, `whatsapp`, `webhooks`, `billing`, `subscription`.
- **Pros**: Clear separation of domains. Dedicated directories for `health`, `audit`, `redis`, `prisma`, `common`.
- **Cons**: High number of modules at the root of `src/`. Grouping them under overarching domain folders (e.g., `src/modules/`) could improve scannability.

---

## Database Review (`schema.prisma`)

### 1. Multi-Tenant Architecture
The application uses a **Shared Database, Shared Schema** approach. Row-level tenant isolation is achieved via `tenantId` and `workspaceId` foreign keys on most tables.

**Tenant vs. Workspace Ambiguity**
There appears to be an architectural tension between `Tenant` and `Workspace`:
- Both have `subscriptionStatus`.
- Both have `subdomain` fields (with `@unique`).
- Most entities (User, Queue, Transaction) relate to both `tenantId` and `workspaceId` (optional).
- `Tenant` seems to act as an organizational level (handling the WhatsApp connection), while `Workspace` acts as a sub-organization (handling billing/subscriptions).
- **Risk**: Without strict application-level enforcement, queries might accidentally cross workspace boundaries if only `tenantId` is checked.

### 2. Indexes & Performance
**Rating: 7/10**
Most critical foreign keys and query patterns are indexed:
- `Queue` is indexed by `tenantId`.
- `Token` has compound indexes on `[queueId, status]` and `[queueId, joinedAt]` which are excellent for queue operations (fetching next in line, counting waiting users).
- `WebhookEvent` has indexes on `tenantId`, `eventType`, `workspaceId`, `transactionId`.
- **Missing Indexes**: 
  - `User.tenantId` and `User.workspaceId` are NOT indexed. Fetching all users for a tenant will require a full table scan.
  - `Token.status` alone is not indexed, but `[queueId, status]` exists (which is fine if queries always filter by `queueId`).

### 3. Scalability
**Rating: 8/10**
- PostgreSQL with UUID primary keys (`@default(uuid())`) is highly scalable and prevents ID guessing.
- `WorkspaceUsage` utilizes `@unique([workspaceId, periodStart, periodEnd])`, which prevents duplicate billing metric entries.
- The use of `Json?` fields (`formConfig`, `personalSettings`, `formResponses`) allows flexible schemaless data without requiring constant migrations for new features.

### 4. Data Integrity & Constraints
**Rating: 6/10**
- **Cascade Deletes**: Prisma defaults to restrict/set-null for relations unless specified. Since no `@relation(..., onDelete: Cascade)` rules are defined, deleting a `Workspace`, `Queue`, or `Tenant` will likely throw a constraint violation if child records exist. This means hard deletes are essentially broken unless performed manually in a specific order.
- **Nullable Fields**: `workspaceId` is optional on `Queue`, `User`, etc. This means there is a "Default Workspace" concept implicitly attached to the `Tenant`.

### 5. Potential Bugs & Edge Cases
- **Duplicate Subdomains**: `Tenant.subdomain` and `Workspace.subdomain` are both `@unique`. If the routing layer dynamically looks up a subdomain, there could be a collision between a Tenant subdomain and a Workspace subdomain.
- **`Token.scheduledFor` vs `joinedAt`**: Hybrid appointments rely on `Token.isAppointment`. If a user joins the queue physically, it relies on `joinedAt`. The sorting logic for "who is next" needs to handle mixing scheduled and walk-in tokens carefully.
- **Orphaned Tokens**: If a `Queue` is deleted, its `Token`s will either block the deletion or become orphaned (depending on Prisma's DB-level behavior without cascades).

---

## Actionable Takeaways for Database
1. **Security/Isolation**: Ensure every repository query forces `where: { tenantId, workspaceId }` to prevent tenant bleed.
2. **Performance**: Add `@@index([tenantId])` and `@@index([workspaceId])` to the `User` model.
3. **Architecture**: Document the exact hierarchy and lifecycle difference between a `Tenant` and a `Workspace`. 

*End of Phase 1*
