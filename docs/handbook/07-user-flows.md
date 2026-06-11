# User Flows

The main end-to-end journeys. Screenshots are in `docs/user-flow/image/`.

---

## 1. Authentication

- **Landing (`/`)** — for signed-out users, a promo/landing page with animated
  hero and CTAs: **Sign in** → `/auth/signin`, **Contact us** → `/contacts`.
- **Session guard** — NextAuth (v4); `useSession()` on the client, plus
  `getServerSession` on protected pages. Hitting a private page without a
  session redirects to `/auth/signin` (preserving the destination).
- **Sign in (`/auth/signin`)** — `signIn('credentials', { email, password })`;
  the NextAuth route looks up the user in MongoDB and compares the hashed
  password. On success a session is issued and the user lands on `/`.
- **Sign up (`/auth/signup`)** — `POST /api/auth/sign-up`; checks the email is
  unique, hashes the password (`bcryptjs`), creates a `User` with default role
  `User`. Returns `201`, or `400` if the email exists.
- **Sign out** — `signOut()` clears the session and returns to the landing/sign-in.

> New users start as `User`. They become `DomainAdmin` only by being added to a
> `Domain.adminEmails` (e.g. by creating a domain). See
> [Roles & Permissions](./04-roles-and-permissions.md).

---

## 2. Dashboard & navigation

- **Layout** — left **sidebar** (Ant Design `Menu`), **header** with the user
  avatar, and the main content area.
- **Menu is role-based:**
  - Everyone: **Payments** (`/payment`), **Companies** (`/real-estate`),
    **Service Providers** (`/domain`), **Services** (`/service`), **Profile**
    (`/profile`).
  - Admins only (`isAdminCheck`): **Bank** (`/bank`), **Profits** (`/profit`).
- **Onboarding tour** (`DashboardTour`, `antd.Tour`):
  - On load, checks `localStorage["dashboardTourSeen_<email>"]`.
  - If missing, auto-starts after ~1.2s; on finish/close the flag is saved.
  - Can be re-triggered manually (`isManualStart`).
  - Steps walk through Payments → Companies → Service Providers → Services →
    Profile (menu + avatar), then Bank/Profits for admins.
- **Widgets** — active tasks, financial overview (profits + balance via
  `/api/profits/balance/[domainId]`), and quick actions to create payments/tasks.

---

## 3. Data setup (entities)

Done by a Global or Domain admin before billing can happen:

1. **Create Domain** (`/domain`) — name, currency, bank details (IBAN, bank,
   SWIFT), admin emails, footer/legal text. → `POST /api/domain`.
2. **Create Real Estate** (`/real-estate`) — company name, linked domain, street,
   contract description, billing details, admin emails (invoice recipients).
   → `POST /api/real-estate`.
3. **Configure Service / tariff** (`/service`) — pick provider + month, set
   tariffs (maintenance per m², electricity per kW, water per m³, garbage,
   inflation). → `POST /api/service`. This record is the month's price list.
4. **Streets** (`/streets`, `POST /api/streets`) and **Categories**
   (`/categories`, `POST /api/categories`) — helper entities for grouping and
   tagging.

---

## 4. Monthly billing cycle

**Goal:** generate a monthly debit (invoice) for a tenant from fixed tariffs +
variable meter readings. **Prereqs:** a Domain, a linked Real Estate company, and
a Service tariff sheet for the target month.

1. **Initiate** — on `/payment`, click **Add Payment**. The form stays disabled
   until the billing context is chosen.
2. **Context (cascading dropdowns)** — Domain (`GET /api/domain/admin`) → Street
   (`GET /api/filter/street?domainId=…`) → Month → Company
   (`GET /api/filter/real-estate?domainId=…&streetId=…`).
3. **Pre-computation** — the app loads the month's tariffs
   (`GET /api/service`) and the previous month's payment to seed the **last**
   meter readings (`GET /api/spacehub/payment?companyId=…&to=…`). No tariff sheet
   → the form stays disabled with a prompt to create one.
4. **Data entry + live calc** —
   - Variable services: enter the current meter reading; the UI computes
     `consumption = current − last` and `cost = consumption × price`.
   - Fixed services (rent, maintenance, garbage): pre-filled from area × tariff.
   - Manual override is allowed and flagged (`invoiceMeta.changed`) so it isn't
     overwritten.
5. **Review & save** — live total at the bottom; **Save** sends
   `POST /api/spacehub/payment` with the full line-item array. Server side: get
   the next invoice number, create the `Payment`, create a related `Profit`
   (`POST /api/profits`), and write a change-log entry.
6. **Validation** — client checks required context and warns on negative
   consumption (meter resets); the server re-validates permissions and entity
   links.
7. **Bulk (admins)** — select multiple companies in a domain and generate
   invoices at once via `POST /api/spacehub/payment/multiple`, then review each.
