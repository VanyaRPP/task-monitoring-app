### Setup

This document describes how to set up the Task Monitoring App for local development.

---

### Prerequisites

- **Node.js**: v16+ (recommended: the same version used in your production environment).
- **yarn** as a package manager.
- **MongoDB** instance (local or hosted, e.g. MongoDB Atlas).
- Optional but recommended:
  - Git
  - A modern browser (Chrome, Firefox, Edge)

---

### 1. Clone the repository

```bash
git clone git@github.com:VanyaRPP/task-monitoring-app.git
cd task-monitoring-app
```

If you are working from a fork, replace the URL with your own remote.

---

### 2. Install dependencies

```bash
yarn install
```

---

### 3. Configure environment variables

Create a `.env.local` file in the project root (Next.js will automatically load it).

Minimal recommended variables:

- **Database**
  - `MONGODB_URI` – connection string to your MongoDB database.

- **NextAuth**
  - `NEXTAUTH_URL` – base URL of the app (e.g. `http://localhost:3000`).
  - `NEXTAUTH_SECRET` – random secret string used for session/token signing.

- **SMTP / Email**
  - `EMAIL_SERVER_HOST`
  - `EMAIL_SERVER_PORT`
  - `EMAIL_SERVER_USER`
  - `EMAIL_SERVER_PASSWORD`
  - `EMAIL_FROM` – sender address (e.g. `no-reply@example.com`).
  - `EMAIL_SERVER_SECURE` (optional, `true`/`false`).
  - `EMAIL_DEBUG` (optional, enables verbose logging).

Additional environment variables may be required for:

- Bank integrations under `pages/api/bankapi/**`.
- Feature flags and internal services.

When in doubt, search for `process.env.` usage in the codebase to see all supported variables.

---

### 4. Run the development server

```bash
yarn dev
```

By default, the app will be available at:

```text
http://localhost:3000
```

HMR (hot module reload) is enabled, so changes to pages and components are reflected immediately.

---

### 5. Run tests and quality checks

- **Unit / integration tests (Jest)**:

  ```bash
  yarn test
  ```

- **End‑to‑end tests (Playwright)**:

  ```bash
  yarn test:e2e
  # or for UI mode:
  yarn test:e2e:watch
  ```

- **Linting**:

  ```bash
  yarn lint
  ```

- **Prettier formatting**:

  ```bash
  yarn prettier
  ```

- **Type checking**:

  ```bash
  yarn types:check
  ```

---

### 6. Common troubleshooting

- **Cannot connect to MongoDB**
  - Verify `MONGODB_URI` in `.env.local`.
  - Check that MongoDB is running (for local instances).

- **Auth issues (login not working)**
  - Ensure `NEXTAUTH_URL` matches the URL you are using in the browser.
  - Regenerate `NEXTAUTH_SECRET` if you changed domains/ports.

- **Email / invoice sending fails**
  - Check SMTP credentials (`EMAIL_SERVER_*`, `EMAIL_FROM`).
  - Enable `EMAIL_DEBUG=true` in `.env.local` and inspect logs.

- **TypeScript or ESLint errors**
  - Run `yarn lint` and `yarn types:check` locally and fix reported issues.

---

### 7. Useful yarn scripts (summary)

- `yarn dev` – start Next.js dev server.
- `yarn build` – build the project for production.
- `yarn start` – run the production build.
- `yarn test` – run Jest test suite.
- `yarn test:e2e` – run Playwright e2e tests.
- `yarn lint` – run ESLint.
- `yarn prettier` – run Prettier checks/fixes.
- `yarn types:check` – run TypeScript type checking.
