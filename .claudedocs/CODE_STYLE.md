# Code Style — task-monitoring-app

Typing, linting, formatting, and testing standards. For project layout see [CLAUDE_RULES.md](./CLAUDE_RULES.md); for libraries see [TECH_STACK.md](./TECH_STACK.md).

## TypeScript

- **TypeScript only.** No new `.js`/`.jsx` files. Legacy `.jsx` may exist (`common/components/PlacesAutocomplete/index.jsx`) — do not expand the pattern.
- **`strict: false`** in `tsconfig.json`, but typing is still **mandatory**:
  - Every component prop has an explicit interface or type.
  - Every hook declares its return type when not trivially inferred.
  - Every API handler is typed `NextApiHandler<TResponse>` or `(req: NextApiRequest, res: NextApiResponse<TResponse>) => …`.
  - Every Mongoose model exports a typed `Document`/schema interface.
- **Reuse types.** Look in `utils/types.ts`, model interfaces in `@modules/models`, and `@types/*` before defining new ones.
- **No untyped objects** crossing module boundaries (component → component, API → client, service → API).
- **Forbidden escape hatches:** `as any`, `@ts-ignore`, `@ts-nocheck`. If you reach for one, fix the underlying type instead. `as unknown as X` is only acceptable for third-party type bugs, with a one-line `// Why:` comment.
- **Path aliases everywhere.** Configured in `tsconfig.json` `paths`.
- **Type-check before proposing:** mentally run `npm run types:check` (`tsc --noEmit`). CI runs it on every push/PR.

## ESLint

Config: `.eslintrc.json` extends `next/core-web-vitals`, `plugin:@typescript-eslint/recommended`, `prettier`.

- `no-console`: **error** — only `console.warn`, `console.error`, `console.trace` allowed. For debugging that survives, use proper logging.
- `@typescript-eslint/no-explicit-any`: off (allowed, but avoid).
- `@typescript-eslint/no-unused-vars`: off (still — clean up unused imports/vars).
- `react/react-in-jsx-scope`: off (Next.js handles it).
- Check with `npx eslint <files>` or `yarn lint:check`. Do not run `npm run lint` — it auto-fixes the whole repo.

## Prettier

Config: `.prettierrc.json`.

| Setting         | Value    |
| --------------- | -------- |
| `semi`          | `false`  |
| `singleQuote`   | `true`   |
| `trailingComma` | `'es5'`  |
| `tabWidth`      | `2`      |
| `useTabs`       | `false`  |
| `printWidth`    | `80`     |
| `endOfLine`     | `'auto'` |

**No semicolons. Single quotes. 2-space indent. 80 chars.** Run `npm run prettier:fix` to normalize.

## CSS / Styling

- **SCSS Modules** — one `style.module.scss` co-located with each component (`<Component>/index.tsx` + `<Component>/style.module.scss`).
- **Class composition:** `classnames` or `clsx`. **Never** string concatenation or template literals for conditional classes:
  ```ts
  // ❌ className={`btn ${active ? 'btn--active' : ''}`}
  // ✅
  import cn from 'classnames'
  className={cn(s.btn, { [s.active]: active })}
  ```
- **Ant Design tokens** — use `ConfigProvider` theme, not hardcoded hex values, where possible.

## Server vs Client

Pages Router renders both. Be explicit:

- **Browser-only deps** (`gsap`, `lottie-react`, `xlsx` download, `file-saver`, `puppeteer`, `window`/`document`): wrap in `useEffect`, or import via `next/dynamic` with `{ ssr: false }`.
- **API routes** (`pages/api/**`):
  1. Validate method: `if (req.method !== 'POST') return res.status(405).end()`.
  2. Auth: `const { user, isAdmin, ... } = await getCurrentUser(req, res)` from `@utils/getCurrentUser` (throws without a session). Check access to the specific resource, not just the role.
  3. DB: `await start()` from `@pages/api/api.config` before Mongoose calls, or wrap the handler in `withErrorHandler` (`@utils/api-handler`), which does it.
  4. Return JSON in the shared `Data` shape from `api.config`: `{ success, data?, message? }`.
  5. Keep the route's `@swagger` JSDoc block in sync with its contract.
- **Never** import `@lib/bot` (Grammy) inside a React component or page.
- **Never** import `puppeteer` (full) inside `pages/api/**` — use `puppeteer-core` + `@sparticuz/chromium-min` (see `utils/pdf/bufferGenerators.ts`).

## Testing

Framework: Jest 29 + Testing Library. Config: `jest.config.ts`, setup: `jest.setup.ts`.

| Tool                          | Use for                                          |
| ----------------------------- | ------------------------------------------------ |
| `@testing-library/react`      | Rendering components                             |
| `@testing-library/jest-dom`   | DOM matchers (`toBeInTheDocument`, etc.)         |
| `@testing-library/user-event` | User interactions (prefer over `fireEvent`)      |
| `mockingoose`                 | Installed but unused — don't start using it      |
| `mongodb-memory-server`       | Integration tests against a real in-memory Mongo |
| `msw`                         | Mocking HTTP requests                            |
| `identity-obj-proxy`          | CSS module mocks (configured)                    |
| `whatwg-fetch`                | `fetch` polyfill in test env                     |

**Conventions:**

- **Co-locate** unit tests: `foo.ts` + `foo.test.ts` in the same folder.
- **Integration tests** crossing modules live in `tests/`.
- **API route tests** live next to the route (see `pages/api/**/*.test.ts` and `pages/api/**/tests/`).
- **Naming:** always `<file>.test.ts(x)` — Jest `testMatch` ignores `*.spec.ts`, so spec files never run.
- **Query priority:** `getByRole` > `getByLabelText` > `getByText` > `getByTestId` (last resort).
- **Use `user-event`** over `fireEvent` for realistic interactions: `await userEvent.click(...)`.
- **Mock at the boundary.** API/service tests run against real in-memory Mongo via `setupTestEnvironment()` + `@utils/testData`, mocking only `next-auth` (log in with `mockLoginAs`). Mock external HTTP with `msw`. Never mock the unit under test.
- **No snapshot-only tests.** Assert specific behavior.
- **Don't test implementation details.** Test what the user/consumer observes.

Run: `npm test` (single), `npm run test:watch` (watch mode).

## Pre-Commit (Husky)

`.husky/pre-commit` runs `lint-staged` (eslint --fix + prettier on staged files only). Lint, type-check, build and tests gate in CI. If a hook fails, **fix the cause** — never `--no-verify`.
