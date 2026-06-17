```
░██████╗██████╗░░█████╗░░█████╗░███████╗██╗░░██╗██╗░░░██╗██████╗░
██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██║░░██║██║░░░██║██╔══██╗
╚█████╗░██████╔╝███████║██║░░╚═╝█████╗░░███████║██║░░░██║██████╦╝
░╚═══██╗██╔═══╝░██╔══██║██║░░██╗██╔══╝░░██╔══██║██║░░░██║██╔══██╗
██████╔╝██║░░░░░██║░░██║╚█████╔╝███████╗██║░░██║╚██████╔╝██████╦╝
╚═════╝░╚═╝░░░░░╚═╝░░╚═╝░╚════╝░╚══════╝╚═╝░░╚═╝░╚═════╝░╚═════╝░
```

# SpaceHub — Task Monitoring App

SpaceHub is a property & utility management platform for service providers
("domains") who bill residents and companies for utilities and services. It
handles tariffs, monthly billing cycles, payments, profit tracking, bank
transaction reconciliation, and task management — all from a single dashboard.

It is a monolithic [Next.js](https://nextjs.org/) app (Pages Router) with a
MongoDB/Mongoose data layer and an API implemented as Next.js API routes.

## What it does

- **Domains & Real Estate** — manage service-provider organizations and the
  buildings/companies they serve.
- **Services & Tariffs** — define billable services and per-area tariffs.
- **Monthly billing** — generate invoices from meter readings and tariffs,
  in bulk or per object.
- **Payments & Profits** — track debit/credit payments and derive profit records.
- **Bank reconciliation** — import bank transactions and match them to payments.
- **Tasks** — assign and track operational tasks with comments and files.
- **Roles** — access is derived from data ownership (see the Roles & Permissions
  docs); a global admin, domain admins, and regular users.

## Tech stack

| Area     | Tech                                                        |
| -------- | ----------------------------------------------------------- |
| Runtime  | Node **22.x**, Yarn 1.22                                    |
| Framework| Next.js 14 (Pages Router), React 18, TypeScript 5           |
| Data     | MongoDB + Mongoose 7                                         |
| Auth     | NextAuth (credentials + GitHub/Google/Facebook OAuth)       |
| State    | Redux Toolkit + RTK Query                                   |
| UI       | Ant Design 5, SCSS modules, Chart.js / @ant-design/plots    |
| Other    | i18n (next-i18next), PWA (next-pwa), Puppeteer PDF, Telegram bot (grammy) |
| Testing  | Jest, Testing Library, MSW, mongodb-memory-server           |

## Quick start

```bash
# 1. Use Node 22.x (see "engines" in package.json)
node -v            # should print v22.x

# 2. Install dependencies
yarn install

# 3. Configure environment (see Local Setup docs for the full list)
#    Required at minimum: MONGODB_URI, NEXTAUTH_URL, NEXTAUTH_SECRET
cp .env.example .env.local   # if present; otherwise create .env.local

# 4. Run the dev server
yarn dev                     # http://localhost:3000
```

> Full prerequisites, the complete environment-variable table, and
> troubleshooting live in the **Local Setup** page of the docs (see below).

## Scripts

| Script              | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `yarn dev`          | Start the dev server on port 3000        |
| `yarn build`        | Production build                         |
| `yarn start`        | Run the production build                 |
| `yarn test`         | Run Jest tests (`test:watch` for watch)  |
| `yarn lint`         | ESLint (`lint:fix` autofixes)            |
| `yarn prettier`     | Prettier check + write                   |
| `yarn types:check`  | TypeScript type-check (`tsc --noEmit`)   |

A Husky pre-commit hook runs linting/formatting on staged files.

## Documentation

- **Engineering Handbook (Notion)** — onboarding, architecture, roles, data
  model, feature modules, and user flows:
  https://pleasant-foxtail-f25.notion.site/9cabed3d76fd4f7c8b02fcd3ac679fef
- **Live API reference (Swagger UI)** — run the app and open
  [`/docs`](http://localhost:3000/docs); the OpenAPI spec is served from
  `pages/api/doc.ts` and generated with `next-swagger-doc`.
- **AI assistant rules** — `.claudedocs/` holds coding rules, code style, and the
  authoritative tech-stack list used by AI tooling.

## Project structure

```
pages/            Next.js pages and API routes (pages/api/**)
common/           Shared frontend code
  components/       React components
  modules/models/   Mongoose models
  api/              RTK Query API slices
  services/         Business logic (payments, profits, …)
utils/            Cross-cutting helpers (roles, constants, …)
styles/           Global SCSS
docs/             Pointer to the Notion handbook (see docs/README.md)
.claudedocs/      Rules and tech-stack reference for AI tooling
```

## Contributing

Branch from `deploy`, keep changes scoped, and make sure `yarn lint`,
`yarn prettier`, `yarn types:check`, and `yarn test` pass before opening a PR.
See the **Contributing** page in the handbook for branch naming and PR flow.
