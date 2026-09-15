# Hammr — Auction Rules & Mechanics (Deep Dive)

This file expands on the "Platform-Wide / Auction Mechanics" section of `02-requirements.md`, focused specifically on how auctions actually behave — the rules that make Hammr a real auction system rather than a simple listings page.

---

## 1. Auction Lifecycle (Scheduled → Live → Closed)

- Every auction has a **scheduled start time** and a **scheduled end time**, set by the seller at listing time.
- Auctions must **go live automatically** at the start time and **close automatically** at the end time — no admin/seller has to manually flip a switch.
- **Implementation note**: this requires a scheduler/job system (e.g., a cron job, or BullMQ backed by Redis) that checks for auctions crossing their start/end time and updates their status accordingly, rather than only calculating status "on read" (calculating on read can work too, but actions like closing and settlement need an actual triggered event, not just a display label).

**Status values an auction can have:** `Scheduled` → `Live` → `Closed`

---

## 2. Minimum Bid Increment

- A new bid must beat the current highest bid by **at least a minimum increment** — it can't just be "$1 more" if the increment is set higher.
- The increment can be a **fixed value** for the MVP (e.g., a flat amount, or a flat percentage). Tiered increments (where the increment scales with price) are listed as a **Phase 2** idea in `06-phase-2-features.md` — not required for the core build.

---

## 3. Reserve Price

- A seller may set a **reserve price** — the minimum amount they're willing to accept.
- If bidding never reaches the reserve price by the time the auction closes, the auction ends with **no winner**, even if there was active bidding.
- The reserve price should generally **not be shown directly to buyers** (common auction-platform practice is to only show "reserve not met" / "reserve met" rather than the exact number), though the brief doesn't explicitly require hiding it — decide and document your choice.

---

## 4. Auction Time Extension ("Anti-Sniping")

This is one of the two mechanics the brief specifically flags as something to think hard about.

- If a bid comes in **close to the closing time**, the auction's end time is **pushed back**, giving other buyers a fair chance to respond.
- This can **chain** — if another late bid comes in during the new extended window, it extends again.

### The Core Design Problem: Could This Go on Forever?
Yes, in theory, if you don't put a limit on it — a determined bidder (or two bidders trying to outlast each other) could keep extending indefinitely.

### Recommended Solution
Put a **hard cap** on extensions using one (or both) of these approaches:
1. **Maximum number of extensions** — e.g., an auction can only be extended a fixed number of times (say, 10), after which further late bids no longer extend the clock.
2. **Absolute maximum end time** — e.g., an auction can never run later than X hours/days past its originally scheduled end time, no matter how many extensions occur.

Document whichever limit you choose (and the exact numbers) clearly in your README, since this is a deliberate design decision the brief wants you to justify.

---

## 5. Handling Simultaneous Bids (Concurrency Correctness)

This is the second mechanic the brief specifically flags.

- Multiple buyers might submit a **qualifying bid within the same fraction of a second**.
- Your system must guarantee that:
  - Only **one** bid can actually become "the current highest bid" at any given moment.
  - No bid is silently lost, double-processed, or causes an incorrect highest-bid value.

### Recommended Solution
- Wrap bid placement in a **database transaction** with **row-level locking** (e.g., Postgres `SELECT ... FOR UPDATE` on the auction row, or a Postgres advisory lock keyed by auction ID) so that concurrent bid attempts on the same auction are processed **one at a time**, in the order the database actually receives them.
- Inside that locked transaction: re-check the current highest bid, validate the new bid beats it by the minimum increment, then commit the update — all atomically, so no other bid can sneak in between the check and the update.
- This guarantees **correctness** (no bad state), even if it means one of two near-simultaneous bidders gets a "someone just outbid you, try again" response instead of a silent failure.

---

## 6. Auction Settlement & Payment Fallback

- When an auction closes with a winner (reserve met, if applicable), that buyer gets a **payment window** — a fixed amount of time to complete a **test-mode payment**.
- **If the winning buyer doesn't pay in time**, the win **automatically passes to the next-highest bidder**, who then gets **their own fresh payment window**.
- This fallback can theoretically cascade (2nd bidder doesn't pay → 3rd bidder gets a chance, etc.) — decide how far down the bid list you're willing to cascade, and what happens if everyone fails to pay (likely: auction ends as **Unsold**).

**Final settlement outcomes a closed auction can have:**
- `Paid` — winning buyer completed payment
- `Moved to next bidder` — original winner didn't pay in time, fallback triggered
- `Unsold` — reserve not met, or no bids, or all bidders in the fallback chain failed to pay

---

## 7. Immutable Bid History

- Every bid placed is **permanently recorded**.
- Bids can **never be edited or deleted** after the fact — this is a hard rule, not just a UI restriction. Don't build any update/delete capability on bid records at all, even for admins.
- The full bid history should be visible to relevant users (e.g., the seller and the bidders on that auction).

---

## Quick Reference — Design Decisions You Need to Explicitly Make and Document

| Decision | Where It's Covered |
|---|---|
| Minimum bid increment value/logic | Section 2 |
| Whether reserve price is shown to buyers | Section 3 |
| Extension length + max extensions/hard cap | Section 4 |
| Concurrency strategy (locking approach) | Section 5 |
| Payment window duration | Section 6 |
| How many fallback bidders to try before marking Unsold | Section 6 |

These aren't optional details — the brief explicitly wants you to think through and justify each of them.