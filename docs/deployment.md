### Deployment Guide

This document describes how to deploy the Task Monitoring App to production‑like environments.

---

### 1. Build artifacts

The app is a Next.js project and ships as:

- a compiled **Next.js build** (server + client bundles),
- optionally with **PWA assets** (service worker, manifest),
- TypeScript compiled to JavaScript at build time.

To create a production build locally:

```bash
yarn install
yarn build
```

The build output is managed by Next.js (typically `.next/` directory).

---

### 2. Required environment variables (production)

At minimum, configure the following variables in your deployment environment:

- **Database**

  - `MONGODB_URI` – connection string to your production MongoDB cluster.

- **NextAuth**

  - `NEXTAUTH_URL` – public base URL of your app (e.g. `https://app.example.com`).
  - `NEXTAUTH_SECRET` – long, random secret string (keep it private).

- **SMTP / Email (for invoices & notifications)**

  - `EMAIL_SERVER_HOST`
  - `EMAIL_SERVER_PORT`
  - `EMAIL_SERVER_USER`
  - `EMAIL_SERVER_PASSWORD`
  - `EMAIL_FROM`
  - `EMAIL_SERVER_SECURE` (often `true` in production).
  - `EMAIL_DEBUG` (typically `false` in production).

- **Other app‑specific variables**
  - Any additional `process.env.*` keys used in:
    - bank API (`pages/api/bankapi/**`),
    - feature flags,
    - external integrations.

> Tip: search the codebase for `process.env.` to find all environment variable usages.

---

### 3. Deployment options

The app can be deployed to any platform that supports Node.js and Next.js, including:

- **Vercel**
- **Heroku** (historically used: `https://taskmonitoringapp.herokuapp.com/`)
- **Docker‑based platforms** (Kubernetes, ECS, etc.)
- **Bare‑metal / VM** (Ubuntu, Windows Server, etc.)

The examples below are platform‑agnostic; adapt commands to your provider.

---

### 4. Generic Node/Next.js deployment steps

1. **Prepare environment**

   - Ensure Node.js is installed (same major version as in development).
   - Set all required environment variables.

2. **Install dependencies**

   - On the server/CI:
     ```bash
     yarn install --immutable
     ```

3. **Build the app**

   - Run:
     ```bash
     yarn build
     ```

4. **Start the app**

   - Use:
     ```bash
     yarn start
     ```
   - By default, Next.js listens on port `3000`. To change the port:
     ```bash
     PORT=4000 yarn start
     ```
     (or configure via your process manager).

5. **Use a process manager (optional but recommended)**
   - Examples: `pm2`, `forever`, systemd services, Docker entrypoint.
   - Ensure the process is restarted on failures and on system reboot.

---

### 5. Vercel‑style deployment (overview)

If you deploy via Vercel:

- Connect your GitHub/Git repository to Vercel.
- Configure environment variables in the Vercel dashboard for:
  - Production,
  - Preview,
  - Development (if needed).
- Vercel will:
  - run `yarn install`,
  - run `yarn build`,
  - deploy the resulting build.

The app runs as a serverless/edge mix depending on your Next.js config and usage of API routes.

---

### 6. Heroku‑style deployment (overview)

If using Heroku (or a similar PaaS):

1. **Create app**:

   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables**:

   ```bash
   heroku config:set MONGODB_URI=...
   heroku config:set NEXTAUTH_URL=...
   heroku config:set NEXTAUTH_SECRET=...
   heroku config:set EMAIL_SERVER_HOST=...
   # ... (other EMAIL_* and custom vars)
   ```

3. **Configure build and start commands**

   - Heroku by default runs npm scripts, but you can configure it to use yarn. Ensure commands map to:
     - `yarn install`
     - `yarn build`
     - `yarn start`

4. **Deploy**

   ```bash
   git push heroku main
   ```

5. **Scale dynos**
   ```bash
   heroku ps:scale web=1
   ```

---

### 7. Docker‑based deployment (outline)

If you prefer Docker, a typical `Dockerfile` would:

1. Use a Node.js base image.
2. Copy `package.json` / lockfile, run `yarn install`.
3. Copy the rest of the source.
4. Run `yarn build`.
5. Use `yarn start` as the container entrypoint.

You would then:

- Inject environment variables via:
  - `docker run -e VAR=...`,
  - or orchestration YAML (Kubernetes, docker‑compose, ECS task definitions).

---

### 8. Running scheduled jobs in production

The app exposes scheduled tasks as HTTP endpoints under `/api/sceduled/*`.  
To run them in production:

- Configure a scheduler (e.g. cron, Heroku Scheduler, GitHub Actions, external task runner) to periodically call:
  - `GET https://your-domain.com/api/sceduled/daily`
  - `GET https://your-domain.com/api/sceduled/hourly`
  - `GET https://your-domain.com/api/sceduled/threeTimesDaily`
  - `GET https://your-domain.com/api/sceduled/quater`

Make sure:

- The scheduler runs with appropriate frequency,
- The endpoints are protected enough (e.g. IP allow‑listing, secret token, or at least obscurity + HTTPS) if needed.

---

### 9. Health checks & monitoring

The project does not ship with a dedicated health‑check endpoint, but you can:

- Use a simple page (e.g. `/`) to verify the app is responding.
- Add a lightweight custom `/api/health` route if required.

Recommended monitoring:

- Track:
  - uptime,
  - response times,
  - error rates (5xx responses),
  - MongoDB health.
- Use:
  - platform tools (Vercel/Heroku dashboards),
  - or external APM/monitoring (Datadog, New Relic, Prometheus, etc.).

---

### 10. CI/CD considerations

In your CI pipeline, it is recommended to:

1. Install dependencies (`yarn install --immutable`).
2. Run quality gates:
   - `yarn test`
   - `yarn lint`
   - `yarn types:check`
3. Build:
   - `yarn build`
4. Deploy:
   - push built artifacts or trigger platform‑specific deployment step.

Fail the pipeline if tests or checks fail, to avoid deploying broken builds.
