# Hammr — API Design

REST API served by the Node.js/Express backend on Render (see `03-tech-stack.md` and `06-system-architecture.md`). All protected routes require a `Bearer <JWT>` header (see `09-authentication.md`).

---

## Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register as Buyer or Seller |
| POST | `/auth/login` | Public | Log in; returns JWT (+ prompts for 2FA code if seller) |
| POST | `/auth/2fa/setup` | Auth (Seller) | Generate 2FA secret/QR code |
| POST | `/auth/2fa/verify` | Auth (Seller) | Confirm 2FA code during login or setup |
| POST | `/auth/refresh` | Public (refresh token) | Issue a new access token |
| POST | `/auth/logout` | Auth | Invalidate refresh token |

---

## Listings (Auctions)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/listings` | Auth (Seller) | Create a new auction listing |
| GET | `/listings` | Public | Browse/search/filter listings (category, price range, closing time) |
| GET | `/listings/:id` | Public | Get details of a single listing, including current highest bid & time remaining |
| GET | `/listings/mine` | Auth (Seller) | Seller's own listings with status |
| GET | `/listings/:id/analytics` | Auth (Seller, owner only) | Bid count, view count, closeness to reserve |
| POST | `/listings/:id/questions` | Auth (Buyer) | Ask a question on a listing |
| POST | `/listings/:id/questions/:qId/answer` | Auth (Seller, owner only) | Answer a buyer's question |

---

## Bids

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/listings/:id/bids` | Auth (Buyer) | Place a bid (see `04-auction-rules.md` for concurrency handling) |
| GET | `/listings/:id/bids` | Public | Full (immutable) bid history for a listing |
| GET | `/bids/mine` | Auth (Buyer) | Buyer's own bidding history |
| GET | `/bids/won` | Auth (Buyer) | Auctions the buyer has won |

---

## Watchlist

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/watchlist/:listingId` | Auth (Buyer) | Add a listing to watchlist |
| DELETE | `/watchlist/:listingId` | Auth (Buyer) | Remove from watchlist |
| GET | `/watchlist` | Auth (Buyer) | View personal watchlist |

---

## Payments (Test Mode)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/listings/:id/payment` | Auth (Buyer, current winner only) | Complete test-mode payment within the payment window |
| GET | `/listings/:id/settlement` | Auth (Seller owner or winning Buyer) | View settlement outcome (`PAID` / `MOVED_TO_NEXT_BIDDER` / `UNSOLD`) |

---

## Ratings

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/listings/:id/rating` | Auth (Buyer, must have paid) | Rate the seller after a completed transaction |
| GET | `/sellers/:id/ratings` | Public | View a seller's ratings |

---

## Notifications

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/notifications` | Auth | List the user's notifications |
| PATCH | `/notifications/:id/read` | Auth | Mark a notification as read |

*(Note: notifications are also pushed live via Socket.IO — see `06-system-architecture.md`, Section 5 — these REST routes are for the notification inbox/history view.)*

---

## Admin *(Optional — see `05-user-roles.md`)*

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/listings` | Auth (Admin) | View all listings platform-wide |
| GET | `/admin/users` | Auth (Admin) | View all sellers/buyers |
| GET | `/admin/disputes` | Auth (Admin) | View flagged disputes (if built — see `05-stretch-goals.md`) |

---

## General API Conventions

- **Validation**: validate all request bodies on the backend (e.g., with Zod) — never trust the frontend's validation alone.
- **Error format**: consistent JSON error shape, e.g. `{ "error": { "code": "OUTBID", "message": "..." } }`, so the frontend can handle specific cases (like "someone just outbid you, try again") cleanly.
- **Pagination**: list endpoints (`/listings`, `/bids/mine`, etc.) should support `page`/`limit` query params rather than returning unbounded result sets.
- **Rate limiting**: consider basic rate limiting on `/auth/*` and `/listings/:id/bids` to reduce abuse risk, given money/bidding is involved.