# Roles & Permissions

> Read this before touching anything auth-related. The role model changed: roles
> are now **derived from data ownership**, not assigned by hand.

## The three roles

There is a strict priority order (`utils/roles.ts`):

```
GlobalAdmin  >  DomainAdmin  >  User
```

| Role          | Who they are                                    | How you get it                                           |
| ------------- | ----------------------------------------------- | -------------------------------------------------------- |
| `GlobalAdmin` | System operator with full access to everything. | Set **manually** in the DB; never auto-changed.          |
| `DomainAdmin` | Administrator of at least one domain.           | **Derived**: your email is in some `Domain.adminEmails`. |
| `User`        | Default role; sees mostly their own data.       | Everyone else (the default).                             |

The `Roles` enum in `utils/constants.ts` still contains some legacy values
(`Worker`, `Moderator`, `Admin`). They are **not** part of the priority list, so
normalization collapses them to `User`. Treat only the three roles above as live.

## The invariant: one effective role

A user document stores `roles: string[]`, but the model keeps it to a **single,
highest** role:

- `pickHighestRole(roles)` → the highest-priority role present, else `'User'`.
- `normalizeRoles(roles)` → `[pickHighestRole(roles)]` (a one-element array).

`User` model hooks enforce this (`common/modules/models/User.ts`):

- `pre('validate')` normalizes `roles` on every save.
- `pre(['findOneAndUpdate', 'updateOne', 'updateMany'])` normalizes any `roles`
  (or legacy `role`) coming through an update.

So whatever you write, a user ends up with exactly one of
`['GlobalAdmin'] | ['DomainAdmin'] | ['User']`.

## Derivation: how DomainAdmin is computed

The role is **recomputed on every authenticated request** in
`getCurrentUser(req, res)` (`utils/getCurrentUser.ts`):

```
load user by session email
if user is GlobalAdmin:
    leave roles untouched
else:
    shouldBeDomainAdmin = exists Domain where adminEmails contains user.email
    if shouldBeDomainAdmin and not already DomainAdmin:
        promote  → add 'DomainAdmin'
    else if not shouldBeDomainAdmin and currently DomainAdmin:
        demote   → reset to ['User']
```

It returns convenience flags used across API routes and pages:

```ts
const { isGlobalAdmin, isDomainAdmin, isUser, isAdmin, user, session } =
  await getCurrentUser(req, res)
```

`isAdmin` comes from `isAdminCheck(roles)` (`utils/helpers/index.ts`) and is
`true` for **GlobalAdmin or DomainAdmin**.

## Domain ownership = the source of truth

`Domain.adminEmails` (`common/modules/models/Domain.ts`, a required `[String]`)
is what makes someone a domain admin. Two consequences:

- **Bootstrap:** any authenticated user can create their first domain. On
  creation (`pages/api/domain/index.ts`) the creator's email is added to
  `adminEmails`, so they become `DomainAdmin` on their next request.
- **Demotion is automatic:** remove someone from every domain's `adminEmails`
  and the next `getCurrentUser` call resets them to `User`.

> Being an **admin of a company** (`RealEstate`) makes you that company's owner,
> but it does **not** grant `DomainAdmin` — only `Domain.adminEmails` does.

## Per-feature access (summary)

Access rules live in each API route/service; the module pages have the details.
Typical pattern:

| Feature                 | GlobalAdmin | DomainAdmin                      | User                           |
| ----------------------- | ----------- | -------------------------------- | ------------------------------ |
| Domains                 | Full        | Own domains: view/add/edit       | No access                      |
| Real Estate (companies) | Full        | Own domain's companies: add/edit | Only their own companies       |
| Services (tariffs)      | Full        | Own domain's services: add/edit  | Only their companies' services |
| Bank / Profits menu     | Visible     | Visible (`isAdminCheck`)         | Hidden                         |

See [Feature Modules](./06-feature-modules.md) for exact per-page role tables.

## Key files

| File                              | Role                                                 |
| --------------------------------- | ---------------------------------------------------- |
| `utils/roles.ts`                  | `ROLE_PRIORITY`, `pickHighestRole`, `normalizeRoles` |
| `utils/getCurrentUser.ts`         | Per-request derivation + the `isAdmin` flags         |
| `utils/helpers/index.ts`          | `isAdminCheck` (GlobalAdmin or DomainAdmin)          |
| `utils/constants.ts`              | `Roles` enum                                         |
| `common/modules/models/Domain.ts` | `adminEmails` — the ownership source of truth        |
| `common/modules/models/User.ts`   | `roles` field + normalization hooks                  |
| `pages/api/domain/index.ts`       | Adds creator to `adminEmails` on domain create       |

## Gotchas

- **Don't hand-set `DomainAdmin`** expecting it to stick — if the email isn't in
  any `Domain.adminEmails`, the next request demotes it back to `User`.
- **`GlobalAdmin` is the only manually managed role.** Grant it in the DB.
- The role you see can change **between requests** as domain membership changes;
  don't cache it long-term on the client beyond a session refresh.
