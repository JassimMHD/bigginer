# 02 — Architecture

## The Four-Layer Request Pipeline

Every HTTP request that reaches a protected route travels through four layers. Each layer has one job.

```
┌─────────────────────────────────────────────────────────────┐
│  Browser / Client                                           │
│  Sends cookies automatically on every same-origin request  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS request + "session=<token>" cookie
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Edge Middleware  (middleware.ts)                         │
│  • Runs on Vercel Edge / Next.js Edge Runtime               │
│  • Uses Web Crypto (crypto.subtle) — no Node.js APIs        │
│  • Reads session cookie, verifies HMAC-SHA256 signature     │
│  • Checks token expiry                                      │
│  • If invalid: returns 401 (API) or redirect to /login (UI) │
│  • If /api/admin/* and role !== 'admin': returns 403        │
│  • If valid: passes request through                         │
└────────────────────────┬────────────────────────────────────┘
                         │ Request passes to route handler
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  2. API Route Handler  (app/api/*/route.ts)                  │
│  • Thin Next.js handler — just exports GET/POST/PUT/DELETE  │
│  • Delegates immediately to a Controller function           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Controller  (lib/controllers/*.controller.ts)           │
│  • Re-verifies session via getSession(request)              │     ← defense in depth
│  • Coerces raw request input with asText() / Number()       │
│  • Calls Service function(s)                                │
│  • Catches domain errors (AuthError, TransactionError)      │
│  • Maps errors to HTTP status codes                         │
│  • Calls serviceFailure() for unexpected errors             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Service  (lib/services/*.service.ts)                    │
│  • Business rules: validation, limits, ownership checks     │
│  • Orchestrates multiple Model calls                        │
│  • Manages Postgres transactions (BEGIN/COMMIT/ROLLBACK)    │
│  • Throws typed errors (AuthError / TransactionError)       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Model  (lib/models/*.model.ts)                          │
│  • Pure SQL functions — no business logic                   │
│  • Always uses $1, $2 … placeholders                        │
│  • Accepts either a pool client (for transactions) or calls │
│    runStatement() (for standalone queries)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL 17  (via pg Pool)                               │
│  • Single pool, max 10 connections                          │
│  • Schema applied lazily by ensureDatabase() on first use   │
└─────────────────────────────────────────────────────────────┘
```

---

## Module Dependency Graph

```
middleware.ts
  └── (standalone — only uses Web Crypto, no lib imports)

app/api/*/route.ts
  └── lib/controllers/*.controller.ts
        ├── lib/auth.ts          (getSession, sessionCookie, clearSessionCookie)
        ├── lib/platform-db.ts   (asText, serviceFailure)
        ├── lib/activity.ts      (extractClientInfo)
        ├── lib/services/        (business logic)
        │     ├── lib/models/    (SQL)
        │     │     └── lib/platform-db.ts  (runStatement, pool)
        │     └── lib/auth.ts    (hashPassword, verifyPassword, createSession)
        └── lib/services/activity.service.ts
              └── lib/models/activity.model.ts

lib/platform-db.ts
  └── lib/auth.ts  (hashPassword — used only during seeding)
```

---

## Why This Layering?

### Controllers are thin on purpose

Controllers only do two things: parse HTTP input (using `asText()` to safely coerce untrusted values) and translate thrown errors into HTTP responses. They contain **no** business logic. This means you can test a Service function with just plain function calls — no HTTP mocking needed.

### Services own all the rules

All validation, all limits, all ownership checks live in Services. If the transfer limit changes from Rs. 1,000,000 to Rs. 500,000, you change one line in `transaction.service.ts` — no other file needs updating.

### Models are SQL-only

Models accept either the shared pool (via `runStatement`) or a live `PoolClient` (when the caller is already inside a transaction). They never make decisions — they just run the query you give them and return rows.

### The double-verify pattern

```
middleware.ts           verifySession(token, secret)  ← Web Crypto, Edge Runtime
                                ↓ passes
lib/controllers/*.ts    getSession(request)            ← node:crypto, Node Runtime
```

These are two independent code paths. If middleware has a bug that lets a bad token through, the per-route `getSession()` call will catch it. If a developer adds a new route and forgets to check the session, middleware still blocks unauthenticated access. Both layers must pass.

---

## Route Groups (Next.js App Router)

Next.js route groups use folders named `(groupname)`. They affect layout nesting but NOT the URL path.

```
app/
├── (accounts)/          ← route group — uses accounts layout (dark gradient, orbs)
│   ├── login/
│   ├── sign-up/
│   └── reset-password/
├── dashboard/           ← uses root layout + Sidebar
├── bank-accounts/
├── bank-transfer/
├── e-statement/
├── pay-bills/
├── smart-spend/
├── activity/
└── profile/
```

The `(accounts)` group renders with a centered glassmorphic card layout. All banking pages render with the `Sidebar` component (navigation rail on desktop, bottom tab bar on mobile).

---

## Key Invariants (Never Break These)

1. **Identity always from session** — `userId` is read from the verified token, never from `req.body` or query params.
2. **SQL always parameterised** — `runStatement(sql, [val1, val2])` — never `runStatement("... WHERE id = " + id)`.
3. **Money changes inside a transaction** — debit and credit both happen in the same `BEGIN`/`COMMIT` block; a failure rolls back both.
4. **Errors never leak internals** — `serviceFailure()` logs server-side, returns `"Internal server error"` to the client.
5. **Passwords never returned** — the `password` and `pin` columns are never included in SELECT results sent to the client.
