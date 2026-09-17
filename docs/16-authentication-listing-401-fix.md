# Listing Creation Authentication Error

## Error

While submitting the seller listing form, the frontend sent this request:

```text
POST http://localhost:4000/listings 401 (Unauthorized)
```

The form displayed:

```text
Could not create listing
Authentication required.
```

## Why It Happened

The backend listing route is protected by authentication middleware. It requires an access token in the request header:

```http
Authorization: Bearer <access-token>
```

The frontend API helper added this header only when an access token existed in its in-memory variable:

```ts
let accessToken: string | null = null;
```

The token was set after login, but it was lost when the page was reloaded or the frontend module was recreated. The user could still open and submit the listing form, but the request no longer contained the `Authorization` header. The backend therefore returned `401 Unauthorized` with `Authentication required.`

## Fix Made

### 1. Persist the access token for the browser session

In `hammr-frontend/src/lib/api.ts`:

- Added the `hammr_access_token` session-storage key.
- Updated `setAccessToken()` to save the token in `sessionStorage`.
- Updated `setAccessToken(null)` to remove the stored token during logout.
- Updated `getAccessToken()` to restore the token from `sessionStorage` when the in-memory value is empty.

### 2. Restore authentication when the app loads

In `hammr-frontend/src/hooks/useAuth.tsx`:

- Added an effect that restores the stored access token when `AuthProvider` mounts.
- This makes the token available to the API helper after a page reload.

The listing request can then include:

```http
Authorization: Bearer <access-token>
```

## Result

The frontend now keeps the access token for the current browser session, so authenticated listing requests continue to work after navigating or reloading the page.

The user must sign in again once after installing this fix so the token is stored in the new session-storage key.

## Validation

The fix was validated with:

- Frontend TypeScript check: passed
- Next.js production build: passed
