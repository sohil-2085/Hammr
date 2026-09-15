# Hammr — Core Requirements

These are **mandatory** features. The system must work correctly even when many users are using it at the same time.

---

## 1. Seller Requirements

A seller should be able to:

- **Register and log in** to their account.
- **List a product for auction**, providing:
  - Title
  - Description
  - Images
  - Category
  - Starting price
  - Reserve price (minimum price they're willing to accept)
  - Scheduled start time and end time
- **View all their auction listings** and see the current status of each one: *Scheduled*, *Live*, or *Closed*.
- **See live bidding activity**, including the current highest bid, as it happens.
- **See the final outcome** of a closed auction: *Paid*, *Moved to next bidder*, or *Unsold*.
- **View analytics** on each listing, including:
  - Number of bids
  - Number of views
  - How close the bidding got to the reserve price
- **Respond to buyer questions** posted on an active listing.

---

## 2. Buyer Requirements

A buyer should be able to:

- **Register and log in** to their account.
- **Browse auctions** (live and upcoming), with the ability to search and filter by:
  - Category
  - Price range
  - Closing time
- **Place bids**, following these rules:
  - A new bid must beat the current highest bid by a **minimum increment**.
  - The system must correctly handle the case where **two buyers bid at nearly the same instant** — only one bid can "win" that moment, and it must be handled fairly and consistently (see `03-auction-mechanics.md` for a deeper explanation).
- **Get notified immediately** when outbid by someone else.
- **See live, accurate updates** on the current highest bid and time remaining.
- **View their own bidding history** and any auctions they've won.
- **Complete a test-mode payment** within a set time window after winning.
- **Save auctions to a personal watchlist** for quick access later.
- **Rate a seller** after a completed and paid transaction.

---

## 3. Platform-Wide / Auction Mechanics Requirements

These rules apply across the whole system, not just to one role:

- **Auctions start and end automatically** at their scheduled times — no manual button needs to be pressed.
- **Late bids extend the auction.** If someone bids close to the closing time, the end time is pushed back a bit, giving other buyers a fair chance to respond. This can happen repeatedly (chain of extensions) if late bids keep coming in.
  - ⚠️ Important design question: could this let an auction be extended **forever**? Your system needs a sensible way to prevent that — think about a maximum extension limit or cap.
- **Reserve price enforcement.** If the seller set a reserve price and it isn't met by the end of bidding, the auction closes with **no winner**, even if people placed bids.
- **Automatic "next bidder" fallback.** If the winning buyer doesn't pay within the payment window, the win automatically passes to the **next-highest bidder**, who then gets their own fresh payment window.
- **Immutable bid history.** Every bid is permanently recorded. Past bids can **never** be edited or deleted, and the full history should be visible to relevant users.
- **Notifications** must be sent for:
  - Being outbid
  - Winning an auction
  - Payment window opening
  - Auction extensions
- **Authentication & role-based access** — sellers and buyers need separate, secure logins with permissions matching their role.
- **Two-Factor Authentication (2FA)** using an authenticator app (like Google Authenticator or Microsoft Authenticator) — required at least for **seller accounts**.
- **Accuracy under concurrent load.** The "current highest bid" must stay accurate and correct even when several buyers are bidding on the same item within the same second.
  - ⚠️ Important design question: what does your system actually *guarantee* when multiple bids arrive at nearly the same moment? You need a real answer to this (e.g., database-level locking, atomic transactions, or a queue), not just "it probably works."

---

## Why These "Think About" Points Matter

The brief specifically calls out two tricky problems on purpose — these are the parts that separate a toy project from a real auction system:

1. **Simultaneous bids on the same item** — Two people click "bid" in the same fraction of a second. Your backend needs a way to process these one at a time and safely (e.g., using database transactions, row-level locking, or a single-threaded queue per auction) so the highest, valid bid always wins and no bid is lost or double-counted.
2. **Infinite auction extension** — If every late bid extends the clock, a determined bidder could theoretically keep an auction open forever. A common real-world solution is to cap the number of extensions or set a hard maximum end time the auction cannot go past.

You'll want to explicitly design around both of these rather than leaving them to chance.