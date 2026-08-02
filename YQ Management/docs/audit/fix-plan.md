# YQ Queue Implementation & Fix Plan

This document serves as the master checklist to resolve all issues identified during the comprehensive engineering audit. 
You can use this file across different sessions to track progress.

When a task is finished, change `[ ]` to `[x] completed`.

---

## 🔴 CRITICAL PRIORITY (Fix Immediately)

- [x] completed **Unsecured Evolution API Webhooks**
  - Add authentication to the Evolution API webhook handler (`whatsapp.controller.ts` / `whatsapp.service.ts`).
  - Configure Evolution API to send a secret header or verify the payload signature.
  - Reject unauthorized POST requests.

- [x] completed **Redis Split Brain (Queue State)**
  - Consolidate queue state management in `queue.service.ts` and `token.service.ts`.
  - Remove all usage of Redis Lists (`queue:{id}:tokens`) for positioning.
  - Refactor all queue logic (join, advance, cancel, status) to exclusively use Redis Sorted Sets (ZSETs - `queue:{id}:waiting`).

- [x] completed **Frontend WebSocket Polling (DDOS Fix)**
  - Remove `refetchInterval: 3000` from `frontend/src/pages/customer/status/[tokenId].tsx`.
  - Install and implement `socket.io-client` on the frontend.
  - Listen to `queue_status_changed`, `token_joined`, `QUEUE_ADVANCED`, and `TOKEN_CANCELLED` events via WebSocket to update state seamlessly.

- [x] completed **Token Generation Race Condition**
  - Refactor `joinQueue` logic for sequential tokens (`CC1`, `CC2`).
  - Stop fetching `tokenDisplayConfig` from Prisma, incrementing in memory, and saving.
  - Use Redis `INCR` (e.g., `INCR queue:{id}:sequence`) to guarantee atomic token numbers, then sync to Prisma asynchronously.

---

## 🟠 HIGH PRIORITY (Security & Reliability)

- [x] completed **Tenant IDOR**: Ensure `req.user.tenantId` is consistently used as a hard filter on all relevant DB queries (Tokens, Queues, Workspaces) instead of just checking if the Queue belongs to the Tenant.
- [x] completed **Webhook Idempotency**: 
  - For WhatsApp: Extract the unique message ID from `MESSAGES_UPSERT`. Check if it exists in the database before processing to prevent duplicate messages.
  - For Payments: Ensure Ozow webhooks strictly check transaction state before applying billing upgrades twice.

- [x] completed **Ghost Tenants & OAuth Auto-Provisioning**
  - Update `auth.service.ts` Google OAuth logic.
  - If an unknown email logs in, prevent automatic creation of a "My Company" tenant.
  - Redirect them to an onboarding/registration flow or reject access if they weren't invited.

---

## 🟡 MEDIUM PRIORITY (Technical Debt & Scalability)

- [x] completed **Database Indexes**
  - Add `@@index([tenantId])` and `@@index([workspaceId])` to the `User` model in `schema.prisma`.
  - Run Prisma migration (`npx prisma migrate dev`).

- [x] completed **Session Invalidation (JWT Blocklist)**
  - Implement a Redis token blocklist in `jwt.strategy.ts`.
  - When a user logs out, is removed from a workspace, or has their role changed, add their JWT `jti` or `sub` to the blocklist.

- [x] completed **Database Cascades**
  - Add `onDelete: Cascade` to relationships in `schema.prisma` (e.g., `Queue -> Token`, `Tenant -> Workspace`).
  - Ensure deleting a Queue cleanly deletes its Tokens without throwing foreign key constraint errors.

- [x] completed **Estimated Wait Time Outliers**
  - In `queue.service.ts` and `token.service.ts`, add a threshold (e.g., 60 minutes) to the `avg_time` EMA calculation.
  - Ignore any service time that exceeds this threshold to prevent skewed ETAs.

---

## 🔵 LOW PRIORITY

### 5. Deployment / Config Fixes
- [x] completed **Frontend PWA Setup**: Move `next-pwa` config properly inside `next.config.js` or `next.config.ts`, and define a proper `manifest.json` with generic icons to ensure the "Add to Homescreen" prompt works reliably for the SaaS.digital token.

- [x] completed **Skeleton Loaders**
  - Replace the CSS spinners (`animate-pulse` dots/circles) in `dashboard/index.tsx` and `[tokenId].tsx` with proper UI Skeleton components for a smoother perceived load time.

---

*Generated from Comprehensive Engineering Audit.*
