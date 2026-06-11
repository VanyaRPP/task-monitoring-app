# Contributing

How we work in this repo. For the full coding rules see `.claudedocs/CODE_STYLE.md`
and `.claudedocs/CLAUDE_RULES.md`.

## Branching & PRs

- Branch off **`deploy`** (the main/integration branch).
- Keep changes scoped; one logical change per PR.
- Open the PR against `deploy`; describe what changed and why.

## Quality gates (must pass before merge)

Run locally — the Husky pre-commit hook also runs them, so don't `--no-verify`:

```bash
yarn lint          # ESLint
yarn prettier      # Prettier
yarn types:check   # tsc --noEmit
yarn test          # Jest
```

If a hook fails, **fix the cause** rather than bypassing it.

## Code style (essentials)

- **TypeScript only** — no new `.js/.jsx`. Type every prop, hook return, API
  handler, and Mongoose model. No `as any` / `@ts-ignore` / `@ts-nocheck`.
- **Imports via path aliases** (`@common/*`, `@components/*`, `@modules/*`,
  `@lib/*`, `@utils/*`, `@pages/*`, …) — never `../../../`.
- **Prettier:** no semicolons, single quotes, 2-space indent, 80 cols.
- **ESLint:** `no-console` is an error (only `warn`/`error`/`trace` allowed).
- **Styling:** SCSS modules co-located per component; compose classes with
  `classnames`/`clsx`, never string concatenation.
- **Money:** use `big.js`, never raw `number`.
- **Server vs client:** SSR-guard browser-only deps (`gsap`, `lottie-react`,
  `file-saver`, `window`/`document`) via `useEffect` or
  `dynamic({ ssr: false })`. Never import `@lib/bot` (Grammy) in the React tree;
  never import full `puppeteer` in `pages/api/**`.

## Testing conventions

- **Co-locate** unit tests: `foo.ts` + `foo.test.ts`. Cross-module integration
  tests go in `tests/`.
- Mock at the boundary: `mockingoose` for Mongoose, `msw` for HTTP,
  `mongodb-memory-server` for real in-memory integration.
- Query priority: `getByRole` > `getByLabelText` > `getByText` > `getByTestId`.
- Prefer `user-event` over `fireEvent`. No snapshot-only tests; assert behavior.

## API route checklist

1. Validate the HTTP method (`405` otherwise).
2. `getServerSession` / `getCurrentUser` and check roles.
3. `connectToDatabase()` before any Mongoose call.
4. Return typed JSON.

## Dependencies

Don't add new dependencies without approval — prefer what's already in
`.claudedocs/TECH_STACK.md`.

## Docs

This handbook is the canonical home for narrative docs (published to Notion).
When you change behavior, update the relevant handbook page in the same PR rather
than starting a new scattered `*.md`.
