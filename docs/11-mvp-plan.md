# Hammr — MVP Build Plan & Screen Inventory (3-Day Prototype Strategy)

Your instinct is correct: trying to build **every** mandatory feature from `02-requirements.md` fully polished in 3 days is how projects fall apart. The right approach is to build a **thin but fully real vertical slice** — the actual hard logic (real-time bidding, concurrency, auto start/close, settlement) working end-to-end — rather than spreading effort evenly across every feature and finishing nothing properly.

This file tells you: **(1)** exactly which screens exist in total, **(2)** which ones you build for the demo vs. later, **(3)** the step-by-step build order, and **(4)** what to build right after the demo to get back to full brief compliance.

---

## 1. Full Screen Inventory (Whole Product)

| # | Screen | Role | Purpose |
|---|---|---|---|
| 1 | Login | All | Email/password (+2FA step for sellers) |
| 2 | Register | All | Sign up, choose role (Buyer/Seller) |
| 3 | Browse / Home | Buyer (public) | List live + upcoming auctions, search & filters |
| 4 | Auction Detail | Buyer (public) | Live highest bid, countdown, bid box, bid history, Q&A |
| 5 | Seller Dashboard | Seller | List of their own auctions + status |
| 6 | Create/Edit Listing | Seller | Form: title, description, images, category, prices, schedule |
| 7 | Seller Listing Analytics | Seller | Bid count, view count, closeness to reserve, Q&A answering |
| 8 | Buyer Bidding History | Buyer | All bids placed, auctions won |
| 9 | Payment (Test Mode) | Buyer | Complete payment within window after winning |
| 10 | Watchlist | Buyer | Saved auctions |
| 11 | Notifications | All | Outbid, won, payment window, extensions |
| 12 | Rating Submission | Buyer | Rate seller after paid transaction |
| 13 | 2FA Setup | Seller | Scan QR, confirm authenticator code |
| 14 | Admin Dashboard *(optional)* | Admin | Platform-wide oversight — skip unless time remains |

**Total: 13 screens for full compliance (14 if you build the optional Admin role).**

---

## 2. Screens to Build for the Prototype/Demo (7 screens)

These are the screens that let you demonstrate the **entire core loop** — a seller creating an auction, a buyer bidding on it live, and it settling — which is what actually proves the hard part works.

| Priority | Screen | Why it's in the demo |
|---|---|---|
| ✅ Must | **Login / Register** (can be one combined screen with a tab toggle) | Nothing works without auth |
| ✅ Must | **Browse / Home** | Shows off search/filter + the list of live auctions |
| ✅ Must | **Auction Detail** | The star screen — live countdown, live highest bid updating via Socket.IO, bid box, extension happening in front of the client's eyes |
| ✅ Must | **Create Listing** | Lets you actually demo the seller side creating something to bid on |
| ✅ Must | **Seller Dashboard** | Shows listing status changing (Scheduled → Live → Closed) in real time |
| ✅ Must | **Buyer Bidding History / Won Auctions** | Proves settlement + "you won" state works |
| ✅ Must | **Payment (Test Mode)** | Completes the full loop and lets you demo the fallback-to-next-bidder logic live |

**Skip for the demo, add right after:** Watchlist, Notifications page (a simple toast/badge is enough for the demo instead of a full page), Rating Submission, Seller Analytics, 2FA setup UI (see note below), Admin.

> **Important exception — 2FA:** the brief explicitly requires 2FA for sellers. Even though it's not a "must-show" screen, don't skip *building* it — it's a hard requirement, not a nice-to-have. You can build a minimal version (QR code + code input, no fancy styling) without it eating much time.

---

## 3. MVP Feature Scope — What's "In" for the Demo

Pulled from `02-requirements.md` and `04-auction-rules.md`, this is the minimum feature set that still proves the system is real, not a mockup:

- Register/login as Buyer or Seller (JWT-based, see `09-authentication.md`)
- 2FA for seller accounts (build it, even if minimal UI)
- Seller creates a listing with a **short scheduled start/end time** (use minutes, not days, so you can demo it live — e.g., starts in 1 minute, runs for 3 minutes)
- Auctions **auto-start and auto-close** on their own (no manual trigger) — proves your scheduler works
- Buyer places bids that must beat the current highest bid by the minimum increment ($5 flat, per `10-project-decisions.md`)
- **Live updates via Socket.IO** — highest bid and countdown update on screen without refreshing, for anyone watching
- **Anti-sniping extension** — placing a bid in the last 2 minutes visibly pushes the countdown out, live, in front of the client
- **Concurrency correctness** — the bid transaction/locking logic from `04-auction-rules.md` must genuinely be in place, even if you can't "show" it visually — this is what a technical reviewer will actually test
- Reserve price logic (unsold if not met)
- Auction closes → winner determined → payment window opens → buyer completes test-mode payment
- **Fallback bidder logic** — you can literally let a payment window expire on purpose during the demo to show the win passing to the next bidder
- Immutable bid history displayed on the Auction Detail screen

## What's Deliberately Left Out of the MVP
- Watchlist, Ratings, Buyer Q&A, Seller analytics dashboard, Notification inbox page (use simple toasts instead), Admin role, all Stretch Goals (`05-stretch-goals.md`) and all Phase 2 ideas (`06-phase-2-features.md`).

---

## 4. Step-by-Step Build Order (3 Days)

### Day 1 — Foundation + Core Data Flow
1. Set up two repos/folders: `/frontend` (Next.js) and `/backend` (Node/Express) — see `03-tech-stack.md`.
2. Set up PostgreSQL + Prisma schema for `User`, `Listing`, `Bid`, `Settlement` only (skip `Watchlist`, `Rating`, `Question`, `Notification` tables for now — add later) — see `07-database-design.md`.
3. Build auth: register, login, JWT issuing, role middleware (`09-authentication.md`). Add minimal 2FA for sellers now while auth is fresh in your head.
4. Build Seller: Create Listing form + `POST /listings` API.
5. Build Buyer: Browse/Home screen + `GET /listings` API (basic filter by category is enough — skip advanced filtering for now).
6. Deploy skeletons early (frontend to Vercel, backend to Render) so deployment issues surface on Day 1, not Day 3.

### Day 2 — The Hard Part: Real-Time Bidding
1. Build the Auction Detail screen (static first: shows listing info, current highest bid, countdown).
2. Implement `POST /listings/:id/bids` with the **transaction + row lock** concurrency logic — this is the single most important piece of backend code in the whole project (`04-auction-rules.md`, Section 5).
3. Set up Socket.IO server on the backend and Socket.IO client on the frontend; wire up `bid:new` and `bid:outbid` events so the Auction Detail screen updates live.
4. Implement the anti-sniping extension rule (+2 min if bid within last 2 min, capped at 10 extensions) and emit `auction:extended`.
5. Set up BullMQ + Redis scheduler for auto-start/auto-close of auctions (`06-system-architecture.md`, Section 3B).
6. Build Seller Dashboard showing live status per listing (`Scheduled` / `Live` / `Closed`).

### Day 3 — Settlement, Payment, Polish, Deploy
1. Implement auction close logic: check reserve price met/not met, determine winner, open payment window.
2. Build the Payment (Test Mode) screen + `POST /listings/:id/payment` endpoint.
3. Implement payment-window expiry job → fallback to next-highest bidder (up to 3 deep, per `10-project-decisions.md`) → new payment window opens for them.
4. Build Buyer Bidding History / Won Auctions screen.
5. Add simple toast notifications for outbid/won/payment-window-opened (skip the full Notifications inbox screen).
6. Final deploy check on both Vercel and Render; confirm CORS + JWT + Socket.IO auth all work cross-domain in production, not just locally.
7. Write the README (setup steps, env var names, approach overview, demo credentials for at least one seller + one buyer) — required deliverable per `04-deployment-and-deliverables.md`.
8. Rehearse the demo script (see Section 5 below) at least once end-to-end before showing the client.

---

## 5. Suggested Demo Script (What to Actually Show the Client)

1. Register/log in as a **seller**, complete 2FA.
2. Create a new listing with a start time ~1 minute away and a short 2–3 minute duration (so the whole lifecycle is watchable live).
3. Switch to a **buyer** account (or open a second browser/incognito window) and show the listing appear as "Scheduled," then automatically flip to "Live" — no button pressed.
4. Place a bid as Buyer A. Show the highest bid update **live** on both the buyer and seller screens via Socket.IO.
5. Open a third window as Buyer B, place a bid in the last 2 minutes — show the countdown **extend live** in front of the client.
6. Let the auction close naturally. Show the winner gets a payment window.
7. Complete the test-mode payment as the winner — show the settlement outcome flip to `PAID`.
8. *(Optional flex)* Do a second quick auction run where you deliberately let the payment window expire, to show the fallback-to-next-bidder logic working.

This script directly demonstrates every one of the hard, "this is a real system" requirements from the brief — automatic scheduling, live concurrent bidding, anti-sniping, reserve/settlement, and payment fallback — in about 5 minutes.

---

## 6. After the Demo — Building Back Up to Full Brief Compliance

Once the client has seen the working core, prioritize finishing the remaining **mandatory** items (not stretch goals) in roughly this order, since they're all still required deliverables per `02-requirements.md`:

1. **Buyer Q&A** on listings (seller responds to questions) — fairly quick to add.
2. **Watchlist** — simple many-to-many, quick to add.
3. **Ratings** after a paid transaction.
4. **Seller Analytics** screen (bid count, view count, reserve closeness) — mostly just querying data you already have.
5. **Full Notifications** — persist notifications to the database and build the inbox screen (you already have the events firing from Day 2/3, just need to store + display them).
6. Polish 2FA UI if it was left minimal on Day 1.

Only after **all of the above** are done should you look at Stretch Goals (`05-stretch-goals.md`) or Phase 2 ideas (`06-phase-2-features.md`) — they're explicitly optional and shouldn't be started before the mandatory list is complete.