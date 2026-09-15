# Hammr — Feature Development Instructions (For AI-Assisted Development)

**Purpose:** Whenever I ask for a new feature (or an addition to an existing one), follow this exact process and response format — every time, without me having to repeat these instructions.

---

## Before Answering, Always Check

- The current folder structure and conventions from `12-initial-project-setup.md` (frontend: `src/app`, `src/components`, `src/lib`, `src/hooks`, `src/types` — backend: `src/routes`, `src/controllers`, `src/services`, `src/middlewares`, `src/sockets`, `src/jobs`, `src/prisma`, `src/utils`).
- The database schema in `07-database-design.md` — does this feature need a new table/field, or does it fit an existing one?
- The API conventions in `08-api-design.md` — does this feature need a new endpoint, or extend an existing one? Follow the existing error format and pagination conventions.
- The auth/RBAC rules in `09-authentication.md` — which role(s) can access this feature? Does it need an ownership check (not just a role check)?
- The auction mechanics rules in `04-auction-rules.md` — if the feature touches bidding, auctions, or settlement, it must respect the concurrency, extension, and immutability rules already defined there.
- The finalized values in `10-project-decisions.md` (bid increment, extension rules, payment window, etc.) — don't invent new numbers, use what's already decided unless I explicitly say to change one.
- The MVP scope in `11-mvp-build-plan.md` — flag it (briefly) if I ask for something that was deliberately scoped out of the MVP, but still build it if I confirm I want it now.

---

## What Every Feature Response Must Include

### 1. Impact Summary (short, 2–4 lines)
Which layers this touches: Database / Backend / Frontend / Real-time (Socket.IO) / Jobs (BullMQ). Skip layers that aren't touched — don't pad this section.

### 2. Database Changes (if any)
- Exact Prisma schema changes (`schema.prisma`) — new model, new field, new relation, new enum value.
- The exact migration command to run (e.g., `npx prisma migrate dev --name add_watchlist`).
- If no schema change is needed, say so in one line — don't skip this section silently.

### 3. Backend Changes
For every file touched or created, give:
- The exact file path, matching the established folder structure (e.g., `src/services/watchlist.service.ts`, `src/routes/watchlist.routes.ts`).
- Whether it's a **new file** or an **edit to an existing file**.
- The actual code for new files, or the specific code change (not just a description) for edits to existing files.
- Which existing file needs to import/register the new code (e.g., "register this new route in `src/index.ts`") — don't leave integration points implicit.
- If it's a new API endpoint: method, path, required role, request/response shape — consistent with `08-api-design.md`'s format.
- If it emits or listens to a Socket.IO event: exact event name and payload shape, consistent with the event list in `06-system-architecture.md`.
- If it needs a new scheduled job: where it goes in `src/jobs/`, and what triggers it.

### 4. Frontend Changes
For every file touched or created, give:
- The exact file path (e.g., `src/app/watchlist/page.tsx`, `src/components/WatchlistButton.tsx`).
- Whether it's new or an edit.
- The actual code.
- Exactly which backend endpoint(s) it calls (method + path), and where that API call function lives (`src/lib/`).
- If it listens to a Socket.IO event, which one, and how the UI updates in response.
- Any new dependency to install, with the exact `npm install` command.

### 5. Environment Variables (if any)
List any new `.env` variable needed, on both frontend and backend, and note that it needs to be added to `.env.example` too (never the real secret value).

### 6. Order of Implementation
A short numbered list of the order to actually build this in (typically: schema → migration → backend service → backend route → wire into `index.ts` → frontend API call → frontend UI → Socket.IO wiring, if relevant).

### 7. How to Verify It Works
A short, concrete manual test — e.g., "Log in as Buyer, click Watchlist on a listing, refresh, confirm it's still there; check the `Watchlist` row was created in Prisma Studio."

### 8. Side Effects / What Else This Touches
One line flagging if this change affects existing logic (e.g., "this adds a new Prisma relation on `User`, run `npx prisma generate` again" or "this changes the shape of `GET /listings/:id`, the Auction Detail screen's type needs updating too"). If nothing else is affected, say so briefly.

---

## Formatting Rules
- Give real, complete code for new files — not pseudocode, not "add your logic here."
- For edits to existing files, show only the changed portion clearly (e.g., a diff-style snippet or `str_replace`-style before/after), not the entire file re-pasted, unless the file is being substantially restructured.
- Keep prose between sections short — the value here is completeness and precision of *what to change and where*, not lengthy explanation of concepts I already understand.
- Don't re-explain the architecture, stack choices, or already-finalized decisions (`03`, `06`, `07`, `08`, `09`, `10`) — just apply them.
- Only explain *why* something is done a certain way if it's a new decision being made in that response (i.e., something not already covered by the existing docs).