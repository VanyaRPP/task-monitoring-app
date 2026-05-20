# Tech Stack — task-monitoring-app

Authoritative list of libraries and versions. **Do not introduce new dependencies without explicit approval.** Prefer existing ones.

## Core

| Area        | Library              | Version  | Notes                                          |
| ----------- | -------------------- | -------- | ---------------------------------------------- |
| Framework   | `next`               | ^13.4.19 | **Pages Router only** — no `app/` directory    |
| Runtime     | `react`, `react-dom` | 18.1.0   | Pinned                                         |
| Language    | `typescript`         | ^5.8.3   | `strict: false`, but typing is still mandatory |
| Node        | engine               | >=18     |                                                |
| PWA         | `next-pwa`           | ^5.6.0   |                                                |
| Package mgr | `yarn`               | 1.22.22  | Use yarn, not npm, for installs                |

## UI

| Library                     | Version     | Usage                                         |
| --------------------------- | ----------- | --------------------------------------------- |
| `antd`                      | ^5.20.0     | Primary UI kit                                |
| `@ant-design/cssinjs`       | ^1.21.0     | SSR-safe styling for Ant Design               |
| `@ant-design/compatible`    | ^5.1.3      | v4→v5 bridge — avoid in new code              |
| `@ant-design/icons`         | ^5.4.0      | Icon set                                      |
| `@ant-design/plots`         | ^2.1.2      | Charts (prefer over chart.js for new charts)  |
| `chart.js`                  | ^4.4.0      | Legacy charts                                 |
| `sass`                      | ^1.53.0     | SCSS Modules — `*.module.scss` per component  |
| `classnames` / `clsx`       | ^2.3 / ^2.1 | Conditional className composition (mandatory) |
| `nextjs-progressbar`        | ^0.0.14     | Route-change progress                         |
| `react-resizable`           | ^3.0.5      |                                               |
| `react-resize-detector`     | ^12.1.0     |                                               |
| `react-sticky-box`          | ^2.0.5      |                                               |
| `react-cool-onclickoutside` | ^1.7.0      |                                               |

## State & Data

| Library            | Version | Usage                                   |
| ------------------ | ------- | --------------------------------------- |
| `@reduxjs/toolkit` | ^2.2.6  | `createSlice` + RTK Query (`createApi`) |
| `react-redux`      | ^9.1.2  |                                         |

## Database & Auth

| Library                      | Version | Usage                                           |
| ---------------------------- | ------- | ----------------------------------------------- |
| `mongoose`                   | ^7.8.4  | All DB access — models in `@modules/models`     |
| `mongodb`                    | ^4.16.0 | Used by NextAuth adapter only                   |
| `next-auth`                  | ^4.23.1 | Session = `getServerSession(...)` in API routes |
| `@next-auth/mongodb-adapter` | ^1.1.3  |                                                 |
| `bcrypt`                     | ^5.0.1  | Password hashing                                |
| `jsonwebtoken`               | ^8.5.1  | + `@types/jsonwebtoken`                         |
| `crypto-js`                  | ^4.2.0  | + `@types/crypto-js`                            |

## i18n & Routing

| Library         | Version | Usage                              |
| --------------- | ------- | ---------------------------------- |
| `next-i18next`  | ^15.4.2 | Config in `next-i18next.config.js` |
| `react-i18next` | ^15.5.3 |                                    |
| `i18next`       | ^25.2.1 |                                    |

## Drag & Drop

| Library              | Version | Usage                      |
| -------------------- | ------- | -------------------------- |
| `@dnd-kit/core`      | ^6.3.1  | Use this — not `react-dnd` |
| `@dnd-kit/sortable`  | ^10.0.0 |                            |
| `@dnd-kit/utilities` | ^3.2.2  |                            |

## Special Features

| Domain        | Library                                  | Version      | Notes                                                                              |
| ------------- | ---------------------------------------- | ------------ | ---------------------------------------------------------------------------------- |
| Telegram bot  | `grammy`                                 | ^1.41.1      | Singleton in `@lib/bot`. Type handlers with `Context`. Never import in React tree. |
| PDF / scrape  | `puppeteer-core` + `@sparticuz/chromium` | ^22 / ^127   | Use in API routes (serverless-aware)                                               |
| PDF / scrape  | `puppeteer`                              | ^22.15.0     | **devDependency only** — local dev / tests. Do NOT import in `pages/api/**`.       |
| Animations    | `gsap`                                   | ^3.13.0      | Register plugins client-side; SSR-guard with `useEffect`                           |
| Animations    | `lottie-react`                           | ^2.4.1       | SSR-guard or `dynamic({ ssr: false })`                                             |
| Animations    | `greensock`                              | ^1.20.2      | Legacy — prefer `gsap`                                                             |
| Excel         | `xlsx` + `xlsx-js-style`                 | ^0.18 / ^1.2 | Styled exports                                                                     |
| File download | `file-saver`                             | ^2.0.5       | Client-side                                                                        |
| Zip           | `archiver`                               | ^6.0.1       |                                                                                    |
| Image         | `sharp`                                  | ^0.33.4      |                                                                                    |
| Money math    | `big.js`                                 | ^6.2.1       | **Never** use `number` for currency                                                |
| IBAN          | `iban`                                   | ^0.0.14      |                                                                                    |
| Maps          | `@react-google-maps/api`                 | ^2.12.0      |                                                                                    |
| Places        | `use-places-autocomplete`                | ^4.0.0       |                                                                                    |
| Email         | `nodemailer`                             | ^6.7.6       |                                                                                    |
| Upload        | `formidable`                             | ^2.0.1       | Multipart parsing in API routes                                                    |
| Utils         | `lodash`                                 | ^4.17.21     | Prefer named imports for tree-shaking                                              |
| Printing      | `react-to-print`                         | ^2.14.12     |                                                                                    |
| API docs      | `swagger-ui-react` + `next-swagger-doc`  | ^5.25 / ^0.3 | Served at `pages/docs.tsx`                                                         |

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
