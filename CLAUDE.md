# SpaceHub (task-monitoring-app)

Property & utility billing platform: service providers ("domains") bill companies/real estate for services, track payments, profits, debts and bank transactions. Next.js 15 **Pages Router** + Mongoose + RTK Query + Ant Design 5 + NextAuth 4. See `README.md` for the product overview.

Detailed rules (loaded below): project map & where new code goes, code style, testing conventions. Library/version list: `.claudedocs/TECH_STACK.md` (read when choosing a dependency).

@.claudedocs/CLAUDE_RULES.md
@.claudedocs/CODE_STYLE.md

## Commands

- `yarn` only (not npm) for installs. Node 22.
- Tests: `npx jest <path>` · related to changes: `yarn test:changed` · all: `yarn test`
- Types: `yarn types:check`
- Lint (read-only): `npx eslint <files>` or `yarn lint:check`
- **Do not run `yarn lint` / `yarn prettier`** — they `--fix`/`--write` the whole repo. Formatting of staged files happens in the pre-commit hook (lint-staged).
- CI (`.github/workflows/lintTest.yml`, on push/PR to `dev`/`deploy`): lint:check, types:check, build, test:coverage (coverage thresholds in `jest.config.ts`).

## Git

- Feature/fix branches are created from `dev`, and PRs go into `dev` (squash). `dev` → `deploy` is a separate release PR — don't target `deploy` from feature work.
- Never commit/push unless asked. Never `--no-verify`.

## API routes — actual pattern

- DB bootstrap: `await start()` from `@pages/api/api.config`, or wrap the handler in `withErrorHandler` (`@utils/api-handler`), which calls it.
- Auth: `getCurrentUser(req, res)` from `@utils/getCurrentUser` → `{ user, isGlobalAdmin, isDomainAdmin, isAdmin, isUser }`. Role flags are not ownership — check access to the specific domain/company too (see `security-permissions` skill).
- Response shape: `Data` from `api.config` — `{ success, data?, message?, error? }`.
- Routes carry `@swagger` JSDoc blocks; update them when you change a route's contract.

## Tests — gotchas

- Jest only runs `*.test.ts(x)` (`testMatch` in `jest.config.ts`). `*.spec.ts` files are **not executed**.
- API tests: `setupTestEnvironment()` (`@utils/setupTestEnvironment`, mongodb-memory-server + `@utils/testData`), mock `next-auth` and log in with `mockLoginAs` — copy the setup from `pages/api/profits/profits.get.test.ts`.
- No Playwright/e2e; `tests-examples/` is a commented-out leftover.

## Domain rules

- Money is stored as `number` (2 decimals). Round with `toRoundFixed`, and for new arithmetic prefer `multiplyFloat` / `plusFloat` from `@utils/helpers` (big.js inside) over raw `*`/`+`.
- Dates: `dayjs` (comes with antd, not declared in package.json). Don't add `moment`.
- i18n: `next-i18next`, default locale `uk`, also `en`; strings in `public/locales/{uk,en}/*.json` — add keys to both.
- Roles: GlobalAdmin > DomainAdmin > User. DomainAdmin is derived from `Domain.adminEmails` in `getCurrentUser`, not assigned manually.

## Language

Talk to the user in Ukrainian. Code, identifiers and comments in English.
