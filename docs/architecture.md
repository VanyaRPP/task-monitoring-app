### Architecture Overview

This document describes the high‑level architecture of the Task Monitoring App.

---

### 1. High‑level system view

The application is a **monolithic Next.js app** that contains:

- A **React frontend** for dashboards and management UI.
- A **backend API layer** implemented as Next.js API routes under `pages/api/**`.
- A **data layer** built on **MongoDB** with **Mongoose** models under `common/modules/models/**`.
- **Domain services** (e.g. payments, profits) located under `common/services/**`.
- Supporting subsystems:
  - **Authentication** via NextAuth.
  - **Email + PDF** invoicing subsystem.
  - **Bank integration** for importing transactions.
  - **Scheduled/cron‑like jobs** exposed as HTTP endpoints.

---

### 2. Frontend layer

- **Framework**: Next.js (pages router) with React.
- **Entry file**: `pages/_app.tsx`
  - Wraps all pages with global providers (Redux store, RTK Query, i18n, theme, etc.).
  - Integrates `appWithTranslation` for localization.
- **Document structure**: `pages/_document.tsx`
  - Custom HTML shell, meta tags, fonts, PWA headers, etc.
- **Routing & pages**:
  - UI pages live under `pages/*.tsx`:
    - `/` – dashboard / landing.
    - `/payment`, `/payment/chart`, `/payment/bulk`, `/payment/profit`.
    - `/profit`, `/bank`, `/domain`, `/real-estate`, `/service`, `/streets`.
    - `/auth/*`, `/profile`, `/admin-panel`, `/premium`, `/docs`, `/contacts`, etc.
- **UI components**:
  - Located under `common/components/**`.
  - Key groups:
    - `common/components/DashboardPage/**` – layout and widgets for the main dashboard.
    - `common/components/Pages/**` – page‑level components (Profile, Profit, BankTransactions, Settings, etc.).
    - `common/components/Tables/**` – reusable tables for payments, profits, bank data.
  - Uses **Ant Design** (Antd) for layout, forms, tables, modals, icons, and charts.

---

### 3. State management & data fetching

- **Redux Toolkit (RTK)**:
  - Global store defined in shared modules (under `common`).
  - Used for UI state such as filters, widget layouts, feature flags, etc.

- **RTK Query**:
  - API slices under `common/api/**`:
    - `taskApi`, `paymentApi`, `domainApi`, `realEstateApi`, `serviceApi`, `bankApi`, etc.
  - Responsibilities:
    - define endpoints that call Next.js API routes,
    - manage caching, loading and error states,
    - provide hooks (e.g. `useGetPaymentsQuery`, `useAddTaskMutation`) for components.

- **Data flow (frontend)**:
  1. User interacts with a page/component (filter changes, button click).
  2. Component calls an RTK Query hook (e.g. `useGetPaymentsQuery(params)` or mutation).
  3. RTK Query issues HTTP request to `/api/**`.
  4. The response is normalized/cached in the RTK Query store.
  5. Components re‑render with new data.

---

### 4. Backend/API layer

- **Location**: `pages/api/**`.
- **Pattern**:
  - Each file exports a handler function (`(req, res) => { ... }`).
  - Most handlers:
    - call a shared `start()` from `pages/api/api.config.ts` to ensure MongoDB connection,
    - use helper functions to get the current user (`getCurrentUser`) and roles,
    - delegate domain logic to **services** or Mongoose models.

- **Main API domains**:
  - **Tasks**: `pages/api/task/*`
  - **Payments**: `pages/api/spacehub/payment/*`
  - **Profits**: `pages/api/profits/*`, `pages/api/profit/index.ts`
  - **Domains**: `pages/api/domain/*`
  - **Real‑estate**: `pages/api/real-estate/*`
  - **Services & categories**: `pages/api/service/*`, `pages/api/custom-services/*`, `pages/api/categories/*`
  - **Streets**: `pages/api/streets/*`
  - **Bank**: `pages/api/bankapi/*`
  - **Users & auth helpers**: `pages/api/user/*`, `pages/api/auth/*`, `pages/api/updateprofile`
  - **Feature flags**: `pages/api/feature-flags/*`
  - **Filtering helpers, debtors, scheduled jobs**: `pages/api/filter/*`, `pages/api/debtors`, `pages/api/sceduled/*`

---

### 5. Data layer (MongoDB & Mongoose)

- **Connection**:
  - Centralized in `pages/api/api.config.ts`, which:
    - connects to MongoDB using `MONGODB_URI`,
    - ensures models are registered once in the Mongoose connection.

- **Models** (under `common/modules/models/**`):
  - `Task` – tasks with domain, real‑estate, executors, comments, files and status.
  - `Payment` – payments (debit/credit) with links to domain, real‑estate, company, service.
  - `Profit` – profit records linked to payments and domains.
  - `Domain` – service providers / management entities.
  - `RealEstate` – buildings/companies/objects.
  - `Service` – provided services (heating, water, etc.).
  - `User` – users with roles and permissions.
  - Additional models as needed (categories, streets, feature flags, etc.).

- **Aggregations**:
  - Complex reporting (totals, balances, grouped profits) is implemented using MongoDB aggregation pipelines.
  - Examples:
    - `pages/api/spacehub/payment/pipelines.ts` – credit/debit totals, invoice sums.
    - `common/services/profitService/**` – domain/month‑grouped profits and balances.

---

### 6. Domain services

- **Location**: `common/services/**`.
- **Examples**:
  - `paymentService/payment.service.ts`:
    - builds Mongoose filters based on query params and user roles,
    - fetches payments with populated references,
    - calculates totals and metadata,
    - on creation, creates a related `Profit` entry and triggers invoice email sending.
  - `profitService/profit.service.ts`:
    - encapsulates logic for retrieving, grouping and calculating profits and balances.

- **Purpose**:
  - Keep **business logic** out of API route handlers.
  - Provide a clear separation:
    - API handlers: input/output, HTTP concerns.
    - Services: domain logic, rules, derived values.
    - Models: persistence and schema.

---

### 7. Authentication & authorization

- **Framework**: NextAuth.
- **Config**: `pages/api/auth/[...nextauth].ts`.
  - Uses MongoDB adapter for persisting sessions.
  - Supports credentials‑based auth and possibly email magic links (depending on config).

- **Session usage**:
  - Server‑side:
    - `getServerSession` in `getServerSideProps` protects pages like `/payment`, `/profit`, etc.
  - API routes:
    - helper `getCurrentUser(req, res)` reads session and loads user with roles.

- **Roles & permissions**:
  - Role constants defined in `utils/constants.ts` (e.g. `Roles.USER`, `Roles.DOMAIN_ADMIN`, `Roles.GLOBAL_ADMIN`).
  - Services and API routes:
    - restrict operations based on roles (e.g. only admins can create domains, only domain admins see specific financial data).

---

### 8. Email & PDF subsystem

- **Email sending**:
  - Implemented in `utils/email/sendInvoiceEmail.ts` using `nodemailer`.
  - Reads SMTP configuration from environment variables.
  - Sends out invoice PDFs to domain/company recipients.

- **PDF generation**:
  - Uses helpers under `utils/pdf/bufferGenerators` (or similar) to:
    - take extended payment data (`IExtendedPayment`),
    - generate a PDF buffer (often via `puppeteer`/headless Chrome).

- **Integration with payments**:
  - `createPayment` in `paymentService` calls `sendInvoiceEmail` when creating **debit** payments that require invoices.
  - Errors can be logged without breaking the overall payment creation, depending on configuration.

---

### 9. Bank integration

- **API routes**: `pages/api/bankapi/**`
  - `transactions` – list/import transactions.
  - `balances` – compute balances per account/domain.
  - `date` – available transaction dates.

- **Internal utilities**:
  - Located under `pages/api/bankapi/**/utils/**`, encapsulating:
    - parsing bank statements,
    - merging transactions,
    - calculating balances.

- **Responsibility**:
  - Provide data for the `/bank` UI page and help reconcile internal payments with external bank data.

---

### 10. Scheduled / cron‑like jobs

- **Location**: `pages/api/sceduled/*`.
- **Endpoints**:
  - `daily`, `hourly`, `threeTimesDaily`, `quater`.

- **Usage**:
  - Intended to be called by:
    - cron jobs,
    - a platform scheduler (e.g. Heroku Scheduler),
    - or an external orchestrator.
  - Typical responsibilities:
    - recompute aggregates and balances,
    - clean up temporary data,
    - send summary notifications.

---

### 11. Internationalization & PWA

- **i18n**:
  - Uses `next-i18next` and related libs.
  - Config file: `next-i18next.config.js`.
  - Initialization in `common/lib/i18n.ts` and applied in `_app.tsx`.

- **PWA**:
  - Uses `next-pwa`.
  - Configured in `next.config.js`:
    - generates a service worker and manifest.
    - PWA typically disabled in development and enabled in production.

---

### 12. Testing

- **Unit / integration tests**:
  - Jest and Testing Library.
  - Tests often colocated with code:
    - e.g. `pages/api/**.test.ts`, `common/components/**.test.ts`.

- **End‑to‑end tests**:
  - Playwright located under `e2e/` (e.g. `e2e/tests/**`).
  - Use `yarn test:e2e` and `yarn test:e2e:watch`.

---

### 13. Typical request flow

1. **User opens a page** (e.g., `/payment`).
2. Page component uses RTK Query to call a Next.js API route (e.g., `GET /api/spacehub/payment`).
3. The API route:
   - ensures DB connection via `start()` from `api.config.ts`,
   - loads the current user and roles,
   - calls the appropriate domain service (e.g., `paymentService.getPayments`).
4. The service:
   - builds MongoDB queries and aggregation pipelines,
   - fetches and transforms data,
   - returns DTOs to the API route.
5. The API route:
   - serializes data to JSON and sends HTTP response.
6. RTK Query:
   - caches the response and updates the React components.
