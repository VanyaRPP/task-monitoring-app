# Data Model & Entities

The schema source of truth is `common/modules/models/**` (Mongoose). This page
gives the mental model and how the entities relate; open the model file for the
exact fields.

## Entities

| Entity          | Model file       | What it represents                                         |
| --------------- | ---------------- | ---------------------------------------------------------- |
| **User**        | `User.ts`        | A person; holds the single normalized `roles` value.       |
| **Domain**      | `Domain.ts`      | A service-provider org that issues invoices.               |
| **RealEstate**  | `RealEstate.ts`  | A client company/building served by a domain.              |
| **Street**      | `Street.ts`      | Address grouping for real-estate objects.                  |
| **Service**     | `Service.ts`     | A monthly tariff sheet for a domain.                       |
| **Payment**     | `Payment.ts`     | A debit (charge) or credit (received) record / invoice.    |
| **Profit**      | `Profit.ts`      | Financial record derived from payments.                    |
| **Task**        | `Task.ts`        | Operational to-do with executors, comments, files, status. |
| **FeatureFlag** | `FeatureFlag.ts` | Per-user / global feature toggles.                         |

## How they relate

```
Domain ──< adminEmails >──  (drives DomainAdmin role; see Roles & Permissions)
  │
  ├──< RealEstate (company)        a domain serves many companies
  │        │
  │        └── Street              a company sits on a street
  │
  ├──< Service (monthly tariff)    one per domain per month
  │
  └──< Payment (invoice)           debit/credit, links domain + company + service
             │
             └──► Profit           created from a debit payment
```

Key relationships:

- A **Domain** owns its `adminEmails`, bank details, and a service catalog
  (`customServices`, `domainServices`, `domainTypeTemplateId`). See
  `Domain.ts` (`IDomain`).
- A **RealEstate** company links to a Domain and a Street, and carries billing
  attributes (area, price per m², discount, currency, custom services).
- A **Service** record is the price list for one domain and one month; the
  monthly billing flow loads it to compute line items.
- A **Payment** ties a domain, company, and the relevant tariff together and
  stores the invoice line items; creating a debit payment generates a **Profit**
  entry and (for invoices) sends a PDF email.
- **Tasks** reference domain/real-estate and users (executors), and live mostly
  in the dashboard UI.

## Notes

- Utility service types (electricity, water, maintenance, garbage, inflation…)
  are mapped from catalog `CustomService` ids in `utils/constants.ts`
  (`UTILITY_SERVICE_ID_TO_TYPE`) — the invoicing layer uses this to turn a
  generic catalog entry into a typed billing line.
- Money is handled with `big.js`; never use raw `number` for currency.
- For the role-bearing fields and their invariants, see
  [Roles & Permissions](./04-roles-and-permissions.md).
