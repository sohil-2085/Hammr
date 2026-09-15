# Hammr — System Architecture

This file ties together everything decided in `03-tech-stack.md` and `04-deployment-and-deliverables.md` into one consolidated architecture reference.

---

## 1. High-Level Diagram (Text Form)

```
┌─────────────────────────────┐
│         BROWSER              │
│  (Buyer / Seller / Admin)    │
└───────────────┬──────────────┘
                │  HTTPS (REST) + WSS (Socket.IO)
                ▼
┌─────────────────────────────┐
│   FRONTEND — Next.js (TS)    │
│   Hosted on: VERCEL          │
│   - Pages / UI components    │
│   - No backend/business logic│
│   - Calls backend via REST   │
│   - Socket.IO client         │
└───────────────┬──────────────┘
                │  REST API calls (Bearer JWT)
                │  Socket.IO connection (auth: token)
                ▼
┌─────────────────────────────────────────┐
│   BACKEND — Node.js + TypeScript          │
│   Hosted on: RENDER                       │
│   Framework: Express / Fastify            │
│   - REST API (auth, listings, bids, etc.) │
│   - Socket.IO server (real-time events)   │
│   - Auction scheduler (BullMQ jobs)        │
│   - All business logic + validation        │
└──────────┬───────────────────┬────────────┘
           │                   │
           ▼                   ▼
┌────────────────────┐  ┌──────────────────────┐
│   PostgreSQL         │  │   Redis                │
│   (via Prisma ORM)   │  │   - Caching             │
│   Source of truth:    │  │   - Socket.IO adapter   │
│   users, listings,     │  │   - BullMQ job queue    │
│   bids, transactions   │  │                          │
└────────────────────┘  └──────────────────────┘
```

---

## 2. Two Codebases, Two Deployments

| | Frontend | Backend |
|---|---|---|
| **Tech** | Next.js + TypeScript | Node.js + TypeScript (Express/Fastify) |
| **Hosting** | Vercel | Render |
| **Contains** | Pages, components, UI state, API calls, Socket.IO client | REST API, all business logic, Socket.IO server, Prisma/PostgreSQL, scheduled jobs |
| **Does NOT contain** | Any backend/business logic, no API routes for auth/bids/etc. | Any UI/rendering code |

Full reasoning for this split is in `03-tech-stack.md`.

---

## 3. Request Flow Examples

### A. Buyer places a bid
1. Buyer clicks "Place Bid" in the Next.js UI.
2. Frontend sends a `POST /bids` REST request to the Render backend, with a `Bearer <JWT>` header.
3. Backend verifies the JWT (authentication) and checks the user has the `buyer` role (authorization).
4. Backend opens a **database transaction**, locks the auction row (`SELECT ... FOR UPDATE`), validates the bid beats the current highest bid by the minimum increment, and — if valid — writes the new bid and updates the auction's current highest bid, all atomically.
5. Backend emits a Socket.IO event (e.g., `bid:new`) to everyone watching that auction, and a separate `bid:outbid` event to the buyer who was just outbid.
6. Frontend receives the event via its Socket.IO client and updates the UI in real time — no manual refresh needed.

### B. Auction auto-starts / auto-closes
1. A BullMQ job (backed by Redis), scheduled when the listing was created, fires at the auction's start time and end time.
2. The job updates the auction's status (`Scheduled → Live`, or `Live → Closed`) in PostgreSQL.
3. On close: the backend checks whether the reserve price was met, determines the winner (or `Unsold`), and starts the payment-window countdown for the winning buyer.
4. Backend emits Socket.IO events (e.g., `auction:closed`, `auction:started`) to update any connected clients watching that listing.

### C. Payment window expires without payment
1. A BullMQ job scheduled at "payment window opened" time fires when that window ends.
2. Backend checks whether payment was completed (test-mode). If not, it marks the current winner as failed-to-pay, and re-runs the settlement logic against the next-highest bidder, giving them a **new** payment window (see `04-auction-rules.md`, Section 6).
3. Relevant notifications are sent (e.g., "You're now the winning bidder — you have X minutes to pay").

---

## 4. Authentication Flow (Cross-Domain: Vercel ↔ Render)

Since frontend and backend live on different domains, **JWT-based auth** is used instead of cookies (see `03-tech-stack.md`):

1. User logs in via a REST call to the backend (`POST /auth/login`).
2. Backend verifies credentials (and, for sellers, the 2FA code from their authenticator app) and returns a signed JWT (access token, optionally + refresh token).
3. Frontend stores the token and attaches it as `Authorization: Bearer <token>` on all subsequent REST calls.
4. The same token is passed during the **Socket.IO handshake** (`io(url, { auth: { token } })`) so the backend can authenticate and authorize real-time connections too, not just REST calls.
5. Backend middleware verifies the token and role on every protected REST route and on Socket.IO connection.

---

## 5. Real-Time Layer (Socket.IO)

- Runs **inside the same Node.js/Express backend process** on Render — not a separate service.
- Uses the **Redis adapter** (`@socket.io/redis-adapter`) so events broadcast correctly even if the backend ever scales to multiple instances.
- Key events to design for for the MVP:
  - `bid:new` — a new highest bid was placed on an auction (broadcast to everyone watching)
  - `bid:outbid` — sent specifically to the buyer who was just outbid
  - `auction:extended` — an auction's end time was pushed back due to a late bid
  - `auction:started` / `auction:closed` — status transitions
  - `payment:window_opened` — a buyer's payment countdown has started

---

## 6. Data Layer

- **PostgreSQL** is the single source of truth for all persistent data: users, listings, bids (immutable), transactions/settlements, ratings, watchlists.
- **Prisma** is the ORM layer the backend uses to talk to PostgreSQL — including wrapping bid placement in transactions with row-level locking (see `04-auction-rules.md`, Section 5).
- **Redis** is not a source of truth — it's used for caching, the Socket.IO adapter, and the BullMQ job queue. Nothing critical should live *only* in Redis.

---

## 7. Job Scheduling (BullMQ + Redis)

Used for anything that needs to happen automatically at a specific future time, without a user action triggering it:
- Auction auto-start at scheduled time
- Auction auto-close at scheduled (or extended) end time
- Payment window expiry checks
- (Optionally) sending reminder notifications, e.g., "auction closing soon"

---

## 8. Summary

Two independently deployed apps — a Vercel-hosted Next.js frontend with **zero backend logic**, and a Render-hosted Node.js backend that owns **all** business logic, real-time events, scheduled jobs, and data access — communicating over REST (JWT-authenticated) and Socket.IO (JWT-authenticated handshake), backed by PostgreSQL as the source of truth and Redis as the supporting infrastructure layer (cache, real-time scaling, job queue).