# Tech Stack — task-monitoring-app

Authoritative list of libraries and versions (synced with `package.json` on 2026-09-26). **Do not introduce new dependencies without explicit approval.** Prefer existing ones. When `package.json` changes, update this file in the same PR.

## Core

| Area        | Library                | Version  | Notes                                                                                    |
| ----------- | ---------------------- | -------- | ---------------------------------------------------------------------------------------- |
| Framework   | `next`                 | ^15.5.22 | **Pages Router only** — no `app/` directory                                              |
| Runtime     | `react`, `react-dom`   | ^18.3.1  | React 18                                                                                 |
| Language    | `typescript`           | ^5.8.3   | `strict: false`, but typing is still mandatory                                           |
| Node        | engine                 | 22.x     | Pinned via `engines` in package.json                                                     |
| PWA         | `@ducanh2912/next-pwa` | ^10.2.9  | Maintained fork of `next-pwa` (removed). Configured in `next.config.js`, disabled in dev |
| Package mgr | `yarn`                 | 1.22.22  | Use yarn, not npm, for installs                                                          |

## UI

| Library                     | Version     | Usage                                                                                                                               |
| --------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `antd`                      | ^5.20.0     | Primary UI kit (resolves to 5.29.x)                                                                                                 |
| `@ant-design/cssinjs`       | ^1.21.0     | SSR-safe styling for Ant Design                                                                                                     |
| `@ant-design/compatible`    | ^5.1.3      | v4→v5 bridge — only `CommentsCard`; avoid in new code                                                                               |
| `@ant-design/icons`         | ^5.4.0      | Icon set                                                                                                                            |
| `@ant-design/plots`         | ^2.6.8      | Charts — use for new charts (dashboard, profit page)                                                                                |
| `chart.js`                  | ^4.4.0      | Legacy — only `common/components/Chart`; don't extend                                                                               |
| `dayjs`                     | ^1.11.21    | Dates everywhere (~70 files). Keep the range compatible with antd's so there is one copy (check `npm ls dayjs`). Don't add `moment` |
| `sass`                      | ^1.103.1    | SCSS Modules — `*.module.scss` per component                                                                                        |
| `classnames` / `clsx`       | ^2.3 / ^2.1 | Conditional className composition (mandatory). `classnames` is the common one                                                       |
| `nextjs-progressbar`        | ^0.0.16     | Route-change progress                                                                                                               |
| `react-resize-detector`     | ^12.1.0     |                                                                                                                                     |
| `react-cool-onclickoutside` | ^1.7.0      |                                                                                                                                     |

## State & Data

| Library            | Version | Usage                                                        |
| ------------------ | ------- | ------------------------------------------------------------ |
| `@reduxjs/toolkit` | ^2.2.6  | `createSlice` + RTK Query (`createApi`) in `common/api/*Api` |
| `react-redux`      | ^9.1.2  |                                                              |
| `zod`              | ^4.4.3  | Currently only for AI assistant tool schemas                 |

## Database & Auth

| Library                      | Version  | Usage                                                                   |
| ---------------------------- | -------- | ----------------------------------------------------------------------- |
| `mongoose`                   | ^7.8.11  | All DB access — models in `@modules/models`                             |
| `mongodb`                    | ^4.16.0  | NextAuth adapter client only (`common/lib/mongodb.ts`)                  |
| `next-auth`                  | ^4.24.15 | Use `getCurrentUser(req, res)` in API routes (wraps `getServerSession`) |
| `@next-auth/mongodb-adapter` | ^1.1.3   |                                                                         |
| `bcryptjs`                   | ^3.0.3   | Password hashing (+ `@types/bcryptjs`)                                  |
| `jsonwebtoken`               | ^9.0.3   | + `@types/jsonwebtoken`                                                 |
| `crypto-js`                  | ^4.2.0   | + `@types/crypto-js`; see `utils/encryptionService`                     |

## AI assistant

| Library          | Version  | Usage                                                                                   |
| ---------------- | -------- | --------------------------------------------------------------------------------------- |
| `ai`             | ^6.0.175 | Vercel AI SDK — `streamText` + tools in `pages/api/chat.ts`                             |
| `@ai-sdk/google` | ^3.0.67  | Default provider (Gemini). Provider registry in `common/services/aiAssistant/config.ts` |
| `@ai-sdk/groq`   | 3.0.52   | Alternative provider (pinned). Switched via `AI_PROVIDER` env                           |
| `@ai-sdk/react`  | ^3.0.177 | `useChat` in `common/components/AIChat`                                                 |

## i18n & Routing

| Library         | Version | Usage                                                        |
| --------------- | ------- | ------------------------------------------------------------ |
| `next-i18next`  | ^15.4.2 | Config in `next-i18next.config.js` (default `uk`, also `en`) |
| `react-i18next` | ^15.5.3 |                                                              |
| `i18next`       | ^25.2.1 |                                                              |

## Drag & Drop

| Library              | Version | Usage                      |
| -------------------- | ------- | -------------------------- |
| `@dnd-kit/core`      | ^6.3.1  | Use this — not `react-dnd` |
| `@dnd-kit/sortable`  | ^10.0.0 |                            |
| `@dnd-kit/utilities` | ^3.2.2  |                            |

## Special Features

| Domain        | Library                                      | Version        | Notes                                                                                                                                             |
| ------------- | -------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram bot  | `grammy`                                     | ^1.46.0        | Singleton in `@lib/bot`. Type handlers with `Context`. Never import in React tree.                                                                |
| PDF           | `puppeteer-core` + `@sparticuz/chromium-min` | ^22.15 / ^127  | Dynamic import in `utils/pdf/bufferGenerators.ts`; Chromium pack downloaded at runtime (`CHROMIUM_PACK_URL`). Majors must match (22 ↔ Chrome 127) |
| PDF           | `puppeteer`                                  | ^22.15.0       | **devDependency only**. Do NOT import in `pages/api/**`.                                                                                          |
| Animations    | `gsap`                                       | ^3.13.0        | Register plugins client-side; SSR-guard with `useEffect`                                                                                          |
| Animations    | `lottie-react`                               | ^2.4.1         | SSR-guard or `dynamic({ ssr: false })`                                                                                                            |
| Excel         | `xlsx-js-style`                              | ^1.2.0         | Styled exports. Plain `xlsx` is **not** installed — import `xlsx-js-style`                                                                        |
| File download | `file-saver`                                 | ^2.0.5         | Client-side                                                                                                                                       |
| Zip           | `archiver`                                   | ^6.0.1         |                                                                                                                                                   |
| Image         | `sharp`                                      | ^0.35.4        | Not imported — used implicitly by `next/image`; pinned via `resolutions` for CVEs (see `docs/dependency-security.md`). Don't remove               |
| Money math    | `big.js`                                     | ^6.2.1         | Wrapped by `@utils/helpers` (`multiplyFloat`, `plusFloat`, `toRoundFixed`) — use those helpers                                                    |
| IBAN          | `iban`                                       | ^0.0.14        |                                                                                                                                                   |
| Bank          | —                                            | —              | PrivatBank adapter in `utils/bankUtils/PrivatBankApiAdapter.ts`                                                                                   |
| Maps          | `@react-google-maps/api`                     | ^2.12.0        |                                                                                                                                                   |
| Places        | `use-places-autocomplete`                    | ^4.0.0         |                                                                                                                                                   |
| Email         | `nodemailer`                                 | ^9.0.6         | `utils/email`                                                                                                                                     |
| Upload        | `formidable`                                 | ^2.0.1         | Multipart parsing in API routes                                                                                                                   |
| Utils         | `lodash`                                     | ^4.17.21       | Prefer named imports for tree-shaking                                                                                                             |
| Printing      | `react-to-print`                             | ^2.14.12       |                                                                                                                                                   |
| API docs      | `swagger-ui-react` + `next-swagger-doc`      | ^5.32 / ^0.4.1 | UI at `pages/docs.tsx` (`/docs`), spec from `pages/api/doc.ts` built from `@swagger` JSDoc in routes                                              |
| Scripts       | `dotenv`, `ts-node`                          | ^16.4 / ^10.9  | Env + runner for `scripts/*` seeds/backfills                                                                                                      |

## Testing & Tooling

| Library                                       | Version         | Usage                                                                      |
| --------------------------------------------- | --------------- | -------------------------------------------------------------------------- |
| `jest` + `ts-jest` + `jest-environment-jsdom` | ^29             | Runner; only `*.test.ts(x)` are executed                                   |
| `@testing-library/react`                      | ^16.3.3         | Component tests                                                            |
| `@testing-library/user-event`                 | ^14.6.6         | Interactions                                                               |
| `@testing-library/jest-dom`                   | ^6.5.0          | DOM matchers                                                               |
| `mongodb-memory-server`                       | ^8.16.1         | Real in-memory Mongo for API/service tests (`@utils/setupTestEnvironment`) |
| `msw`                                         | ^1.3.3 (v1 API) | HTTP mocking — used in one test so far                                     |
| `whatwg-fetch`                                | ^3.6.20         | fetch polyfill where a test needs real fetch semantics                     |
| `eslint` + `eslint-config-next`               | ^8.57.1 / ^15.5 | + `@typescript-eslint/*` ^5, `eslint-config-prettier`                      |
| `prettier`                                    | ^3.8.3          |                                                                            |
| `husky` + `lint-staged`                       | ^9.1.7 / ^16    | Pre-commit: eslint --fix + prettier on staged files                        |

## Path Aliases (tsconfig)

| Alias           | Resolves to           |
| --------------- | --------------------- |
| `@common/*`     | `common/*`            |
| `@components/*` | `common/components/*` |
| `@modules/*`    | `common/modules/*`    |
| `@lib/*`        | `common/lib/*`        |
| `@assets/*`     | `common/assets/*`     |
| `@utils/*`      | `utils/*`             |
| `@styles/*`     | `styles/*`            |
| `@public/*`     | `public/*`            |
| `@pages/*`      | `pages/*`             |

**Always import via alias.** Never `../../../`.
