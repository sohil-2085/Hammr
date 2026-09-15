# Hammr — Database Design

Database: **PostgreSQL**, accessed via **Prisma ORM** (see `03-tech-stack.md`). This file outlines the core entities, their fields, and relationships needed to support everything in `02-requirements.md` and `04-auction-rules.md`.

---

## Entity Overview

```
User ──┬── Listing (as Seller, 1-to-many)
        ├── Bid (as Buyer, 1-to-many)
        ├── Watchlist (as Buyer, many-to-many with Listing)
        ├── Rating (as rater/rated)
        └── Notification (1-to-many)

Listing ──┬── Bid (1-to-many)
           ├── Question (1-to-many, buyer Q&A)
           └── Settlement (1-to-one, once closed)
```

---

## 1. User

Holds login credentials and role. Given the decision in `10-project-decisions.md` (one role per account), each user is either a Buyer, Seller, or Admin.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `email` | String, unique | |
| `passwordHash` | String | bcrypt/argon2 hashed, never plain text |
| `role` | Enum: `BUYER`, `SELLER`, `ADMIN` | |
| `name` | String | |
| `twoFactorEnabled` | Boolean | required `true` for `SELLER` role |
| `twoFactorSecret` | String, nullable | encrypted at rest |
| `reputationScore` | Float, nullable | stretch goal (see `05-stretch-goals.md`) |
| `createdAt` | DateTime | |

---

## 2. Listing (Auction)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `sellerId` | FK → User | must have role `SELLER` |
| `title` | String | |
| `description` | Text | |
| `images` | String[] (or separate `ListingImage` table) | |
| `category` | String / Enum | |
| `startingPrice` | Decimal | |
| `reservePrice` | Decimal, nullable | not shown directly to buyers (see `04-auction-rules.md`) |
| `currentHighestBid` | Decimal, nullable | denormalized for fast reads, kept in sync inside the bid transaction |
| `currentHighestBidderId` | FK → User, nullable | |
| `minIncrement` | Decimal | see `10-project-decisions.md` for default value |
| `scheduledStartAt` | DateTime | |
| `scheduledEndAt` | DateTime | original value, never overwritten |
| `currentEndAt` | DateTime | the *effective* end time, updated on each extension |
| `extensionCount` | Integer, default 0 | incremented on each anti-sniping extension |
| `status` | Enum: `SCHEDULED`, `LIVE`, `CLOSED` | |
| `viewCount` | Integer, default 0 | for analytics |
| `createdAt` | DateTime | |

---

## 3. Bid

**Immutable** — no update/delete operations should ever touch this table (see `04-auction-rules.md`, Section 7).

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `listingId` | FK → Listing | |
| `bidderId` | FK → User | must have role `BUYER` |
| `amount` | Decimal | |
| `createdAt` | DateTime | immutable timestamp — the definitive record of bid order |

**Index recommendation:** `(listingId, amount DESC, createdAt ASC)` — supports quickly finding the current highest bid and the fallback order for settlement.

---

## 4. Settlement

Represents the final outcome of a closed auction (see `04-auction-rules.md`, Section 6).

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `listingId` | FK → Listing, unique | one settlement per listing |
| `winningBidId` | FK → Bid, nullable | null if `UNSOLD` |
| `outcome` | Enum: `PAID`, `MOVED_TO_NEXT_BIDDER`, `UNSOLD` | |
| `paymentWindowExpiresAt` | DateTime, nullable | |
| `paidAt` | DateTime, nullable | |
| `fallbackAttempt` | Integer, default 0 | how many bidders down the chain this settlement has tried |

---

## 5. Watchlist

Many-to-many between User (buyers) and Listing.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `userId` | FK → User | |
| `listingId` | FK → Listing | |
| `createdAt` | DateTime | |

*(Unique constraint on `(userId, listingId)` to prevent duplicate watchlist entries.)*

---

## 6. Question (Buyer Q&A on a listing)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `listingId` | FK → Listing | |
| `buyerId` | FK → User | |
| `question` | Text | |
| `answer` | Text, nullable | filled in by the seller |
| `answeredAt` | DateTime, nullable | |
| `createdAt` | DateTime | |

---

## 7. Rating

Posted by a buyer about a seller, only after a completed and paid transaction.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `listingId` | FK → Listing | ties the rating to a specific completed transaction |
| `raterId` | FK → User | the buyer |
| `ratedSellerId` | FK → User | the seller |
| `score` | Integer (e.g., 1–5) | |
| `comment` | Text, nullable | |
| `createdAt` | DateTime | |

*(Constraint: only allowed if a `Settlement` with `outcome = PAID` exists for that listing/buyer.)*

---

## 8. Notification

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `userId` | FK → User | recipient |
| `type` | Enum: `OUTBID`, `WON_AUCTION`, `PAYMENT_WINDOW_OPENED`, `AUCTION_EXTENDED` | |
| `listingId` | FK → Listing, nullable | |
| `read` | Boolean, default false | |
| `createdAt` | DateTime | |

---

## Key Design Notes

- **`currentHighestBid` on `Listing` is denormalized** (duplicated) from the `Bid` table for fast reads — it must only ever be updated **inside the same locked transaction** that inserts the new highest bid, so it never drifts out of sync (see `04-auction-rules.md`, Section 5).
- **Bids are append-only.** Never expose an update or delete endpoint for the `Bid` table, at any role level, including admin.
- **`scheduledEndAt` vs `currentEndAt`** are kept separate so you always retain the *original* schedule for record-keeping/analytics, while `currentEndAt` reflects the real, possibly-extended closing time actually used by the scheduler.