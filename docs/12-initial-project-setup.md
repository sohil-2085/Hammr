# Hammr — Initial Project Setup (Before Writing Any Feature Code)

This is the setup checklist to run through **before** starting Day 1 of `11-mvp-build-plan.md`. Following this now avoids messy configuration fights later. Matches the architecture from `03-tech-stack.md` and `06-system-architecture.md`: two separate codebases, Next.js + Tailwind on the frontend, Node.js + Express + Prisma on the backend.

---

## 0. Prerequisites

- **Node.js**: use an LTS version (v20.x recommended) — install via `nvm` so you can pin the version per project.
- **Git** installed and a GitHub repo (or two — see structure note below) created.
- **PostgreSQL** and **Redis** available for local development. Two options:
  - **Option A (recommended for speed): Docker Compose** — run local Postgres + Redis containers, no manual installs.
  - **Option B**: use free-tier cloud instances directly for both local dev and production (e.g., Neon or Supabase for Postgres, Upstash for Redis) — simpler if you don't want to deal with Docker at all.

## Repo Structure

Per the strict separation rule in `03-tech-stack.md`, keep these as two fully separate projects:

```
hammr-frontend/     ← Next.js, deployed to Vercel
hammr-backend/      ← Node.js/Express, deployed to Render
```
Two separate GitHub repos is cleanest (matches two separate deployments cleanly), but a monorepo with two top-level folders and separate `package.json`s works too if you prefer one repo. Either way, **never mix frontend and backend code in the same package**.

---

## 1. Frontend Setup (Next.js + TypeScript + Tailwind + ESLint + Prettier)

### 1.1 Scaffold the project
```bash
npx create-next-app@latest hammr-frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd hammr-frontend
```
This one command already gives you: TypeScript, Tailwind CSS pre-configured, ESLint pre-configured, the App Router, a `src/` directory, and a `@/*` import alias — all standard "production-level" defaults.

### 1.2 Add Prettier (Next's default ESLint setup doesn't include it)
```bash
npm install -D prettier eslint-config-prettier prettier-plugin-tailwindcss
```
- `eslint-config-prettier` turns off ESLint rules that conflict with Prettier's formatting.
- `prettier-plugin-tailwindcss` automatically sorts your Tailwind classes into a consistent order — genuinely useful once you have long `className` strings.

**`.prettierrc.json`:**
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**`.prettierignore`:**
```
node_modules
.next
build
dist
```

### 1.3 Update ESLint config to work with Prettier
Next.js 15+ uses a flat `eslint.config.mjs` by default. Add the Prettier config to the end of the array so it overrides conflicting style rules:
```js
// eslint.config.mjs
import prettierConfig from 'eslint-config-prettier';
// ...existing next/core-web-vitals config...
export default [
  // ...existing config array items...
  prettierConfig,
];
```

### 1.4 Add convenience scripts
**`package.json`:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

### 1.5 Suggested folder structure inside `src/`
```
src/
  app/                → routes (App Router pages)
  components/         → reusable UI components
  lib/                → API client, socket client, utility functions
  hooks/              → custom React hooks
  types/              → shared TypeScript types/interfaces
```
Remember: **no `app/api/` routes used for backend/business logic** — those are for the Node.js backend only (per `03-tech-stack.md`'s hard separation rule).

### 1.6 Environment variables
**`.env.local.example`** (commit this; never commit the real `.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

---

## 2. Backend Setup (Node.js + TypeScript + Express + Prisma + Socket.IO)

### 2.1 Scaffold the project
```bash
mkdir hammr-backend && cd hammr-backend
npm init -y
git init
```

### 2.2 Install dependencies
```bash
# Runtime dependencies
npm install express cors dotenv bcrypt jsonwebtoken zod socket.io ioredis bullmq otplib

# Dev dependencies
npm install -D typescript ts-node-dev nodemon @types/node @types/express @types/cors @types/bcrypt @types/jsonwebtoken
```

### 2.3 Initialize TypeScript
```bash
npx tsc --init
```
**`tsconfig.json`** (key settings to adjust):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

### 2.4 Set up Prisma
```bash
npm install -D prisma
npm install @prisma/client
npx prisma init
```
This creates `prisma/schema.prisma` and a `.env` with `DATABASE_URL`. Fill in your schema based on `07-database-design.md`, then:
```bash
npx prisma migrate dev --name init
```

### 2.5 ESLint + Prettier for the backend
```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier prettier
```

**`.eslintrc.json`:**
```json
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "eslint-config-prettier"
  ],
  "env": { "node": true, "es2021": true },
  "parserOptions": { "ecmaVersion": 2021, "sourceType": "module" }
}
```

**`.prettierrc.json`:** (same as frontend, minus the Tailwind plugin)
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

### 2.6 Add convenience scripts
**`package.json`:**
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write .",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
}
```

### 2.7 Suggested folder structure
```
src/
  routes/           → Express route definitions (per resource, matching 08-api-design.md)
  controllers/      → request handlers
  services/         → business logic (bid placement, settlement, etc.)
  middlewares/       → auth, RBAC, error handling
  sockets/          → Socket.IO event handlers
  jobs/             → BullMQ job definitions (auction start/close, payment expiry)
  prisma/           → Prisma client instance
  utils/            → shared helpers
  index.ts          → app entrypoint (Express + HTTP server + Socket.IO attached together)
```

### 2.8 Environment variables
**`.env.example`** (commit this; never commit the real `.env`):
```
DATABASE_URL=postgresql://user:password@localhost:5432/hammr
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
FRONTEND_ORIGIN=http://localhost:3000
PORT=4000
```

---

## 3. Optional but Recommended: Pre-Commit Hooks (Husky + lint-staged)

Do this in **both** repos so bad formatting/lint errors never even get committed:
```bash
npm install -D husky lint-staged
npx husky init
```
**`package.json`:**
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```
**`.husky/pre-commit`:**
```bash
npx lint-staged
```

---

## 4. Git Setup (Both Repos)

**`.gitignore`** (Node.js base, add these on top of the standard template):
```
node_modules
.env
.env.local
.next
dist
build
```

Make your **first commit** right after this initial setup is done (empty scaffold + configs), before writing any feature code — gives you a clean starting point in your commit history, which matters for the Git practices requirement in `03-security-and-practices.md`.

---

## 5. Order of Operations (Do This Before Day 1 of `11-mvp-build-plan.md`)

1. Set up Docker Compose (or cloud Postgres/Redis) locally.
2. Scaffold `hammr-frontend` (Section 1), commit.
3. Scaffold `hammr-backend` (Section 2), commit.
4. Add Husky + lint-staged to both (Section 3), commit.
5. Confirm both `npm run dev` (frontend) and `npm run dev` (backend) start cleanly with no errors.
6. Confirm `npx prisma migrate dev` runs successfully against your local Postgres.
7. Only now start Day 1 feature work from `11-mvp-build-plan.md`.