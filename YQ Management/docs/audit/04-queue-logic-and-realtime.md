# Phase 4: Queue Logic & Realtime Systems Review

## Core Queue Architecture
**Rating: 4/10** (Due to critical state inconsistencies)
The queue system attempts to be highly performant by mirroring PostgreSQL state into Redis. It uses Redis Lists, Sorted Sets (ZSETs), and Pub/Sub for real-time orchestration.

### Critical Architecture Flaw (Redis State Split Brain)
There is a massive inconsistency in how the Redis queue structures are manipulated between `QueueService` and `TokenService`. 

1. **Adding to Queue**:
   - `QueueService.joinQueue` adds the token **only** to the ZSET (`queue:{id}:waiting`).
   - `TokenService.joinQueue` adds the token to **both** the List (`queue:{id}:tokens`) and the ZSET (`queue:{id}:waiting`).

2. **Advancing the Queue**:
   - `QueueService.advanceTurn` uses `ZPOPMIN` to pop from the **ZSET**.
   - `TokenService.advanceQueue` uses `LPOP` to pop from the **List**.

3. **Checking Queue Position**:
   - `TokenService.getTokenStatus` calculates the customer's position by looking at their index in the **List** (`lrange`).

**The Bug**: If an administrator advances the queue using the endpoint that hits `QueueService.advanceTurn`, the token is removed from the ZSET but remains in the List. Because `getTokenStatus` uses the List to calculate position, **every waiting customer's position will freeze and never update**. The List will grow infinitely, causing memory leaks and completely broken estimated wait times.

**Fix Required**: The system must pick **one** data structure for the queue order. A ZSET (Sorted Set) is far superior because it allows deterministic ordering by timestamp and supports easy removals if a customer cancels their turn (`ZREM`).

### Estimated Wait Time (EWT) Logic
**Rating: 7.5/10**
- EWT is calculated dynamically using an Exponential Moving Average of the last 10 completed tokens.
- `queue.service.ts` updates a global `avg_time` per queue.
- `token.service.ts` maintains a specialized `avg_time` per *purpose* (if the queue uses dynamic form fields like "Reason for visit").
- **Edge Case**: If a token is "Skipped/Missed", it is not factored into the EMA, which is correct. However, if an operator forgets to complete a token and completes it 5 hours later, the average service time will spike drastically, breaking EWTs for everyone. There should be an upper bound / outlier rejection for service times.

### QR & Token Generation
- Display IDs can be sequential (`CC1, CC2`) or random.
- **Race Condition**: In `sequential` mode, both `QueueService` and `TokenService` read the `tokenDisplayConfig`, increment `counter`, and update the DB. This is **not atomic**. If 50 people scan the QR code at the exact same millisecond, they will all receive the same sequence number.
- **Fix**: Sequence generation should be offloaded to Redis `INCR` or a PostgreSQL sequence/atomic update.

### Realtime Pub/Sub
- Events (`TOKEN_JOINED`, `QUEUE_ADVANCED`, `TOKEN_CANCELLED`) are broadcast via Redis Pub/Sub (`queue_events` channel).
- Socket.IO gateway (`QueueGateway`) likely listens to this channel and pushes to clients. This architecture scales perfectly horizontally across multiple Node instances.

---

## Actionable Takeaways for Queue Logic
1. **Critical Refactor**: Consolidate Redis queue storage. Remove the `queue:{id}:tokens` List entirely and strictly use `queue:{id}:waiting` (ZSET) for positioning, adding, popping, and removing.
2. **Critical Race Condition**: Use Redis `INCR` for sequential token generation (`CC1, CC2, etc.`) instead of fetching and saving JSON config in Prisma.
3. **Reliability**: Add outlier rejection to the EWT calculation (e.g., ignore service times > 60 minutes) to prevent operators ruining the average.

*End of Phase 4*
