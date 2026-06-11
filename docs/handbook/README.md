# SpaceHub — Engineering Handbook

Onboarding and engineering documentation for the **Task Monitoring App**
(codename **SpaceHub**) — a property & utility billing platform for service
providers.

> **Canonical home:** this handbook is published to Notion:
> https://pleasant-foxtail-f25.notion.site/9cabed3d76fd4f7c8b02fcd3ac679fef
> The Markdown in this folder is the source used to build those pages.
> For the **live API reference**, run the app and open `/docs` (Swagger UI).

## Read in order (new joiners)

| #   | Page                                                  | What you get                                              |
| --- | ----------------------------------------------------- | --------------------------------------------------------- |
| 1   | [Start Here](./01-start-here.md)                      | What the product is, who uses it, glossary                |
| 2   | [Local Setup](./02-local-setup.md)                    | Run it on your machine: Node 22, env vars, scripts        |
| 3   | [Architecture](./03-architecture.md)                  | How the pieces fit: Next.js, MongoDB, RTK Query, services |
| 4   | [Roles & Permissions](./04-roles-and-permissions.md)  | The derived-role model (read before touching auth)        |
| 5   | [Data Model & Entities](./05-data-model.md)           | Domains, RealEstate, Services, Payments, Profits, Tasks…  |
| 6   | [Feature Modules](./06-feature-modules.md)            | Per-page map: components, slices, APIs, roles             |
| 7   | [User Flows](./07-user-flows.md)                      | Auth, dashboard, data setup, the monthly billing cycle    |
| 8   | [API Reference](./08-api-reference.md)                | The live Swagger docs and how to extend them              |
| 9   | [Pages & Routes](./09-pages-and-routes.md)            | Every user-facing route at a glance                       |
| 10  | [Deployment](./10-deployment.md)                      | Build, env, scheduled jobs, going to production           |
| 11  | [Contributing](./11-contributing.md)                  | Branching, PR flow, quality gates, code style             |

## Where docs live

| Location               | Holds                                                       |
| ---------------------- | ---------------------------------------------------------- |
| **Notion** (this book) | Human-facing onboarding & engineering docs — **canonical** |
| `/docs` (Swagger UI)   | Live, generated API reference                              |
| `.claudedocs/`         | Rules, code style, and tech-stack list for AI tooling      |

Keep this handbook the single source of truth for narrative docs; don't fork
the same content into scattered `*.md` files.
