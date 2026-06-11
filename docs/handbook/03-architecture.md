# Architecture

A high-level map of how the app is built. For exact libraries and versions see
`.claudedocs/TECH_STACK.md`.

## System view

SpaceHub is a **monolithic Next.js app** (Pages Router) with three layers:

- **Frontend** — React + Ant Design dashboards and management UI.
- **API** — Next.js API routes under `pages/api/**`.
- **Data** — MongoDB via Mongoose models under `common/modules/models/**`.

Supporting subsystems: NextAuth authentication, email + PDF invoicing, bank
transaction import, scheduled jobs, i18n, and PWA.

```
Browser (React + Antd)
   │  RTK Query hooks
   ▼
Next.js API routes  (pages/api/**)
   │  getCurrentUser() + role checks
   ▼
Domain services  (common/services/**)
   │
   ▼
Mongoose models  (common/modules/models/**)  ──►  MongoDB
```

## Frontend

- **Entry:** `pages/_app.tsx` wraps every page with global providers (Redux
  store, RTK Query, i18n, theme). `pages/_document.tsx` defines the HTML shell,
  meta, fonts, and PWA headers.
- **Pages:** under `pages/*.tsx` (e.g. `/payment`, `/profit`, `/bank`, `/domain`,
  `/real-estate`, `/service`, `/streets`, `/auth/*`). See
  [Pages & Routes](./09-pages-and-routes.md).
- **Components:** `common/components/**` — `DashboardPage/**` (layout + widgets),
  `Pages/**` (page-level), `Tables/**` (reusable tables). UI kit is **Ant
  Design 5**; styling is **SCSS modules** co-located per component.

## State & data fetching

- **Redux Toolkit** for UI state (filters, widget layout, feature flags).
- **RTK Query** API slices under `common/api/**` (`paymentApi`, `domainApi`,
  `realEstateApi`, `serviceApi`, `bankApi`, …) define endpoints that call the
  Next.js API routes and expose hooks (`useGetAllPaymentsQuery`, …) with caching.

## Backend / API layer

- Handlers live in `pages/api/**`. The common pattern:
  1. validate HTTP method,
  2. ensure the DB connection (`connectToDatabase` / `start()` in
     `pages/api/api.config.ts`),
  3. resolve the user with `getCurrentUser(req, res)` and check roles,
  4. delegate business logic to a **service**, return typed JSON.
- Main API areas: tasks (`task/*`), payments (`spacehub/payment/*`), profits
  (`profits/*`, `profit/*`), domains (`domain/*`), real-estate
  (`real-estate/*`), services (`service/*`, `custom-services/*`), streets
  (`streets/*`), bank (`bankapi/*`), users/auth (`user/*`, `auth/*`), feature
  flags (`feature-flags/*`), and scheduled jobs (`sceduled/*`).

## Domain services

`common/services/**` keeps business logic out of route handlers:

- `paymentService/payment.service.ts` — builds Mongoose filters from query +
  roles, fetches payments with populated refs, computes totals, and on creation
  spins up a related `Profit` and triggers invoice email.
- `profitService/profit.service.ts` — grouping/aggregation of profits and
  balances.

Separation of concerns: **handlers** do HTTP I/O, **services** hold domain
rules, **models** handle persistence.

## Authentication & authorization

- **NextAuth** (`pages/api/auth/[...nextauth].ts`) with the MongoDB adapter;
  credentials sign-in plus GitHub/Google OAuth.
- Server-side pages use `getServerSession`; API routes use `getCurrentUser`.
- Roles are **derived from ownership** — see
  [Roles & Permissions](./04-roles-and-permissions.md).

## Other subsystems

- **Email & PDF:** `utils/email/sendInvoiceEmail.ts` (nodemailer) +
  `utils/pdf/**` (Puppeteer/headless Chrome). Invoices are emailed when creating
  debit payments.
- **Bank:** `pages/api/bankapi/**` imports transactions and computes balances for
  the `/bank` page and payment reconciliation.
- **Scheduled jobs:** `pages/api/sceduled/{daily,hourly,threeTimesDaily,quater}`
  are plain HTTP endpoints meant to be hit by an external scheduler.
- **i18n & PWA:** `next-i18next` (`next-i18next.config.js`, `common/lib/i18n.ts`)
  and `next-pwa` (configured in `next.config.js`, enabled in production).

## Testing

Jest + Testing Library, tests co-located with code (`*.test.ts(x)`), integration
tests in `tests/` using `mongodb-memory-server` and `msw`. See
[Contributing](./11-contributing.md) for conventions.

## Typical request flow

1. User opens `/payment`; the page calls `GET /api/spacehub/payment` via RTK Query.
2. The route ensures the DB connection, resolves the user/roles, and calls
   `paymentService.getPayments`.
3. The service builds queries/aggregation pipelines, fetches and transforms data.
4. The route returns JSON; RTK Query caches it and re-renders components.
