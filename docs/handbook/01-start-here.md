# Start Here

## What is SpaceHub?

SpaceHub (the repo is `task-monitoring-app`) is a **property & utility
management platform**. Service-provider organizations ("domains") use it to bill
the companies and buildings they serve for utilities and services — and to track
the operational tasks around that.

In one sentence: **it turns monthly meter readings and tariffs into invoices,
tracks who paid, reconciles that against the bank, and reports the profit.**

The product targets the Ukrainian market (currency defaults to UAH, invoices and
labels are largely in Ukrainian, inflation-index rules follow local methodology).

## Who uses it

| User             | What they do                                                        |
| ---------------- | ------------------------------------------------------------------- |
| **Global admin** | Operates the whole system; manages every domain, service, and user. |
| **Domain admin** | Runs one or more service-provider organizations and bills clients.  |
| **User**         | Sees their own companies/invoices; limited, read-mostly access.     |

Roles are **derived from data ownership**, not assigned by hand — see
[Roles & Permissions](./04-roles-and-permissions.md).

## The 5-minute mental model

1. A **Domain** is the organization that issues invoices (its bank details,
   admins, and service catalog live here).
2. A Domain serves **Real Estate** objects (the client companies/buildings).
3. A **Service** record is a monthly tariff sheet (price per m², electricity,
   water, garbage, inflation…) for a Domain and a given month.
4. Each month you create **Payments** (invoices): pick the context
   (domain → street → month → company), enter meter readings, and the app
   computes the line items from the tariff sheet.
5. Creating a debit Payment generates a **Profit** record and (for invoices)
   emails a PDF. **Bank** transactions are imported and reconciled against
   payments. **Profit** pages report balances over time.
6. **Tasks** track the operational work, integrated into the dashboard.

## Glossary

| Term                  | Meaning                                                            |
| --------------------- | ------------------------------------------------------------------ |
| **Domain**            | Service-provider org that issues invoices (`Domain` model).        |
| **Real Estate**       | A client company/building served by a domain (`RealEstate` model). |
| **Service / Tariff**  | Monthly price list for a domain (`Service` model).                 |
| **Payment / Invoice** | A debit (charge) or credit (received) record (`Payment` model).    |
| **Profit**            | Financial record derived from payments (`Profit` model).           |
| **Task**              | Operational to-do with executors, comments, files (`Task` model).  |
| **Street**            | Address grouping for real-estate objects (`Street` model).         |
| **Bank**              | Imported bank transactions, reconciled with payments.              |

## Next steps

- Get it running locally → [Local Setup](./02-local-setup.md)
- Understand how it's built → [Architecture](./03-architecture.md)
