---
name: security-permissions
description: Review security, authentication, authorization, ownership, sensitive-data exposure, IDOR, and token handling for changes in task-monitoring-app. Use aggressively for APIs, payments, banking, users, roles, domains, companies, files, secrets, or any user-specific data.
---

# Security & Permissions

Prefer false positives over missed sensitive-data exposure. A harmless extra warning is better than a missed authorization or data-leak issue.

## How auth works in this repo

- API routes get the caller via `getCurrentUser(req, res)` from `@utils/getCurrentUser`. It returns `{ user, session, isGlobalAdmin, isDomainAdmin, isAdmin, isUser }` and throws when there is no session user.
- Roles (`Roles` in `@utils/constants`, helpers in `@utils/roles`): GlobalAdmin > DomainAdmin > User. DomainAdmin is derived from ownership: the user's email is in some `Domain.adminEmails`. Being admin of a company (RealEstate) does NOT change the role.
- So `isDomainAdmin` only means "admins _some_ domain". Access to a specific domain/company/resource must still be checked against that resource (e.g. `adminEmails` contains `user.email`), not the role flag alone.
- Handlers are usually wrapped in `withErrorHandler` (`@utils/api-handler`).
- In tests, authenticate with `mockLoginAs({ email, roles })` from `@utils/mockLoginAs`; cover at least: unauthenticated, wrong role, right role but foreign resource.

## For every sensitive change, verify

### Authentication

- Is the endpoint/action reachable without the required authentication?

### Authorization

- Is the user's role allowed to perform the action?
- Is access checked on the server, not only hidden in the UI?

### Ownership / IDOR

- Can a user substitute another resource ID and read or mutate data they do not own?
- Are domain/company/resource relationships checked server-side?

### Data exposure

- Does the API return fields the client does not need?
- Could sensitive fields be visible in Network responses even when not rendered in the UI?
- Are tokens, credentials, bank data, secrets, or private metadata exposed to the browser?

### Side channels

- Are sensitive values written to logs, errors, query strings, analytics, or client state?
- Do error responses leak existence or details of protected resources? Note: `withErrorHandler` currently returns `error.message` in 500 responses, so thrown messages reach the client — don't put sensitive data in thrown errors.

### Scope

- Are list queries filtered by the authenticated user's allowed scope?
- Do update/delete operations repeat authorization checks rather than trusting earlier UI state?

## Rules

- Never treat frontend visibility as a security boundary.
- Never rely on a client-supplied role, user ID, domain ID, or ownership field for authorization.
- Do not print or reveal real secret values while debugging.
- If you discover an existing vulnerability while working on a nearby feature, surface it clearly rather than silently ignoring it.
- For sensitive changes, include security implications in the final summary and tests where practical.
