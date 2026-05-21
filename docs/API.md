### API Overview

This file is a concise, lowercase‑named companion to `docs/API.md`.  
For full details (including example payloads and all endpoints), see `docs/API.md`.

Below is a high‑level summary of the main API groups.

---

### Authentication

- `POST /api/auth/sign-up` – register a new user.
- `/api/auth/[...nextauth]` – NextAuth routes (sign in/out, callbacks, sessions).

---

### Users & profile

- `GET /api/user/current` – current user with roles and domain context.
- `GET /api/user` – list users (admin only).
- `GET /api/user/[id]`, `PATCH /api/user/[id]` – get/update specific user.
- `POST /api/user/[id]/feedback` – submit feedback.
- `GET /api/user/email/[email]` – lookup user by email.
- `POST /api/updateprofile` – update own profile.

---

### Feature flags

- `GET /api/feature-flags` – list feature flags.
- `GET /api/feature-flags/by-name/[name]` – get flag by name.
- `GET /api/feature-flags/[id]`, `PATCH /api/feature-flags/[id]` – get/update flag by id.

---

### Tasks

- `GET /api/task` – list tasks with filters.
- `POST /api/task` – create a new task.
- `GET /api/task/[id]` – task details.
- `PATCH /api/task/[id]/edit-task` – update task fields.
- `POST /api/task/[id]/change-status-task` – change status.
- `POST /api/task/[id]/apply` – apply for a task.
- `POST /api/task/[id]/accept` – accept task result/assignment.
- `POST /api/task/[id]/comment` – add a task comment.
- `POST /api/task/add-file` – upload and attach a file.

---

### Payments

Base path: `/api/spacehub/payment`.

- `GET /api/spacehub/payment` – list payments with filters and aggregates.
- `POST /api/spacehub/payment` – create a payment (may trigger invoice email).
- `GET /api/spacehub/payment/[id]`, `PATCH /api/spacehub/payment/[id]` – get/update payment.
- `GET /api/spacehub/payment/[id]/change-log` – payment change log.
- `POST /api/spacehub/payment/multiple` – bulk operations.
- `GET /api/spacehub/payment/number` – next invoice number.
- `POST /api/spacehub/payment/generatePdf` – generate invoice PDF.
- `POST /api/spacehub/payment/generateExcel` – export payments to Excel.

---

### Profits

- `GET /api/profits` – list profits.
- `POST /api/profits` – create profit entry.
- `GET /api/profits/[id]` – single profit.
- `GET /api/profits/domain/[domainId]` – profits per domain.
- `GET /api/profits/balance/[domainId]` – domain balance.
- `POST /api/profits/bulk` – bulk profit operations.
- `GET /api/profit` – high‑level profit overview.

---

### Domains, real estate, services, categories

- **Domains**
  - `GET/POST /api/domain` – list/create domains.
  - `GET/PATCH/DELETE /api/domain/[id]` – CRUD for a domain.
  - `GET /api/domain/admin` – domains for current admin.
  - `GET /api/domain/areas/[id]` – domain coverage areas.

- **Real estate**
  - `GET/POST /api/real-estate` – list/create real‑estate objects.
  - `GET/PATCH/DELETE /api/real-estate/[id]` – CRUD for a single object.
  - `GET /api/real-estate/my` – real‑estate assigned to current user/domain.

- **Services**
  - `GET/POST /api/service` – list/create services.
  - `GET/PATCH/DELETE /api/service/[id]` – CRUD.
  - `GET /api/service/address` – helper for service‑address mapping.
  - `/api/custom-services/*` – domain‑specific/custom services.

- **Categories**
  - `GET/POST /api/categories` – list/create categories.
  - `GET/PATCH/DELETE /api/categories/[id]` – CRUD for categories.

---

### Streets

- `GET/POST /api/streets` – list/create streets.
- `GET/PATCH/DELETE /api/streets/[id]` – CRUD for a street.
- `GET /api/streets/search` – search streets (autocomplete).

---

### Bank API

Base path: `/api/bankapi`.

- `GET /api/bankapi/transactions` – list transactions.
- `GET /api/bankapi/transactions/interim` – interim transactions.
- `GET /api/bankapi/transactions/final` – finalized transactions.
- `GET /api/bankapi/balances` – balances per account/domain.
- `GET /api/bankapi/date` – available dates for bank data.

---

### Notifications, debtors, filtering

- `POST /api/notify`, `POST /api/notify/[id]` – send/update notifications.
- `POST /api/callback` – generic callback/webhook.
- `GET /api/debtors` – list debtors.
- `GET /api/filter/date` – date filter presets.
- `GET /api/filter/domain` – domain filter helper.
- `GET /api/filter/real-estate` – real‑estate filter helper.
- `GET /api/filter/street` – street filter helper.

---

### Scheduled (cron‑like) endpoints

- `GET /api/sceduled/daily` – daily jobs.
- `GET /api/sceduled/hourly` – hourly jobs.
- `GET /api/sceduled/threeTimesDaily` – three‑times‑daily jobs.
- `GET /api/sceduled/quater` – quarterly‑like jobs.

These are meant to be called by an external scheduler (cron, platform scheduler).

### API Overview

This document describes the main HTTP API routes exposed by the Task Monitoring App.  
All routes live under Next.js API folder `pages/api/**` and are mounted under `/api/**`.

- **Base URL (local)**: `http://localhost:3000/api`
- **Auth**: most endpoints require an authenticated user (NextAuth session / JWT).
- **Format**: JSON in request and response bodies (unless otherwise noted).

> Note: field names and exact response shapes are simplified here for documentation purposes; consult the corresponding `pages/api/**` and `common/modules/models/**` files for full details.

---

### Authentication

- **`POST /api/auth/sign-up`**
  - **Purpose**: register a new user.
  - **Body (example)**: `{ email, password, name, ... }`
  - **Response**: created user or error description.

- **`/api/auth/[...nextauth]`**
  - **Purpose**: NextAuth routes (sign in, sign out, callbacks, sessions).
  - **Usage**: normally used via NextAuth client helpers on the frontend, not directly.

---

### Users & Profile

- **`GET /api/user/current`**
  - **Purpose**: get current authenticated user data and roles.
  - **Response (example)**: `{ id, email, name, roles: [ 'USER', 'DOMAIN_ADMIN', ... ], domainId, ... }`

- **`GET /api/user`**
  - **Purpose**: list users (admin‑only).

- **`GET /api/user/[id]`**
  - **Purpose**: get a specific user by id.

- **`PATCH /api/user/[id]`**
  - **Purpose**: update user fields (admin or owner, depending on logic).

- **`POST /api/user/[id]/feedback`**
  - **Purpose**: submit feedback linked to a user.

- **`GET /api/user/email/[email]`**
  - **Purpose**: lookup user by email (admin or internal usage).

- **`POST /api/updateprofile`**
  - **Purpose**: update current user profile data (name, contacts, etc.).

---

### Feature Flags

- **`GET /api/feature-flags`**
  - **Purpose**: list feature flags (for admin UI and client gating).

- **`GET /api/feature-flags/by-name/[name]`**
  - **Purpose**: fetch a single feature flag by name.

- **`GET /api/feature-flags/[id]` / `PATCH /api/feature-flags/[id]`**
  - **Purpose**: get or update a feature flag by id.

---

### Tasks

- **`GET /api/task`**
  - **Purpose**: list tasks with filters (domain, executor, status, date range, etc.).
  - **Query (examples)**: `?status=OPEN&domainId=...&executorId=...`

- **`POST /api/task`**
  - **Purpose**: create a new task.
  - **Body (example)**:
    ```json
    {
      "title": "Fix heating issue",
      "description": "No heating in apartment 12",
      "domainId": "...",
      "realEstateId": "...",
      "categoryId": "...",
      "dueDate": "2026-03-20T00:00:00.000Z",
      "executors": ["userId1", "userId2"]
    }
    ```

- **`GET /api/task/[id]`**
  - **Purpose**: get task details by id (including comments, executors, history).

- **`PATCH /api/task/[id]/edit-task`**
  - **Purpose**: update task fields (title, description, category, dates, etc.).

- **`POST /api/task/[id]/change-status-task`**
  - **Purpose**: change task status (e.g., OPEN → IN_PROGRESS → DONE).
  - **Body**: `{ status: 'NEW_STATUS', comment?: 'Optional status change comment' }`

- **`POST /api/task/[id]/apply`**
  - **Purpose**: apply for a task / mark interest (depending on business rules).

- **`POST /api/task/[id]/accept`**
  - **Purpose**: accept a task assignment or result (domain‑admin/manager).

- **`POST /api/task/[id]/comment`**
  - **Purpose**: add a comment to a task.
  - **Body**: `{ text: 'Comment text', files?: [fileId, ...] }`

- **`POST /api/task/add-file`**
  - **Purpose**: upload and attach a file to a task.
  - **Body**: multipart/form‑data with file and metadata.

---

### Payments

All payments APIs live under `/api/spacehub/payment`.

- **`GET /api/spacehub/payment`**
  - **Purpose**: list payments with rich filters and aggregated totals.
  - **Common query params**:
    - `from`, `to` – date range.
    - `domainId`, `realEstateId`, `companyId`, `streetId`, `serviceId`.
    - `type` – debit/credit.
    - `search` – free‑text search by invoice number, notes, etc.
  - **Response (simplified)**:
    ```json
    {
      "data": [ /* payments */ ],
      "meta": {
        "totalCount": 123,
        "domains": [...],
        "companies": [...],
        "totals": {
          "credit": 10000,
          "debit": 8000,
          "balance": 2000
        }
      }
    }
    ```

- **`POST /api/spacehub/payment`**
  - **Purpose**: create a new payment record.
  - **Body (example)**:
    ```json
    {
      "domainId": "...",
      "realEstateId": "...",
      "companyId": "...",
      "serviceId": "...",
      "date": "2026-03-16",
      "amount": 1200,
      "type": "DEBIT",
      "invoiceNumber": "2026-0001",
      "description": "Heating for March"
    }
    ```
  - **Side effects**:
    - creates a related Profit record (via profit service),
    - for debit payments may trigger invoice PDF generation and email sending.

- **`GET /api/spacehub/payment/[id]`**
  - **Purpose**: get single payment details (including relations, logs).

- **`PATCH /api/spacehub/payment/[id]`**
  - **Purpose**: update payment (amount, description, links, etc.) if allowed.

- **`GET /api/spacehub/payment/[id]/change-log`**
  - **Purpose**: retrieve audit/change log for a payment.

- **`POST /api/spacehub/payment/multiple`**
  - **Purpose**: bulk operations on payments (create/update multiple at once).

- **`GET /api/spacehub/payment/number`**
  - **Purpose**: get next invoice/payment number (auto‑increment logic).

- **`POST /api/spacehub/payment/generatePdf`**
  - **Purpose**: generate invoice PDF for one or more payments.

- **`POST /api/spacehub/payment/generateExcel`**
  - **Purpose**: export payments to Excel.

- **`GET /api/spacehub/payment/pipelines`** (internal module)
  - MongoDB aggregation pipelines used by the service (not a direct route, but important for understanding totals logic).

---

### Profits

- **`GET /api/profits`**
  - **Purpose**: list profits, optionally filtered by domain, date, etc.

- **`POST /api/profits`**
  - **Purpose**: create a profit record (usually done indirectly via payment creation).

- **`GET /api/profits/[id]`**
  - **Purpose**: get single profit entry.

- **`GET /api/profits/domain/[domainId]`**
  - **Purpose**: profits for a specific domain, often grouped by month.

- **`GET /api/profits/balance/[domainId]`**
  - **Purpose**: compute balance (profit/loss) for a domain.

- **`POST /api/profits/bulk`**
  - **Purpose**: bulk upsert or adjust profit records (used by admin tools).

- **`GET /api/profit`**
  - **Purpose**: high‑level profit overview endpoint, used by `/profit` page.

---

### Domains

- **`GET /api/domain`**
  - **Purpose**: list all domains (service providers).

- **`POST /api/domain`**
  - **Purpose**: create a new domain (admin only).

- **`GET /api/domain/[id]` / `PATCH /api/domain/[id]` / `DELETE /api/domain/[id]`**
  - **Purpose**: get, update or delete a specific domain.

- **`GET /api/domain/admin`**
  - **Purpose**: domains accessible to the current domain admin.

- **`GET /api/domain/areas/[id]`**
  - **Purpose**: get domain areas / coverage (e.g., list of streets/zones).
  - Includes validation logic via `pages/api/domain/areas/[id]/validator.ts`.

---

### Real Estate (Companies / Objects)

- **`GET /api/real-estate`**
  - **Purpose**: list real‑estate objects/companies with filters.

- **`POST /api/real-estate`**
  - **Purpose**: create a new real‑estate record.

- **`GET /api/real-estate/[id]` / `PATCH /api/real-estate/[id]` / `DELETE /api/real-estate/[id]`**
  - **Purpose**: CRUD operations for a specific real‑estate entity.

- **`GET /api/real-estate/my`**
  - **Purpose**: real‑estate objects linked to the current user or domain.

---

### Services

- **`GET /api/service` / `POST /api/service`**
  - **Purpose**: list or create services (e.g., electricity, heating, water).

- **`GET /api/service/[id]` / `PATCH /api/service/[id]` / `DELETE /api/service/[id]`**
  - **Purpose**: CRUD operations for a service.

- **`GET /api/service/address`**
  - **Purpose**: helper endpoint to resolve addresses linked to services.

- **`/api/custom-services/*`**
  - Additional endpoints for domain/real‑estate‑specific custom services.

---

### Streets & Addresses

- **`GET /api/streets` / `POST /api/streets`**
  - **Purpose**: list all streets or create a new street.

- **`GET /api/streets/[id]` / `PATCH /api/streets/[id]` / `DELETE /api/streets/[id]`**
  - **Purpose**: CRUD operations for a street record.

- **`GET /api/streets/search`**
  - **Purpose**: search streets by name / partial match (used in autocomplete).

---

### Categories

- **`GET /api/categories` / `POST /api/categories`**
  - **Purpose**: list or create task/expense categories.

- **`GET /api/categories/[id]` / `PATCH /api/categories/[id]` / `DELETE /api/categories/[id]`**
  - **Purpose**: CRUD operations for a category.

---

### Bank Integration

Under `/api/bankapi/*`.

- **`GET /api/bankapi/transactions`**
  - **Purpose**: list bank transactions (possibly merged from several imports).
  - **Filters**: date range, account, status, domain, etc.

- **`GET /api/bankapi/transactions/interim`**
  - **Purpose**: interim (work‑in‑progress) transactions.

- **`GET /api/bankapi/transactions/final`**
  - **Purpose**: finalized transactions used for reconciliation.

- **`GET /api/bankapi/balances`**
  - **Purpose**: get bank balances by account/domain.

- **`GET /api/bankapi/date`**
  - **Purpose**: list dates for which bank data is available.

> Internal utilities (`.../utils/getTransactions`, `.../utils/getBankDates`, `.../utils/getBalances`) encapsulate parsing and calculations, but are not public endpoints.

---

### Notifications & Callbacks

- **`POST /api/notify` / `POST /api/notify/[id]`**
  - **Purpose**: send or update notifications (email/other channels) for entities like tasks or payments.

- **`POST /api/callback`**
  - **Purpose**: generic callback endpoint (e.g., for external services/webhooks).

---

### Debtors & Filtering Helpers

- **`GET /api/debtors`**
  - **Purpose**: list debtors (companies/domains/entities with outstanding balance).

- **`GET /api/filter/date`**
  - **Purpose**: helper for date filter presets (e.g., last month, quarter).

- **`GET /api/filter/domain`**
  - **Purpose**: helper to filter by domain (for dropdowns, etc.).

- **`GET /api/filter/real-estate`**
  - **Purpose**: helper to filter by real‑estate.

- **`GET /api/filter/street`**
  - **Purpose**: helper to filter by street.

---

### Scheduled (Cron‑like) Endpoints

Under `/api/sceduled/*`.

- **`GET /api/sceduled/daily`**
  - **Purpose**: run daily job(s) – e.g., recalculate aggregates, send summaries.

- **`GET /api/sceduled/hourly`**
  - **Purpose**: run hourly tasks (short‑term calculations, cleanups).

- **`GET /api/sceduled/threeTimesDaily`**
  - **Purpose**: run jobs three times a day.

- **`GET /api/sceduled/quater`**
  - **Purpose**: quarterly (or quarter‑like) reports/aggregations.

> These endpoints are meant to be triggered by an external scheduler (e.g., cron, platform scheduler) and are not usually called from the UI.

---

### Testing & Docs Helpers

- **`GET /api/doc`**
  - **Purpose**: internal documentation helper (used by `/docs` UI page).

- **`/api/**.test.ts`\*\*
  - Jest test files are colocated with API routes (e.g., `spacehub/payment/payment.test.ts`) and are **not** exposed as HTTP endpoints.

---

### Conventions & Notes

- **HTTP Methods**
  - `GET` – read/list resources.
  - `POST` – create or trigger an action.
  - `PATCH` – partial update.
  - `DELETE` – deletion (where supported).

- **Error Handling**
  - Non‑2xx responses contain an error payload, typically:
    ```json
    {
      "error": "Error message",
      "details": { "field": "validation or domain-specific details" }
    }
    ```

- **Authorization**
  - Most routes:
    - reject unauthenticated requests with `401`,
    - enforce roles/domain restrictions, returning `403` when access is denied.

- **Id fields**
  - MongoDB ObjectIds are used (`_id` / `id`), usually serialized as strings in JSON.
