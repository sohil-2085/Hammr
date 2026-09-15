# Hammr — Bug / Error Fixing Instructions (For AI-Assisted Development)

**Purpose:** Whenever I report a bug or paste an error, follow this exact process and response format — every time, without me having to repeat these instructions.

---

## Before Answering

- If I haven't given enough to diagnose the issue (no error message, no stack trace, no relevant file/code, no screenshot), **ask for the missing piece first** rather than guessing at a fix. Be specific about what's missing (e.g., "paste the full stack trace" or "paste the contents of `bid.service.ts`") instead of asking a vague "can you give more details?"
- Check the relevant project docs before proposing a fix, so the fix stays consistent with established decisions:
  - `07-database-design.md` — is this a schema/data issue?
  - `08-api-design.md` — is this an API contract mismatch (wrong method, path, request/response shape)?
  - `09-authentication.md` — is this an auth/RBAC/token issue?
  - `04-auction-rules.md` — if it's bidding/auction related, is this a concurrency, extension, or settlement logic bug specifically?
  - `10-project-decisions.md` — make sure the "fix" doesn't silently contradict an already-decided value (e.g., don't "fix" the bid increment to a different number without flagging it).

---

## What Every Bug-Fix Response Must Include

### 1. Root Cause (short, 1–3 lines)
State plainly what's actually causing the bug — not a restatement of the symptom. If there are multiple plausible causes, say which one is most likely and why, based on the code/error given.

### 2. Exact Location
The specific file path and, where possible, the exact function/section responsible — matching the real folder structure from `12-initial-project-setup.md`. Don't describe the location vaguely ("somewhere in the bid logic") when the actual file is identifiable from what I've shared.

### 3. The Fix
- Give the actual corrected code, not a description of what to change.
- For a small fix: show it as a clear before/after or diff-style snippet.
- For a larger fix: show the full corrected function/block, not the entire file, unless the whole file needs restructuring.
- If the fix requires a new dependency, migration, or environment variable, say so explicitly with the exact command/value needed.

### 4. Why It Broke
One or two sentences explaining the underlying reason (e.g., "the transaction wasn't locking the row, so two concurrent requests both read the same stale highest-bid value before either wrote back") — enough to actually understand it, not a lecture on the general concept.

### 5. Blast Radius Check
Explicitly say whether this same bug pattern could exist elsewhere in the codebase (e.g., "this same missing lock issue likely also affects the payment-window fallback logic — worth checking `settlement.service.ts` too"). If it's fully isolated, say that in one line instead.

### 6. How to Verify the Fix
A short, concrete way to confirm it's actually fixed — a manual repro step, a specific scenario to re-test (e.g., "open two browser tabs, place near-simultaneous bids, confirm only one is accepted and the other gets a clear 'outbid' response"), or a log/DB check.

---

## What NOT to Do
- Don't propose unrelated refactors or "while we're here" improvements unless they're directly necessary to fix the actual bug — flag them separately as optional, don't bundle them into the fix.
- Don't change already-finalized values from `10-project-decisions.md` as a side effect of a fix without explicitly calling it out.
- Don't give a generic/conceptual explanation of the bug category (e.g., a general essay on race conditions) instead of the specific fix for this specific code.
- Don't ask multiple clarifying questions when one targeted one would do — see `ask_user_input`-style single-question preference in general.

---

## Formatting Rules
- Lead with the root cause and the fix — don't bury them under preamble.
- Use code blocks with the real file path noted above them.
- Keep explanation proportional to how novel the bug is — a one-line typo fix doesn't need the full 6-section treatment; a genuine concurrency bug does.