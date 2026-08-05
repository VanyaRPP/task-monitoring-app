# Dependency security

How vulnerability alerts are handled in this repo, and why each entry in the
`resolutions` block of `package.json` exists.

## Why `resolutions` at all

Some vulnerable packages are not direct dependencies — they arrive through a
parent that pins an old range and has not shipped an update. Yarn 1
`resolutions` force the patched version onto the whole tree.

The cost is that Dependabot does **not** manage `resolutions`. Nothing updates
these entries and nothing removes them once the parent fixes its own range, so
each one is a pin that has to be re-checked by hand. Keep the list minimal.

## How to verify an entry is still needed

Delete it, reinstall, and see whether an advisory comes back:

```bash
yarn install && yarn audit
```

If no new advisory appears for that package, the entry is inert — the parent's
own range already floats to a patched version — and it should stay deleted.
Every entry below was confirmed load-bearing this way on 2026-08-05.

## Current entries

| Resolution                                  | Forced onto                                                            | Advisory floor | Notes                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------- | ---------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cookie: ^0.7.2`                            | `msw` (declares `^0.4.2`)                                              | `>=0.7.0`      | Accepts out-of-bounds chars in name/path/domain.                                                                                                                                                                                                                                                      |
| `postcss: ^8.5.25`                          | `next` (pins `8.4.31` exactly)                                         | `>=8.5.23`     | Arbitrary file read, path traversal in source-map auto-load, CSS-string XSS.                                                                                                                                                                                                                          |
| `serialize-javascript: ^7.0.7`              | `rollup-plugin-terser` (declares `^4.0.0`), via `next-pwa` → `workbox` | `>=7.0.5`      | RCE via `RegExp.flags`, CPU-exhaustion DoS. No fix on the 6.x line.                                                                                                                                                                                                                                   |
| `sharp: ^0.35.3`                            | `next` (optional dep, declares `^0.34.3`)                              | `>=0.35.0`     | Inherited libvips CVEs (GHSA-f88m-g3jw-g9cj). The app already depends on `sharp@^0.35.3` directly, so this dedupes Next's nested copy onto it rather than shipping a second, vulnerable one. Deliberately outside the range Next declares, so image optimization was verified at runtime — see below. |
| `undici: ^6.28.0`                           | `@ai-sdk/provider-utils` (declares `^5.29.0`)                          | `>=6.28.0`     | Request smuggling, CRLF injection, WebSocket DoS. No fix on the 5.x line, so the major bump is required.                                                                                                                                                                                              |
| `uuid: ^11.1.1`                             | `mongodb-memory-server-core` (declares `^9.0.0`)                       | `>=11.1.1`     | Missing buffer bounds check in v3/v5/v6. No fix on the 9.x line.                                                                                                                                                                                                                                      |
| `**/@next/eslint-plugin-next/glob: ^10.5.0` | `@next/eslint-plugin-next` (pins `10.3.10`)                            | `>=10.5.0`     | glob CLI command injection via `-c`/`--cmd`. Path-scoped on purpose: a bare `glob` resolution would drag the `glob@7`/`glob@8` consumers (jest, rimraf, workbox) onto the incompatible v10 API.                                                                                                       |
| `open-cli/file-type: ^22.0.1`               | `open-cli` (declares `^18.7.0`)                                        | `>=21.3.1`     | Infinite loop in the ASF parser. Dev-only (`yarn dev` → `browser:open`).                                                                                                                                                                                                                              |

Removed as inert on 2026-08-05: `axios`, `dompurify`, `fast-uri`, `form-data`,
`js-yaml`, `sass/immutable`. Their parents already declare ranges that resolve
to patched versions, so the pins bought nothing and `js-yaml` in particular was
forcing a major (v4) onto a `^3.13.1` consumer.

## Staying on a supported Next.js line

Next.js 14 stopped receiving security backports — every advisory against it is
patched only on the 15.x line, and because `next` is a direct dependency no
resolution can work around that. On 14.2.35 this produced 21 permanently open
advisories (8 high, 11 moderate, 2 low): the single largest source of
Dependabot alerts. Upgrading to 15.x cleared all of them.

**Do not let the major version fall behind again.** Once a line goes
end-of-life, every subsequent CVE is unfixable without another migration.

The CI audit gate fails on high + critical (`CODE & 24` in
`.github/workflows/lintTest.yml`).

## What a dependency bump is verified against

`next build` passing is not evidence that the app works — image optimization,
the service worker and PDF generation all run at request time and none of them
are exercised by a build or by the Jest suite. After a framework or native-
dependency bump, run `next start` against a non-production database and check
at least:

| Path                                                      | Covers                                                                                                                                           |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`, `/uk`, `/en`                                         | SSR + i18n routing                                                                                                                               |
| `/_next/image?url=…&w=256&q=80` with `Accept: image/webp` | `sharp` / libvips transcoding — must return `content-type: image/webp`, not just 200                                                             |
| `POST /api/spacehub/payment/htmlToPdf`                    | `puppeteer-core` + `@sparticuz/chromium-min` resolution, i.e. whether `serverExternalPackages` is right. Response buffer must start with `%PDF-` |
| `/sw.js`                                                  | Service worker is generated and served                                                                                                           |
| `/api/auth/session`, `/api/auth/providers`                | NextAuth wiring                                                                                                                                  |

Note that 43 tests across 9 suites currently fail for an unrelated reason (a
missing react-redux `<Provider>` in the test harness), covering the domains,
companies, payment and real-estate areas. Those areas therefore have **no**
automated signal, which is exactly why the manual checks above matter.

## Automation

- `.github/dependabot.yml` groups every outstanding security fix into a single
  weekly PR, and splits routine prod/dev drift into two more. Majors stay
  ungrouped so they get their own review.
- Repo settings must have **Dependabot alerts** and **Dependabot security
  updates** enabled — the config file alone does not turn them on.
- `.github/workflows/lintTest.yml` runs `yarn audit` on every PR.
