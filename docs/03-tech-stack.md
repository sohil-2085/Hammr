# Hammr — Tech Stack (Finalized)

## Required Technologies (fixed by the brief)

| Layer | Technology |
|---|---|
| Frontend | **Next.js** with **TypeScript** |
| Backend | **Node.js** with **TypeScript** |

## Chosen Stack

| Concern | Choice |
|---|---|
| Database | **PostgreSQL** |
| ORM | **Prisma** |
| Caching Layer | **Redis** |
| Real-time | **Socket.IO** |
| Frontend Hosting | **Vercel** (standard Next.js deployment) |
| Backend Hosting | **Render** (Node.js/Express + Socket.IO + Prisma) |

---

## Hard Rule: Strict Code Separation

- **The Next.js codebase contains frontend code only.** No backend/business logic lives in Next.js — that means **no Next.js API routes** used for auth, bids, listings, or any other business logic. Next.js pages/components only call the external Node.js backend (REST + Socket.IO client).
- **The Node.js codebase contains all backend logic.** This includes the REST API, all business logic (auth, bidding, auctions, payments, notifications), the Socket.IO server, and the Prisma/PostgreSQL data layer.
- **Repo structure**: keep them as two clearly separate top-level folders/repos — e.g., `/frontend` (Next.js, deployed to Vercel) and `/backend` (Node.js, deployed to Render) — never mixed together in the same codebase. This makes the deployment split unambiguous and keeps commit history clean and easy to review (see `03-security-and-practices.md` for Git expectations).

## Final Deployment Architecture: Split (Vercel + Render)

### Frontend — Vercel
- Deployed as a **standard Next.js app** (`next build`), no custom server required.
- Gets Vercel's CDN, edge caching, and image optimization for free.
- Talks to the backend via:
  - **REST API calls** (fetch/axios) for auth, listings, bids, watchlist, ratings, etc.
  - **Socket.IO client** connecting directly to the Render backend's WebSocket URL for real-time bid updates and notifications.

### Backend — Render
- A separate Node.js app (Express or Fastify) that hosts:
  - The REST API
  - The Socket.IO server
  - Prisma client connected to PostgreSQL
- Runs as a **persistent process** (Render supports this, unlike Vercel's serverless model), which Socket.IO requires.

### Why Split Instead of Combined
Splitting removes the need for a custom Next.js server that manually attaches Socket.IO to Next's HTTP server. Instead:
- Next.js runs however Vercel expects it to (simpler, standard, well-optimized).
- Socket.IO + REST API run entirely in their own Express app on Render (simpler, standard).

This is cleaner, more standard, and closer to how real production systems separate frontend and backend — rather than one hacked-together combined server.

### Things to Handle Because of the Split
1. **CORS** — the Render backend must explicitly allow requests from the Vercel frontend's domain (`Access-Control-Allow-Origin`), and Socket.IO's own CORS config needs the same origin allowed.
2. **Cross-domain auth — use JWT, not cookies** — since frontend and backend are on different domains, plain session cookies run into third-party cookie restrictions. Instead:
   - Backend issues a JWT access token (and optionally a refresh token) on login.
   - Frontend stores it and sends it as a `Bearer` header on REST calls.
   - The same token is passed during the Socket.IO handshake (`auth: { token }`) so the backend can authenticate the socket connection too.
3. **Render free-tier cold starts** — a free Render service spins down after inactivity and takes ~30–50 seconds to wake up on the next request. The *first* action a reviewer takes (e.g., logging in) may be slow. Mention this clearly in the README so it isn't mistaken for a bug.
4. **Two sets of environment variables** — one set configured on Vercel (e.g., `NEXT_PUBLIC_API_URL` pointing to the Render backend), and one set on Render (database URL, JWT secret, Redis URL, etc.).

---

## Why PostgreSQL + Prisma
- Strong relational integrity, with native support for **transactions** and **row-level locking** — both critical for bid correctness.
- Bid placement should be wrapped in a Prisma `$transaction`, using `SELECT ... FOR UPDATE` (or a Postgres advisory lock per auction ID), so two simultaneous bids on the same auction are processed safely, one at a time. This is what actually solves the "two buyers bid in the same second" problem from `02-requirements.md`.

## Why Redis — Used for More Than Just Caching
1. **Caching** — frequently-read data like live listings and current highest bid.
2. **Socket.IO Redis Adapter** (`@socket.io/redis-adapter`) — needed if you ever scale to more than one backend instance, so real-time events broadcast correctly across instances. Cheap to add now even if running a single instance.
3. **BullMQ (built on Redis)** — for scheduled jobs: auctions auto-starting/closing at their exact scheduled time, and checking/expiring payment windows. Maps naturally to a job queue instead of manual polling.

---

## Summary of the Full Flow
- **Frontend**: Next.js (TypeScript) on Vercel — standard deployment, no custom server.
- **Backend**: Node.js (TypeScript) with Express/Fastify on Render — hosts REST API + Socket.IO server together, as one persistent process.
- **Auth**: JWT-based, used for both REST requests and the Socket.IO handshake, to work cleanly across the Vercel/Render domain split.
- **Database**: PostgreSQL via Prisma, with transactions/row-level locking around bid placement for concurrency correctness.
- **Redis**: caching, Socket.IO scaling (adapter), and scheduled jobs (BullMQ) for auction start/close and payment-window expiry.