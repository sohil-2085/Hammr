# Hammr — User Roles & Permissions

This file consolidates everything related to **who can do what** in Hammr, pulling together role definitions from across the brief into one reference.

---

## 1. Seller

**Purpose:** Lists products for auction and manages their own listings.

**Can do:**
- Register and log in
- Create a new auction listing (title, description, images, category, starting price, reserve price, scheduled start/end time)
- View all of their own listings and current status (`Scheduled`, `Live`, `Closed`)
- View live bidding activity and the current highest bid on their own listings
- View the final settlement outcome of their closed auctions (`Paid`, `Moved to next bidder`, `Unsold`)
- View analytics for their own listings (bid count, view count, how close bidding got to reserve)
- Respond to buyer questions on their own active listings

**Cannot do:**
- View or manage another seller's listings
- Place bids (a seller shouldn't be bidding as a buyer on the platform in general — and definitely never on their own listing; see the "Shill Bidding Detection" Phase 2 idea in `06-phase-2-features.md`)

**Security requirement specific to this role:**
- **Two-Factor Authentication (2FA)** via an authenticator app (Google Authenticator, Microsoft Authenticator, etc.) is **required at least for seller accounts** — this is explicit in the brief, not optional.

---

## 2. Buyer

**Purpose:** Browses auctions and competes to win items through bidding.

**Can do:**
- Register and log in
- Browse live/upcoming auctions, with search and filters (category, price range, closing time)
- Place bids (must beat current highest bid by the minimum increment)
- Get notified immediately when outbid
- View current highest bid and time remaining on any auction, kept accurate live
- View their own bidding history and auctions they've won
- Complete test-mode payment within the payment window after winning
- Save auctions to a personal watchlist
- Rate a seller after a completed and paid transaction

**Cannot do:**
- Edit or delete their own past bids (bid history is immutable — see `04-auction-rules.md`)
- View other buyers' private bidding history (only what's relevant/public, like current highest bid, should be visible)
- List products for auction (unless the same user account is also registered as a seller — decide whether one account can hold both roles, or whether they're strictly separate account types)

---

## 3. Platform Admin *(Optional)*

**Purpose:** Oversight across the whole platform. Only build this if you have time — it's explicitly optional in the brief.

**Could do (if built):**
- View/oversee all sellers, buyers, and listings across the platform
- View/manage disputes (ties into the "Dispute or report flow" stretch goal in `05-stretch-goals.md`)
- Broader visibility than either Seller or Buyer roles — essentially platform-wide read (and possibly moderation) access

**Note:** Since this role is optional, prioritize getting Seller and Buyer fully correct and working before spending time here.

---

## Role-Based Access Control (RBAC) — Implementation Notes

- Every backend route must check **both**:
  1. **Authentication** — is this a valid, logged-in user? (verify JWT / session)
  2. **Authorization** — does this user's role/ownership allow this specific action? (e.g., only the seller who owns a listing can respond to questions on it; only the buyer who placed a bid can see it in "their" history)
- A common pattern: attach the authenticated user's ID and role to the request (via JWT payload) after verifying the token, then check role/ownership in middleware or at the top of each route handler before running any business logic.
- Don't rely on the **frontend** to hide buttons/pages as your only access control — the backend must independently enforce these rules, since a malicious user could call your API directly, bypassing the UI entirely.

---

## One Account, Multiple Roles? — A Decision You Should Make Explicitly

The brief describes Seller and Buyer as roles, but doesn't explicitly say whether:
- **(a)** a single user account can hold both roles at once (e.g., someone who sells AND buys), or
- **(b)** each account is strictly one role only, chosen at registration.

Either is defensible, but pick one and be consistent — this affects your database schema (a `role` field vs. a many-to-many roles relationship) and your registration flow. Document your choice in your README's "approach overview" section (see `04-deployment-and-deliverables.md`).