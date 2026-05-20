# Domain (Service Providers)

Page for managing service providers — organizations that manage companies and real estate objects.

## Page

- **Route:** `/domain`
- **File:** [DomainsBlock](/common/components/DashboardPage/blocks/domains.tsx)
- **Table:** [DomainsTable](/common/components/Tables/Domains/Table.tsx)
- **Header:** [DomainsHeader](/common/components/Tables/Domains/Header.tsx)

## Page View

![Service Providers Page](./screenshots/domain.png)

## Components

- `DomainsBlock` — main page block
- `DomainsHeader` — header with add button
- `DomainsTable` — service providers table with streets expansion
- `DomainModal` — modal for adding/editing service provider
- `DomainForm` — modal form with all fields
- `DomainInfo` — FOP, IBAN, RNOKPP, MFO, bank tokens fields
- `DomainStreets` — assigned addresses selector
- `DomainsServices` — domain service groups management
- `StreetsBlock` — streets block

## DomainModal

- **Description:** Modal window for adding and editing a service provider.
- **File:** [DomainModal](/common/components/UI/DomainsComponents/DomainModal/index.tsx)
- **Modal View:**

![addDomainModal](./screenshots/addDomainModal.png)

### Form Fields

| Field             | Description                                           |
| ----------------- | ----------------------------------------------------- |
| `name`            | Service provider name                                 |
| `adminEmails`     | Administrator emails                                  |
| `streets`         | Assigned addresses                                    |
| `description`     | Description (auto-filled from FOP, IBAN, RNOKPP, MFO) |
| `IEName`          | FOP (Individual Entrepreneur)                         |
| `iban`            | IBAN                                                  |
| `rnokpp`          | RNOKPP (Tax ID)                                       |
| `mfo`             | MFO (Bank Code)                                       |
| `domainBankToken` | Bank tokens                                           |
| `customServices`  | Service groups                                        |

## DomainsServices

Service groups management via Transfer component.

- Can create service groups
- Can add custom services
- `GLOBAL_ADMIN` can delete services

## Access Roles

| Role           | Access                                                 |
| -------------- | ------------------------------------------------------ |
| `GLOBAL_ADMIN` | Full access — view, add, edit, delete, delete services |
| `DOMAIN_ADMIN` | Sees only own domains, can add and edit                |
| `USER`         | No access                                              |

## API Endpoints

| Method   | URL                           | Description       |
| -------- | ----------------------------- | ----------------- |
| `GET`    | `/api/domain`                 | Get all domains   |
| `GET`    | `/api/domain/:id`             | Get domain by id  |
| `GET`    | `/api/domain/admin`           | Get admin domains |
| `GET`    | `/api/domain/areas/:domainId` | Get domain areas  |
| `POST`   | `/api/domain`                 | Create domain     |
| `PATCH`  | `/api/domain/:id`             | Edit domain       |
| `DELETE` | `/api/domain/:id`             | Delete domain     |

## RTK Query Hooks

| Hook                             | Description                           |
| -------------------------------- | ------------------------------------- |
| `useGetDomainsQuery`             | Get all domains                       |
| `useGetDomainByPkQuery`          | Get domain by id                      |
| `useGetDomainsByAdminQuery`      | Get admin domains                     |
| `useGetAreasQuery`               | Get domain areas                      |
| `useAddDomainMutation`           | Add domain                            |
| `useEditDomainMutation`          | Edit domain                           |
| `useDeleteDomainMutation`        | Delete domain                         |
| `useGetCurrentUserQuery`         | Current user                          |
| `useGetAllStreetsQuery`          | Get all streets for address selection |
| `useGetCustomServicesQuery`      | Get custom services                   |
| `useCreateCustomServiceMutation` | Create custom service                 |
| `useDeleteCustomServiceMutation` | Delete custom service                 |

## API Files

- [domain.api.ts](/common/api/domainApi/domain.api.ts)
- [domain.api.types.ts](/common/api/domainApi/domain.api.types.ts)

## API Route

- [pages/api/domain/index.ts](/pages/api/domain/index.ts)
