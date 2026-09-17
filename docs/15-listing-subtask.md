1. Add `Listing` model to Prisma schema — fields, `ListingStatus` enum, relation to `User` — plus run the migration.
2. Backend: listing input validator — Zod schema for title, description, images, category, starting price, reserve price, scheduled start/end times.
3. Backend: `createListing` service function — takes sellerId + validated input, writes to DB via Prisma, sets `currentEndAt = scheduledEndAt` and `status = SCHEDULED`.
4. Backend: `POST /listings` controller — parses/validates request body, calls the service, returns `201` with the created listing or `400` on validation failure.
5. Backend: register the route — `POST /listings`, protected by `authenticate` + `requireRole('SELLER')`, wired into `src/index.ts`.
6. Frontend: `CreateListingInput` type — matches the backend validator's shape exactly.
7. Frontend: `createListing` API function — POSTs to `/listings` with the Bearer token, throws on non-2xx response.
8. Frontend: `ListingForm` component — controlled inputs for all fields, client-side required-field checks, submit handler calling the API function.
9. Frontend: `/seller/listings/create` page — renders the form, redirects to Seller Dashboard on success, shows the API's error message on failure.
10. Verification pass — log in as Seller, submit the form, confirm `201` response, confirm the row exists in Prisma Studio with correct field values and `status = SCHEDULED`.