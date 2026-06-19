# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Next.js 16 (App Router) + React 19 mock retail-banking app built for the "Hack To Night 2026" challenge (`package.json` name: `hack-to-night-2026-challenge`). It models users, accounts, transactions, and an audit log over Postgres. The seeded demo data (`lib/platform-db.ts`) includes deliberately suggestive content (e.g. a `Totally normal fee` transfer, an `Admin Vault` account) — treat this as a security challenge codebase, not a production app.

## Commands

The intended dev workflow runs everything in Docker (app + Postgres):

```bash
cp .env.example .env.local   # then fill in POSTGRES_*, DATABASE_URL, SESSION_SECRET
docker compose up --build --watch
```

Both services read `.env.local`. `compose.yml` syncs the working tree into the container and rebuilds on `package.json` / `bun.lock` changes. The app is on `localhost:3000`, Postgres on `localhost:5432`.

The image uses **Bun** (`oven/bun`); the lockfile is `bun.lock`. `package-lock.json` also exists but Bun is canonical.

Local (non-Docker) scripts:

- `bun run dev` — Next dev server (uses `--webpack`, not Turbopack). Requires a reachable `DATABASE_URL` and `SESSION_SECRET`.
- `bun run build` / `bun run start` — production build / serve.
- `bun run lint` — `biome check`.
- `bun run format` — `biome format --write`.

There is **no test suite** in this repo.

### Lint/format specifics (`.biome.json`)

Biome's linter and general formatter are **disabled**; only the JavaScript/TS formatter is on, with: 2-space indent, **single quotes**, **semicolons "asNeeded"** (omit them), **no trailing commas**. Match this style — it differs from typical defaults. A Lefthook `pre-commit` hook auto-formats staged files via `bunx biome format`.

## Architecture

### Auth & session model (the core invariant)

Sessions are **stateless, HMAC-signed tokens** — there is no session table. A token is `base64url(JSON{userId, role, exp}) + "." + HMAC-SHA256(body)`, stored in an `HttpOnly; Secure; SameSite=Lax` cookie named `session` (`lib/auth.ts`). `SESSION_SECRET` signs them; both `lib/auth.ts` and `lib/platform-db.ts` throw at import time if their required env vars are missing.

Verification happens in **two layers**:

1. `middleware.ts` runs on the **Edge runtime**, so it reimplements HMAC verification with **Web Crypto** (`crypto.subtle`) rather than `node:crypto`. It gates the matched routes (see its `config.matcher`) and enforces `role === 'admin'` for `/api/admin/*`. Any change to the token format must be mirrored in both `lib/auth.ts` (Node) and `middleware.ts` (Edge).
2. Each protected API route **re-verifies** via `getSession(request)` and returns 401 itself — defense in depth, not redundant. Do not remove the per-route check just because middleware exists.

**Identity always comes from the verified session, never from request input.** Routes derive `userId` from `session.userId` and scope every query to it (see `app/api/accounts/route.ts`, `transactions/route.ts`, `search/route.ts`). Preserve this when adding endpoints.

Passwords and account PINs are hashed with **scrypt** (`scrypt$salt$hash` format) and compared with `timingSafeEqual`. PINs are never returned to the client.

### Database layer (`lib/platform-db.ts`)

- A single `pg` `Pool` is the only DB access point. The schema (CREATE TABLE IF NOT EXISTS) and demo seed data are defined inline and applied **lazily** by `ensureDatabase()` — a memoized boot promise that runs on the first query and re-tries on failure. There are no migration files; schema changes go in the `schema` constant.
- `runStatement(sql, params)` calls `ensureDatabase()` then `pool.query`. **Always use `$1, $2` placeholders** — never interpolate user input into SQL. For multi-statement transactions, grab `pool.connect()` and `BEGIN`/`COMMIT`/`ROLLBACK` directly (see the transfer route).
- `serviceFailure(reason)` logs server-side and returns a generic 500 — use it in every route's `catch` so internals never leak. `asText(value)` safely coerces untrusted input to a string.

### Money transfers (`app/api/transfer/route.ts`)

The reference pattern for mutations: validate input (positive amount, ≤ `MAX_AMOUNT`, ≤ 2 decimals, distinct accounts), then in a transaction debit with a single guarded `UPDATE ... WHERE account_number = $ AND user_id = $ AND balance >= $`. `rowCount === 0` on the debit means "not owner OR insufficient funds" — both ownership and balance are enforced atomically in SQL, then credit + insert the transaction row, then COMMIT.

### API response convention

Every JSON response uses `{ ok: boolean, message?: string, ... }`. Success returns `ok: true` plus payload; failures return `ok: false` with a user-safe `message` and an appropriate status (400/401/403/500).

### Frontend

App Router under `app/`. Route groups: `(accounts)` holds the public auth pages (login, sign-up, reset-password) with their own `layout.tsx`; the banking features (`dashboard`, `bank-accounts`, `bank-transfer`, `e-statement`, `pay-bills`, `smart-spend`) are session-gated by middleware. Path alias `@/*` maps to the repo root (`tsconfig.json`). Styling is Tailwind v4 (via `@tailwindcss/postcss`) plus per-feature CSS modules. Shared UI lives in `components/`.

> Note: there are stray top-level `layout.tsx`, `page.tsx` files at the repo root alongside the canonical `app/` versions — the App Router uses the ones under `app/`.
