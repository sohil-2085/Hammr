# Hammr — Project Decisions Log

Several earlier files ( `03`, `04`, `05` ) flagged specific choices as "decide and document" rather than prescribing an exact value. This file is the single place where those are finalized, so there's no ambiguity left when building. If you change any of these while building, update this file so it stays the source of truth.

---

## 1. Account Roles — One Role Per Account

**Decision:** Each user account has exactly **one** role: `BUYER`, `SELLER`, or `ADMIN`, chosen at registration. A single person wanting to both sell and buy would need two separate accounts.

**Why:** Simpler schema (`role` enum on `User`, see `07-database-design.md`) and simpler auth/permission logic, given the 3-day timeline. Avoids edge cases like "a seller bidding as a buyer on their own platform," which also sidesteps needing shill-bidding detection for the MVP (that stays a Phase 2 idea, `06-phase-2-features.md`).

---

## 2. Minimum Bid Increment

**Decision:** Flat **$5** minimum increment for all listings in the MVP.

**Why:** Tiered increments (scaling with price) are explicitly listed as a Phase 2 feature (`06-phase-2-features.md`) — a flat value is enough to satisfy the core requirement ("must beat the current highest bid by a minimum increment") without extra complexity.

---

## 3. Reserve Price Visibility

**Decision:** The exact reserve price is **hidden** from buyers. The UI only shows a "Reserve not yet met" / "Reserve met" indicator once bidding starts.

**Why:** Matches common real-world auction platform behavior and avoids buyers anchoring bids exactly to a visible number.

---

## 4. Anti-Sniping Extension Rule

**Decision:**
- If a qualifying bid is placed within the **last 2 minutes** of an auction's current end time, the end time is extended by **2 minutes**.
- This can chain, but is capped at a **maximum of 10 extensions per auction** (i.e., at most 20 extra minutes total beyond the original scheduled end time).
- Once the cap is hit, further late bids are still accepted as valid bids, but no longer extend the clock — the auction closes at the capped time regardless.

**Why:** Directly answers the brief's "could this be extended forever?" concern (`04-auction-rules.md`, Section 4) with a concrete, bounded answer.

---

## 5. Concurrency Strategy for Bids

**Decision:** PostgreSQL transaction + row-level lock (`SELECT ... FOR UPDATE` on the `Listing` row) around the full "validate → insert bid → update current highest bid" sequence, via Prisma's `$transaction`.

**Why:** Guarantees correctness (no lost updates, no double-accepted bids) under concurrent load, as required in `02-requirements.md` and detailed in `04-auction-rules.md`, Section 5.

---

## 6. Payment Window Duration

**Decision:** Winning buyers get **15 minutes** (test-mode) to complete payment after winning.

**Why:** Long enough to be realistic for a demo/review, short enough that the fallback-to-next-bidder flow can actually be demonstrated without a long wait.

---

## 7. Fallback Bidder Cascade Limit

**Decision:** If a winning buyer fails to pay, the win passes to the next-highest bidder, who gets their own fresh 15-minute payment window. This cascades **up to 3 bidders deep**. If all 3 fail to pay (or fewer than 3 bids exist), the auction is marked **`UNSOLD`**.

**Why:** Prevents an unbounded cascade through every single bidder on a popular auction, while still fully satisfying the "move to next bidder" requirement.

---

## 8. JWT Token Lifetimes

**Decision:**
- Access token: **15 minutes**
- Refresh token: **7 days**

**Why:** Standard, reasonable balance between security (short-lived access tokens limit exposure if leaked) and usability (users aren't forced to log in constantly).

---

## 9. 2FA Scope

**Decision:** Two-Factor Authentication (TOTP via authenticator app) is **required for Seller accounts only**, exactly as the brief mandates. Not required for Buyer accounts in the MVP.

**Why:** Matches the brief's explicit minimum requirement; can be extended to buyers later if time allows, but isn't necessary for grading.

---

## 10. Deployment Split

**Decision:** Frontend (Next.js) on **Vercel**; backend (Node.js + Express + Socket.IO + Prisma/PostgreSQL) on **Render**, as two fully separate codebases/deployments — no backend logic in the Next.js app.

**Why:** Full reasoning in `03-tech-stack.md` and `06-system-architecture.md` — cleaner separation, standard Next.js deployment (no custom server hack), at the cost of needing CORS + JWT auth (instead of cookies) across the two domains, and accepting Render's free-tier cold-start delay.

---

## Quick Reference Table

| Decision | Value |
|---|---|
| Roles per account | 1 (Buyer, Seller, or Admin) |
| Minimum bid increment | $5 flat |
| Reserve price shown to buyers? | No — only met/not-met indicator |
| Anti-sniping extension trigger | Bid within last 2 minutes |
| Anti-sniping extension length | +2 minutes |
| Max extensions per auction | 10 (max +20 min total) |
| Bid concurrency strategy | Postgres row lock + transaction |
| Payment window | 15 minutes |
| Fallback bidder cascade depth | Up to 3 bidders |
| JWT access token lifetime | 15 minutes |
| JWT refresh token lifetime | 7 days |
| 2FA required for | Sellers only |
| Frontend host | Vercel |
| Backend host | Render |