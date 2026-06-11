# Deployment

How to ship the app to production. It's a standard Next.js 14 app, so it runs on
any Node-capable host; **Vercel** is the natural target.

> The old Heroku instance (`taskmonitoringapp.herokuapp.com`) is retired — ignore
> references to it in legacy notes.

## 1. Build

```bash
yarn install
yarn build      # Next.js build → .next/ ; PWA assets emitted to public/
yarn start      # serve the production build (PORT=4000 yarn start to change port)
```

## 2. Production environment variables

Set at least the **Required** group; add OAuth/email/feature vars as needed.
The full, authoritative list is in [Local Setup](./02-local-setup.md).

- **Required:** `MONGODB_URI`, `NEXTAUTH_URL` (public URL, e.g.
  `https://app.example.com`), `NEXTAUTH_SECRET`.
- **OAuth (optional):** `GITHUB_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET`.
- **Email/invoices:** `EMAIL_SERVER_*`, `EMAIL_FROM` (`EMAIL_SERVER_SECURE=true`,
  `EMAIL_DEBUG=false` in prod).
- **Feature:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`,
  `NEXT_PUBLIC_MONGODB_SECRET_TOKEN`, `BOT_TOKEN`.

## 3. Vercel (recommended)

1. Connect the Git repo in Vercel.
2. Add the env vars for Production (and Preview if you use preview deploys).
3. Vercel runs `yarn install` → `yarn build` → deploys. API routes run as
   serverless functions.

**Note on PDF generation:** invoice PDFs use `puppeteer-core` +
`@sparticuz/chromium` (configured as `serverComponentsExternalPackages` in
`next.config.js`) so headless Chrome works in the serverless runtime. The full
`puppeteer` package is dev-only — never import it in `pages/api/**`.

## 4. Generic Node host (alternative)

`yarn install --immutable` → `yarn build` → `yarn start` behind a process manager
(pm2/systemd/Docker). Provide all env vars via the platform.

## 5. Scheduled jobs

Cron-like work is exposed as plain HTTP endpoints — point an external scheduler
(Vercel Cron, GitHub Actions, cron, etc.) at:

```
GET /api/sceduled/daily
GET /api/sceduled/hourly
GET /api/sceduled/threeTimesDaily
GET /api/sceduled/quater
```

Protect them as appropriate (secret token / IP allowlist / HTTPS).

## 6. CI/CD gates

Before deploying, run the same gates as locally:

```bash
yarn install --immutable
yarn test
yarn lint
yarn types:check
yarn build
```

Fail the pipeline on any gate so broken builds don't ship.

## 7. Monitoring

No dedicated health endpoint ships; use `/` to check liveness (or add a light
`/api/health`). Watch uptime, 5xx rate, response times, and MongoDB health via
your platform dashboard or an external APM.
