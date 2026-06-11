# Local Setup

Get the app running on your machine for development.

## Prerequisites

- **Node.js 22.x** — pinned in `package.json` (`"engines": { "node": "22.x" }`).
  Use a version manager (`nvm`, `fnm`, `volta`) and confirm with `node -v`.
- **Yarn 1.22** (Classic) — the project uses Yarn, not npm, for installs.
- **MongoDB** — a local instance or a hosted cluster (e.g. MongoDB Atlas).
- Git and a modern browser.

## 1. Clone & install

```bash
git clone git@github.com:VanyaRPP/task-monitoring-app.git
cd task-monitoring-app
yarn install
```

## 2. Configure environment

Create `.env.local` in the project root (Next.js loads it automatically). The
table below lists the variables actually read from `process.env` in the code.

### Required

| Variable          | Used for                                                  |
| ----------------- | --------------------------------------------------------- |
| `MONGODB_URI`     | MongoDB connection string (DB access + NextAuth adapter). |
| `NEXTAUTH_URL`    | Base URL of the app, e.g. `http://localhost:3000`.        |
| `NEXTAUTH_SECRET` | Secret used to sign sessions/JWT.                         |

### OAuth providers (optional — enable the ones you use)

| Variable                                   | Provider |
| ------------------------------------------ | -------- |
| `GITHUB_ID`, `GITHUB_SECRET`               | GitHub   |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google   |

> Only GitHub and Google credential providers are wired up in
> `pages/api/auth/[...nextauth].ts`. Credentials (email + password) sign-in
> works without any OAuth keys.

### Email / invoices (needed to send invoice PDFs)

| Variable                                                       | Used for                 |
| -------------------------------------------------------------- | ------------------------ |
| `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`                       | SMTP host/port           |
| `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`                   | SMTP auth                |
| `EMAIL_FROM`                                                   | Sender address           |
| `EMAIL_SERVER_SECURE` (`true`/`false`), `EMAIL_DEBUG` (`true`) | TLS toggle / verbose log |

### Feature-specific (optional)

| Variable                           | Used for                                           |
| ---------------------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`  | Address autocomplete / maps in task & domain forms |
| `NEXT_PUBLIC_MONGODB_SECRET_TOKEN` | Encrypts/decrypts stored domain bank tokens.       |
| `BOT_TOKEN`                        | Telegram bot (`grammy`).                           |
| `NEXT_PUBLIC_USE_MOCK_BANK`        | Use mocked bank data on the `/bank` page.          |
| `NEXT_PUBLIC_APP_ENV`              | App environment flag (see `utils/env.ts`).         |

> Tip: to find every supported variable, search the codebase for
> `process.env.` — that's the authoritative list.

## 3. Run the dev server

```bash
yarn dev          # http://localhost:3000  (also opens your browser)
```

Hot module reload is on, so page/component edits show up immediately.

## 4. Quality checks & tests

```bash
yarn test         # Jest unit/integration tests
yarn test:watch   # Jest in watch mode
yarn lint         # ESLint (lint:fix then lint:check)
yarn prettier     # Prettier (prettier:fix then prettier:check)
yarn types:check  # tsc --noEmit
```

> There is **no** Playwright / `yarn test:e2e` setup despite older docs — the
> test stack is Jest + Testing Library, with `mongodb-memory-server` and `msw`
> for integration, and Puppeteer for PDF generation.

## Troubleshooting

- **Can't connect to MongoDB** — check `MONGODB_URI`; confirm the cluster/IP
  allowlist and that a local instance is running.
- **Login not working** — make sure `NEXTAUTH_URL` matches the URL in your
  browser and `NEXTAUTH_SECRET` is set; changing port/domain invalidates
  existing sessions.
- **Invoice email fails** — verify `EMAIL_SERVER_*` / `EMAIL_FROM`; set
  `EMAIL_DEBUG=true` and read the logs.
- **Type or lint errors** — run `yarn types:check` and `yarn lint` locally; the
  Husky pre-commit hook runs them too, so fix the cause rather than skipping.
