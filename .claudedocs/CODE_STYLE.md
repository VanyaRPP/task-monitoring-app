# Code Style — task-monitoring-app

Typing, linting, formatting, and testing standards. For project layout see [CLAUDE_RULES.md](./CLAUDE_RULES.md); for libraries see [TECH_STACK.md](./TECH_STACK.md).

## TypeScript

- **TypeScript only.** No new `.js`/`.jsx` files. Legacy `.jsx` may exist (`common/components/PlacesAutocomplete/index.jsx`) — do not expand the pattern.
- **`strict: false`** in `tsconfig.json`, but typing is still **mandatory**:
  - Every component prop has an explicit interface or type.
  - Every hook declares its return type when not trivially inferred.
  - Every API handler is typed `NextApiHandler<TResponse>` or `(req: NextApiRequest, res: NextApiResponse<TResponse>) => …`.
  - Every Mongoose model exports a typed `Document`/schema interface.
- **Reuse types.** Look in `types/`, `@types/*`, and `utils/types.ts` before defining new ones.
- **No untyped objects** crossing module boundaries (component → component, API → client, service → API).
- **Forbidden escape hatches:** `as any`, `@ts-ignore`, `@ts-nocheck`. If you reach for one, fix the underlying type instead. `as unknown as X` is only acceptable for third-party type bugs, with a one-line `// Why:` comment.
- **Path aliases everywhere.** Configured in `tsconfig.json` `paths`.
- **Type-check before proposing:** mentally run `npm run types:check` (`tsc --noEmit`). Husky pre-commit will run it for real.

## ESLint

Config: `.eslintrc.json` extends `next/core-web-vitals`, `plugin:@typescript-eslint/recommended`, `prettier`.

- `no-console`: **error** — only `console.warn`, `console.error`, `console.trace` allowed. For debugging that survives, use proper logging.
- `@typescript-eslint/no-explicit-any`: off (allowed, but avoid).
- `@typescript-eslint/no-unused-vars`: off (still — clean up unused imports/vars).
- `react/react-in-jsx-scope`: off (Next.js handles it).
- Run `npm run lint` before suggesting code.

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
  2. Auth: `const session = await getServerSession(req, res, authOptions)`.
  3. DB: `await connectToDatabase()` from `@utils/dbConnect` before Mongoose calls.
  4. Return typed JSON: `res.status(200).json<TResponse>(...)`.
- **Never** import `@lib/bot` (Grammy) inside a React component or page.
- **Never** import `puppeteer` (full) inside `pages/api/**` — use `puppeteer-core` + `@sparticuz/chromium`.

## Testing

Framework: Jest 29 + Testing Library. Config: `jest.config.ts`, setup: `jest.setup.ts`.

| Tool                          | Use for                                          |
| ----------------------------- | ------------------------------------------------ |
| `@testing-library/react`      | Rendering components                             |
| `@testing-library/jest-dom`   | DOM matchers (`toBeInTheDocument`, etc.)         |
| `@testing-library/user-event` | User interactions (prefer over `fireEvent`)      |
| `mockingoose`                 | Mocking Mongoose models                          |
| `mongodb-memory-server`       | Integration tests against a real in-memory Mongo |
| `msw`                         | Mocking HTTP requests                            |
| `identity-obj-proxy`          | CSS module mocks (configured)                    |
| `whatwg-fetch`                | `fetch` polyfill in test env                     |

**Conventions:**

- **Co-locate** unit tests: `foo.ts` + `foo.test.ts` in the same folder.
- **Integration tests** crossing modules live in `tests/`.
- **API route tests** live next to the route (see `pages/api/**/*.test.ts` and `pages/api/**/tests/`).
- **Naming:** `<file>.test.ts(x)` for unit, `<file>.spec.ts` for integration.
- **Query priority:** `getByRole` > `getByLabelText` > `getByText` > `getByTestId` (last resort).
- **Use `user-event`** over `fireEvent` for realistic interactions: `await userEvent.click(...)`.
- **Mock at the boundary.** Mock Mongoose with `mockingoose`, HTTP with `msw` — not the unit under test.
- **No snapshot-only tests.** Assert specific behavior.
- **Don't test implementation details.** Test what the user/consumer observes.

Run: `npm test` (single), `npm run test:watch` (watch mode).

## Pre-Commit (Husky)

`.husky/` runs on commit. Expect lint + type-check to gate. If a hook fails, **fix the cause** — never `--no-verify`.
