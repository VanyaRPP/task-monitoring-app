# Claude Rules — task-monitoring-app

You are an expert developer assistant for the task-monitoring-app, a Next.js 13 Pages-Router application. This file defines **how you work**. For stack details see [TECH_STACK.md](./TECH_STACK.md); for code standards see [CODE_STYLE.md](./CODE_STYLE.md).

## 1. Context Awareness — Read Before You Write

**Before editing or creating any file, you MUST first read the surrounding directory.** Architectural patterns in this repo are convention-driven, not enforced by tooling.

- **Before editing `X.tsx`:** read `X.tsx` in full, plus 1–2 sibling files in the same folder.
- **Before creating a new component / page / API route / model / RTK slice / hook:** open the nearest existing one of the same kind and mirror its structure, naming, imports, exports, and file co-location (e.g., `index.tsx` + `style.module.scss`).
- **Before changing a shared type or model:** grep for all usages and propagate the change. Never `as any` or `@ts-ignore` to silence the fallout.
- **Before adding a util:** check `utils/`, `common/lib/`, and `lodash` first. Don't reinvent.

If a pattern is inconsistent across the codebase, prefer the **most recent** sibling (check `git log`) and ask before deviating.

## 2. Project Structure Map

Path aliases (see `tsconfig.json`) point into a `common/` mono-folder + a few top-level dirs:

```
task-monitoring-app/
├── pages/                       # Next.js Pages Router — routes
│   ├── api/                     # → API routes (NextApiHandler), folder per resource
│   ├── _app.tsx, _document.tsx  # → App shell, do not duplicate
│   └── <route>/index.tsx        # → New page: folder + index.tsx + style.module.scss
├── common/                      # @common/*
│   ├── api/<resourceApi>/       # @common/api — RTK Query slices (one folder per resource)
│   ├── assets/                  # @assets/*
│   ├── components/              # @components/* — React components (folder + index.tsx)
│   │   └── UI/                  # → Reusable primitives (buttons, modals, selectors)
│   ├── lib/                     # @lib/* — bot.ts (Grammy), mongodb.ts, middlewares, *.config.ts, i18n.ts
│   ├── modules/                 # @modules/*
│   │   ├── hooks/               # → Custom React hooks (useXxx.ts)
│   │   ├── models/              # → Mongoose schemas/models (User.ts, Task.ts, ...)
│   │   └── store/               # → Redux Toolkit: store.ts, hooks.ts, <feature>Slice.ts
│   └── services/                # → Domain services (business logic, called by API routes)
├── utils/                       # @utils/* — pure helpers, dbConnect, validators, pdf/, excel/
├── styles/                      # @styles/* — globals.scss, reset.scss
├── public/                      # @public/* — static files
├── scripts/                     # One-off Node scripts (seeders, backfills) + their tests
├── tests/                       # Integration tests crossing module boundaries
├── types/                       # Global ambient types (typeRoots)
└── docs/                        # Project documentation
```

### Where new things go

| You are adding…                          | Put it in…                                                                |
| ---                                      | ---                                                                       |
| A new page (route)                       | `pages/<route>/index.tsx` (+ `style.module.scss`)                         |
| A new API route                          | `pages/api/<resource>/index.ts` or `[id]/index.ts`. Use `NextApiHandler`. |
| A new Mongoose model                     | `common/modules/models/<Name>.ts`. Export default `mongoose.models.X \|\| mongoose.model(...)`. |
| Domain logic called by API routes        | `common/services/<feature>/...` (NOT inside the API handler)              |
| RTK Query endpoints                      | `common/api/<resource>Api/` (mirror existing slices)                      |
| Redux slice                              | `common/modules/store/<feature>Slice.ts` + register in `store.ts`         |
| Reusable component                       | `common/components/<Name>/index.tsx`                                      |
| UI primitive (button/modal/input)        | `common/components/UI/<Name>/index.tsx`                                   |
| Custom hook                              | `common/modules/hooks/use<Name>.ts`                                       |
| Pure util / helper                       | `utils/<name>.ts` (+ `<name>.test.ts` next to it)                         |
| Grammy bot logic                         | `common/lib/bot.ts` (singleton) — handlers in `common/lib/bot/` if it grows. **Never** import the bot inside a React component. |
| Cron / scheduled handler                 | `pages/api/sceduled/<frequency>.ts` (existing pattern — note legacy spelling) |
| One-off seed / backfill                  | `scripts/<name>.ts` (+ `<name>.test.ts`)                                  |

### Imports — always use aliases

```ts
// ❌ ../../../common/components/UI/Buttons/BackButton
// ✅
import BackButton from '@components/UI/Buttons/BackButton'
import { connectToDatabase } from '@utils/dbConnect'
import Task from '@modules/models/Task'
import { useAppSelector } from '@modules/store/hooks'
import { bot } from '@lib/bot'
```

## 3. Output Style — Ultra-Concise

- **No preambles.** No "Here is…", "I have updated…", "Sure!", "Let me know…". Start with the answer.
- **No trailing summaries** of what you just did — the diff speaks for itself.
- **Small edit → show only the changed fragment** (function/block), not the whole file. Reference with `file:line`.
- **Comments only when the WHY is non-obvious** (workaround, invariant, SSR guard). Never narrate the WHAT.
- **One short sentence** of context before a tool call — not a paragraph.
- **No emojis** unless explicitly requested.
- **Match response size to task size** — a one-line question gets a one-line answer.

## 4. Before You Suggest Code — Checklist

1. Have I read the existing file / sibling files?  (Context Awareness)
2. Does it type-check (`npm run types:check` → `tsc --noEmit`)?
3. Does it pass ESLint (no `console.log`, no untyped boundaries)?
4. Are imports using `@`-aliases?
5. Is browser-only code SSR-guarded (`useEffect` or `dynamic(..., { ssr: false })`)?
6. Is there an existing util / component / hook to reuse instead of adding a new one?
7. Will Husky pre-commit (lint + types) pass?
