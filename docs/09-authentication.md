# Hammr — Authentication & Security Design

Expands on the auth flow introduced in `06-system-architecture.md` (Section 4) with full implementation detail.

---

## 1. Credentials & Passwords

- Passwords are **hashed with bcrypt or argon2** before storage — never stored in plain text, never logged.
- Minimum password rules (length, complexity) should be enforced on the backend at registration, not just the frontend.

---

## 2. JWT-Based Authentication

Chosen instead of cookie-based sessions specifically because the frontend (Vercel) and backend (Render) live on **different domains** — see `03-tech-stack.md` for why.

### Tokens
- **Access token**: short-lived (e.g., 15 minutes), sent as `Authorization: Bearer <token>` on every protected REST request.
- **Refresh token**: longer-lived (e.g., 7 days), used to silently obtain a new access token via `POST /auth/refresh` without forcing re-login.

### Where tokens live on the frontend
- Access token: kept in memory (e.g., React state/context) — not `localStorage`, to reduce XSS exposure.
- Refresh token: stored more durably (e.g., `httpOnly` cookie scoped to the backend's domain, or secure storage) — exact mechanism should be decided based on how strict you want to be; a simpler MVP approach (refresh token in `localStorage`) is acceptable given the project's test/sandbox nature, but document the trade-off in your README.

---

## 3. Two-Factor Authentication (2FA) — Required for Sellers

The brief explicitly requires 2FA via an authenticator app **at least for seller accounts**.

### Flow
1. **Setup**: Seller calls `POST /auth/2fa/setup`. Backend generates a TOTP secret (e.g., using `otplib` or `speakeasy`), returns a QR code the seller scans with Google Authenticator / Microsoft Authenticator.
2. **Verification**: Seller enters the 6-digit code from their app to confirm setup (`POST /auth/2fa/verify`). Backend validates it against the stored secret before marking `twoFactorEnabled = true`.
3. **Login with 2FA**: After a seller enters their email/password correctly, the backend requires a valid TOTP code before issuing the JWT — a normal password alone is not sufficient for seller accounts.
4. **Secret storage**: the TOTP secret is encrypted at rest in the database, not stored in plain text (see `07-database-design.md`, `User.twoFactorSecret`).

### For Buyers
2FA is not required by the brief for buyers — decide whether to offer it as optional. If time allows, offering it to everyone is a nice touch but not necessary for grading.

---

## 4. Role-Based Access Control (RBAC)

- JWT payload includes the user's `id` and `role` (`BUYER`, `SELLER`, or `ADMIN`).
- Backend middleware:
  1. Verifies the JWT signature and expiry.
  2. Attaches the decoded user (`req.user = { id, role }`) to the request.
  3. A second middleware/guard checks the required role(s) for that specific route (e.g., only `SELLER` can hit `POST /listings`).
- **Ownership checks** go further than role checks alone — e.g., a seller can only answer questions on *their own* listings, not any listing. This must be checked explicitly in the route handler (compare `listing.sellerId === req.user.id`), not assumed from the role alone.

---

## 5. Authenticating Socket.IO Connections

Real-time connections need the same rigor as REST calls:

1. Frontend connects with the access token: `io(backendUrl, { auth: { token } })`.
2. Backend's Socket.IO middleware (`io.use(...)`) verifies the token on connection, the same way REST middleware does, and rejects the connection if invalid/expired.
3. Once authenticated, the backend can scope what events/rooms a socket is allowed to join (e.g., a buyer's private "outbid" notifications should only be emitted to their own socket, not broadcast to everyone).

---

## 6. CORS Configuration (Cross-Domain Requirement)

Since frontend (Vercel) and backend (Render) are on different domains (see `03-tech-stack.md`):

- Backend's CORS config must explicitly allow the deployed Vercel domain as an allowed origin (not `*`, since credentials/tokens are involved).
- Socket.IO's own CORS config (separate from Express's) needs the same allowed origin set.

---

## 7. General Security Practices (ties back to `03-security-and-practices.md`)

- Never commit `.env` files or secrets — JWT signing secret, 2FA encryption key, database URL, Redis URL all come from environment variables.
- Validate and sanitize all input server-side (e.g., with Zod schemas) before it touches the database.
- Use HTTPS everywhere in production (Vercel and Render both provide this by default).
- Keep all payment logic strictly in test/sandbox mode — no real payment processor credentials should ever be used.