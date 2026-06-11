# Pages & Routes

User-facing Next.js routes at a glance. Route constants live in
`utils/constants.ts` (`AppRoutes`).

## Main & informational

| Route       | Purpose                                           |
| ----------- | ------------------------------------------------- |
| `/`         | Dashboard (authed) or landing/promo (signed out). |
| `/docs`     | In-app Swagger UI — the live API reference.       |
| `/contacts` | Contact / feedback info.                          |
| `/404`      | Custom not-found page.                            |

## Auth & profile

| Route                  | Purpose                                     |
| ---------------------- | ------------------------------------------- |
| `/auth/signin`         | Login (NextAuth credentials / OAuth).       |
| `/auth/signup`         | Registration → `POST /api/auth/sign-up`.    |
| `/auth/verify-request` | Email-verification info (NextAuth flow).    |
| `/profile`             | View/edit current user; user feature flags. |

## Payments, profit & finance

| Route             | Purpose                                                    |
| ----------------- | ---------------------------------------------------------- |
| `/payment`        | Payments list: filter, view debit/credit, totals/balances. |
| `/payment/chart`  | Payment charts and trends.                                 |
| `/payment/bulk`   | Bulk create/edit of payments.                              |
| `/payment/profit` | Link payments to profit records.                           |
| `/profit`         | Profit analysis by domain/month/period; balances.          |

## Real estate, domains, services & streets

| Route          | Purpose                                                |
| -------------- | ------------------------------------------------------ |
| `/domain`      | Manage service providers (domains), tariffs, coverage. |
| `/real-estate` | Companies / objects linked to domains.                 |
| `/service`     | Monthly service tariffs.                               |
| `/streets`     | Streets / addresses used by payments and tasks.        |
| `/sepdomain`   | Per-domain summary view.                               |

## Bank, admin & premium

| Route          | Purpose                                                    |
| -------------- | ---------------------------------------------------------- |
| `/bank`        | Import/inspect bank transactions; reconcile with payments. |
| `/admin-panel` | Admin-only: users/roles, domains/services, feature flags.  |
| `/premium`     | Premium features / plans.                                  |

## Non-user-facing

- `/_app`, `/_document` — global providers (Redux, i18n, theme) and the HTML
  shell / PWA settings.

> Tasks have **no** dedicated route — task management is embedded in the
> dashboard (`/`) and backed by `pages/api/task/**`.
