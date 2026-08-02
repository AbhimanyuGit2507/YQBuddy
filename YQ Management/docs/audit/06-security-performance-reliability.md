# Phase 6: Security, Performance & Reliability Review

This phase consolidates the overarching security vulnerabilities, performance bottlenecks, and reliability risks identified across the codebase.

## 1. Security Audit
**Rating: 4/10**

### IDOR (Insecure Direct Object Reference)
- **Vulnerability**: The backend relies on a `@Roles()` guard to check if a user is an `ADMIN` or `TENANT_ADMIN`. However, it does not explicitly enforce that the resource being modified belongs to the user's `tenantId` at the framework level (e.g., via a `TenantAccessGuard`). 
- **Impact**: If a controller endpoint fetches or updates a `Queue` by ID and forgets to include `where: { tenantId }`, an Admin from Company A could modify Company B's queues.

### Unauthenticated Webhooks
- **Vulnerability**: The Evolution API webhook endpoint does not verify any signatures or secrets.
- **Impact**: Malicious actors can spoof WhatsApp messages or cancel customers' tokens by sending arbitrary POST requests to the easily guessable instance webhook URL.

### Ghost Tenants & Auto-Provisioning
- **Vulnerability**: Any OAuth login automatically provisions a new `Tenant` and `Workspace` if the email is not found.
- **Impact**: Database pollution and potential billing tracking issues if users accidentally use the wrong email.

## 2. Performance Audit
**Rating: 5/10**

### Frontend Polling DDOS
- **Bottleneck**: `customer/status/[tokenId].tsx` uses `react-query` to poll the backend every 3 seconds (`refetchInterval: 3000`). 
- **Impact**: 1,000 waiting customers = 333 requests per second to the Node.js backend just to check status.
- **Solution**: The backend already has Socket.IO (`QueueGateway`) configured. The frontend must be updated to use WebSocket listeners for state changes.

### Database Indexing
- **Bottleneck**: The `User` model lacks indexes on `tenantId` and `workspaceId`.
- **Impact**: Fetching staff members for a workspace requires a full table scan, which will degrade performance as the user base grows.
- **Solution**: Add `@@index([tenantId])` and `@@index([workspaceId])` to the `User` model.

### Redis Network Overhead
- **Bottleneck**: Operations like `joinQueue` or `advanceQueue` execute 4-5 sequential Redis commands (`set`, `zadd`, `rpush`, `publish`).
- **Impact**: Increases latency due to multiple network round trips to Redis.
- **Solution**: Use Redis Pipelines or Lua scripts for atomic, single-round-trip operations.

## 3. Reliability & Edge Cases
**Rating: 4/10**

### Redis Split Brain
- **Risk**: The queue uses two separate Redis structures (a List and a Sorted Set) simultaneously but updates them inconsistently depending on which service method is called.
- **Impact**: Queue positions will freeze, and customers will not be dequeued properly if the wrong endpoint is used.

### Idempotency
- **Risk**: Webhook handlers for both Payments (Ozow) and Evolution API lack strict idempotency guarantees (checking the unique message/event ID before processing).
- **Impact**: Network retries will cause duplicate chat messages or duplicate billing state transitions.

### Race Conditions
- **Risk**: Sequential token generation (`CC1`, `CC2`) fetches the current counter from Prisma, increments it in memory, and saves it. 
- **Impact**: Simultaneous QR scans will result in duplicate token numbers being issued to different customers.
- **Solution**: Use PostgreSQL `SEQUENCE` or atomic Redis `INCR`.

---
*End of Phase 6*
