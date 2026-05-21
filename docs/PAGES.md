### Pages Overview

This document gives a short description of the main user‑facing pages (Next.js routes). Paths are shown as URLs.

---

### Main & informational pages

- **`/` (home / dashboard)**
  - For authenticated users, shows the dashboard with widgets for tasks, payments, profits, domains, companies, etc.
  - For unauthenticated users, shows a landing/promo page.

- **`/docs` (in‑app documentation)**
  - Page with embedded documentation and a high‑level description of app capabilities.

- **`/contacts` (contacts)**
  - Informational page with contact details / feedback options.

- **`/404` (not found)**
  - Custom 404 page shown when a route does not exist.

---

### Authentication & profile

- **`/auth/signin` (sign in)**
  - User login form. Uses NextAuth for authentication.

- **`/auth/signup` (sign up)**
  - User registration page (if enabled). Uses API `pages/api/auth/sign-up`.

- **`/auth/verify-request` (email verification info)**
  - Informational page shown when the user must verify their email (NextAuth flow).

- **`/profile` (user profile)**
  - View and edit the current user profile, including:
    - personal data,
    - profile settings,
    - user feature flags (via modals and feature‑flag APIs).

---

### Tasks & workflow

> There is no separate `/tasks` page; task management is integrated into the dashboard and related sections.

- **Dashboard (part of `/`)**
  - Allows users to:
    - view task lists/cards,
    - create new tasks (via modal),
    - change status, assign executors, add comments,
    - attach files.
  - Integrates with APIs:
    - `pages/api/task/index.ts`,
    - `pages/api/task/[id]/*` (edit, status changes, comments, files).

---

### Payments, profit & finance

- **`/payment` (payments list)**
  - Main page for working with payments:
    - filtering by domains, companies, streets, services, dates,
    - viewing debit and credit operations,
    - calculating aggregated totals and balances.
  - Uses APIs:
    - `pages/api/spacehub/payment/index.ts`,
    - `pages/api/spacehub/payment/[id]/index.ts`,
    - helper endpoints for PDF/Excel export and invoice number generation.

- **`/payment/chart` (payment charts)**
  - Visualizations for payments (charts, graphs, trends).
  - Supports filters similar to `/payment`.

- **`/payment/bulk` (bulk payments)**
  - Page for bulk processing / uploading / editing multiple payments.
  - Uses APIs `pages/api/spacehub/payment/multiple/index.ts` and `pages/api/profits/bulk.ts` (if exposed in the UI).

- **`/payment/profit` (profit from payments)**
  - Connects payments with profit records.
  - Shows how payments affect final profit.

- **`/profit` (profit overview)**
  - Main profit analysis page:
    - tables and charts by domains,
    - grouping by months and time periods,
    - balance/saldo calculations.
  - Uses APIs `pages/api/profits/*` and `pages/api/profit/index.ts`.

---

### Real estate, domains, services & streets

- **`/domain` (domains / providers)**
  - Manage domains (service providers), their settings, tariffs, coverage areas.
  - Integrates with APIs:
    - `pages/api/domain/index.ts`,
    - `pages/api/domain/[id]/index.ts`,
    - `pages/api/domain/admin/index.ts`,
    - `pages/api/domain/areas/[id]/index.ts`.

- **`/real-estate` (real estate / companies)**
  - List of companies/real‑estate objects linked to domains and services.
  - Uses APIs `pages/api/real-estate/*` (including `/my` and id‑based endpoints).

- **`/service` (services)**
  - Directory of provided services (utility/service types).
  - Uses APIs `pages/api/service/index.ts` and `pages/api/custom-services/*`.

- **`/streets` (streets & addresses)**
  - Manage streets/addresses used in payments and tasks.
  - Uses APIs `pages/api/streets/index.ts`, `pages/api/streets/[id]/index.ts`, `pages/api/streets/search.ts`.

- **`/sepdomain` (per‑domain view)**
  - Specialized page that presents data per domain (e.g. a summary for a specific domain).

---

### Bank operations

- **`/bank` (bank transactions)**
  - Section for importing and analyzing bank transactions:
    - list and inspect transactions,
    - filter and search,
    - reconcile with internal payments.
  - Uses APIs:
    - `pages/api/bankapi/transactions/index.ts` (main listing),
    - `pages/api/bankapi/transactions/interim/index.ts`, `final/index.ts` – interim/final states,
    - `pages/api/bankapi/balances/index.ts` – balance calculations,
    - `pages/api/bankapi/date/index.ts` – available import dates.

---

### Administration & premium features

- **`/admin-panel` (admin panel)**
  - Accessible only to admin/global‑admin users.
  - May include:
    - user and role management,
    - domain/service/tariff management,
    - feature‑flag and system settings management.

- **`/premium` (premium section)**
  - Page for premium functionality or information about advanced features and plans.

---

### Additional technical/utility pages

- **`/dashboard/tables`**
  - Technical/utility page with dashboard‑related tables and widgets (may be used for debugging or as an alternate data view).

- **`/_app` and `/_document`**
  - Not user‑facing routes, but define:
    - global styles and providers (Redux, i18n, themes),
    - HTML document structure, meta tags, fonts, and PWA settings.

---

### How to maintain this documentation

- When the behaviour of a specific page changes:
  - update its short description and list of key actions here.
- When adding a new page:
  - add a new subsection with URL, purpose, and links to its main API routes and models.
