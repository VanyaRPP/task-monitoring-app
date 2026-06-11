# Feature Modules

Per-page map: route, components, API, RTK Query hooks, and access. Paths are from
the repo root. Screenshots live in `docs/tech-module-map/screenshots/`.

---

## Domain — Service Providers

- **Route:** `/domain`
- **Block:** `common/components/DashboardPage/blocks/domains.tsx`
- **Table / Header:** `common/components/Tables/Domains/{Table,Header}.tsx`
- **Modal:** `common/components/UI/DomainsComponents/DomainModal/index.tsx`
- **API slice:** `common/api/domainApi/domain.api.ts`
- **API route:** `pages/api/domain/index.ts`

**Form fields:** `name`, `adminEmails`, `streets`, `description`, `IEName` (FOP),
`iban`, `rnokpp`, `mfo`, `domainBankToken`, `customServices`.

**Endpoints:** `GET/POST /api/domain`, `GET /api/domain/:id`,
`GET /api/domain/admin`, `GET /api/domain/areas/:domainId`,
`PATCH/DELETE /api/domain/:id`.

**Hooks:** `useGetDomainsQuery`, `useGetDomainByPkQuery`,
`useGetDomainsByAdminQuery`, `useGetAreasQuery`, `useAddDomainMutation`,
`useEditDomainMutation`, `useDeleteDomainMutation`, plus streets / custom-service
hooks.

**Access:** GlobalAdmin → full (incl. deleting services); DomainAdmin → own
domains, add/edit; User → none. Creating a domain adds you to `adminEmails`
(→ DomainAdmin). See [Roles & Permissions](./04-roles-and-permissions.md).

---

## Payments

- **Route:** `/payment` _(slice/store also used by `/payment/bulk`, `/payment/chart`)_
- **Block:** `common/components/DashboardPage/blocks/payments.tsx`
- **Table / Header:** `common/components/Tables/Payment/{Table,Header}.tsx`
- **Modal:** `common/components/AddPaymentModal/index.tsx`
- **Redux slice:** `payments` → `common/modules/store/paymentsSlice.ts`
- **API slice:** `common/api/paymentApi/payment.api.ts`
- **API route:** `pages/api/spacehub/payment/index.ts`

**Slice actions:** `setPage`, `setFilters`, `setDomainsFilter`,
`setCompaniesFilter`, `setStreetsFilter`, `setDateFilters`, `setOpenView`,
`setOpenEdit`, `setCloseModal`, `setDebtorCompanies`, `setSelectedColumns`,
`setPaymentsDeleteItems`, `setSelectedPayments`, `setSelectedDateField`.

**Endpoints:** `GET/POST /api/spacehub/payment`,
`GET/PATCH/DELETE /api/spacehub/payment/:id`,
`DELETE /api/spacehub/payment/multiple`,
`POST /api/spacehub/payment/generatePdf`,
`POST /api/spacehub/payment/generateExcel`,
`GET/POST /api/spacehub/payment/:id/change-log`.

**Hooks:** `useGetAllPaymentsQuery`, `useGetPaymentQuery`, `useAddPaymentMutation`,
`useEditPaymentMutation`, `useDeletePaymentMutation`,
`useDeleteMultiplePaymentsMutation`, `useGeneratePdfMutation`,
`useGenerateExcelMutation`, change-log + filter hooks, `useGetDebtorsQuery`.

The end-to-end billing workflow is in
[User Flows → Monthly billing cycle](./07-user-flows.md).

---

## Real Estate — Companies

- **Route:** `/real-estate`
- **Block:** `common/components/DashboardPage/blocks/realEstates.tsx`
- **Table / Header:** `common/components/Tables/Companies/{Table,Header}.tsx`
- **Modal:** `common/components/UI/RealEstateComponents/RealEstateModal/index.tsx`
- **API slice:** `common/api/realestateApi/realestate.api.ts`
- **API route:** `pages/api/real-estate/index.ts`

**Form fields:** `domain`, `street`, `companyName`, `description`, `adminEmails`,
`currency`, `discount`, `totalArea`, `pricePerMeter`, `garbageCollector`,
`inflicion`, `customServices`, `archived`.

**Endpoints:** `GET/POST /api/real-estate`, `PATCH/DELETE /api/real-estate/:id`,
`PATCH /api/archived/:id` (archive).

**Hooks:** `useGetAllRealEstateQuery`, `useAddRealEstateMutation`,
`useEditRealEstateMutation`, `useDeleteRealEstateMutation`,
`useUpdateArchivedItemMutation`, plus domain/service/custom-service hooks.

**Access:** GlobalAdmin → full; DomainAdmin → own domain's companies, add/edit;
User → only their own companies.

---

## Services — Monthly Tariffs

- **Route:** `/service`
- **Block:** `common/components/DashboardPage/blocks/services.tsx`
- **Table / Header:** `common/components/Tables/Services/{Table,Header}.tsx`
- **Modal:** `common/components/AddServiceModal/index.tsx`
- **API slice:** `common/api/serviceApi/service.api.ts`
- **API route:** `pages/api/service/index.ts`

**Endpoints:** `GET/POST /api/service`, `GET /api/service/address`,
`PATCH/DELETE /api/service/:id`.

**Hooks:** `useGetAllServicesQuery`, `useGetServicesAddressQuery`,
`useAddServiceMutation`, `useEditServiceMutation`, `useDeleteServiceMutation`,
plus custom-service/filter hooks.

**Access:** GlobalAdmin → full; DomainAdmin → own domain's services, add/edit;
User → only their companies' services.

---

## Other modules (reference)

These don't have a full map yet — start from the source:

| Module      | Route           | API routes                                         |
| ----------- | --------------- | -------------------------------------------------- |
| **Profits** | `/profit`       | `pages/api/profits/*`, `pages/api/profit/index.ts` |
| **Bank**    | `/bank`         | `pages/api/bankapi/{transactions,balances,date}/*` |
| **Tasks**   | dashboard (`/`) | `pages/api/task/index.ts`, `pages/api/task/[id]/*` |
| **Streets** | `/streets`      | `pages/api/streets/{index,[id],search}.ts`         |

> When you build out one of these into a full module, follow the structure of the
> four mapped modules above (route → components → slice → API → hooks → access).
