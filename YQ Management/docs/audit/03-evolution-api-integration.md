# Phase 3: Evolution API & WhatsApp Integration Review

## Architecture & Correctness
**Rating: 7/10**
- The Evolution API integration is handled primarily in `whatsapp.service.ts`. The implementation correctly manages creating instances, fetching QR codes, and retrieving connection state.
- **Tenant Isolation**: Each tenant gets a unique `whatsappInstanceId` (defaulting to `tenant_{id.substring(0,8)}`).
- **Chatbot / Webhooks**: The system dynamically registers a webhook for `MESSAGES_UPSERT` events. The handler gracefully identifies the user by phone number, matches them to an active queue token, and routes commands (`STATUS`, `CANCEL`) or asks for CSAT ratings.

## Security & Reliability Risks (High Priority)
While functionally correct, there are several critical vulnerabilities and edge cases in the current implementation:

### 1. Unauthenticated Webhooks (Critical Security Risk)
- **Issue**: The Evolution API webhook handler (`/whatsapp/webhook/:instanceName`) accepts incoming POST requests without any signature verification or secret checking.
- **Exploit**: Because the `instanceName` is highly predictable (first 8 chars of a UUID), a malicious actor could send spoofed webhook payloads to this endpoint. They could remotely cancel users' queue tokens, inject false feedback, or spam the Redis Pub/Sub system by sending fake customer messages.
- **Fix**: Configure a webhook signature or secret in Evolution API and validate it in the controller.

### 2. Lack of Idempotency (Duplicate Messages)
- **Issue**: The `handleWebhook` method processes `MESSAGES_UPSERT` and immediately creates a `Message` record in the database and publishes to Redis.
- **Risk**: Webhooks often fail and retry. If Evolution API sends the same message webhook twice due to a brief network timeout, YQ Queue will record duplicate messages and potentially trigger double-actions (like recording a rating twice, which is mostly harmless, but duplicate chat messages will pollute the UI).
- **Fix**: Check `payload.data.key.id` (the unique WhatsApp message ID) against the database before processing.

### 3. Queue Position Calculation Flaw
- **Issue**: When a user replies `STATUS`, the bot calculates their position using:
  ```typescript
  count({ where: { queueId, status: 'WAITING', joinedAt: { lt: activeToken.joinedAt } } })
  ```
- **Risk**: If two users join in the exact same millisecond, they will both be told they are at the same position, or the calculation will skip one. 
- **Fix**: Position calculation should rely on a deterministic monotonic counter, or include a secondary sort/tie-breaker (like `id`).

### 4. Network Error Handling
- **Positive**: The `fetchEvo` method has excellent error classification (handling DNS failures, ECONNREFUSED, timeouts) and translates them into appropriate HTTP exceptions. This prevents the backend from crashing when Evolution API is down.
- **Edge Case**: If the QR code is generated but the frontend fails to render it (or the user closes the page), the instance stays in `connecting` state indefinitely. The service handles this by checking if it's `connecting` and explicitly re-calling `/instance/connect` to get a fresh QR code on subsequent requests.

### 5. Multi-Tenant Rate Limiting
- **Risk**: Sending WhatsApp messages via Evolution API is subject to WhatsApp's own rate limits. If one tenant spams messages (e.g., massive queue operations), the single Evolution API instance might get IP-banned or rate-limited, affecting *all* tenants on that Evolution API server.

---

## Actionable Takeaways for WhatsApp Integration
1. **Critical**: Secure the webhook endpoint immediately using a secret header.
2. **High**: Implement idempotency using the WhatsApp message ID to drop duplicate webhooks.
3. **Medium**: Refine the queue position calculation to use a strict deterministic ordering.

*End of Phase 3*
