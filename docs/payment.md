# Payments (Платежі)

Сторінка платежів призначена для управління фінансовими операціями, зокрема створення, перегляду, редагування та аналізу рахунків (платежів) між компаніями та надавачами послуг.

## Сторінка
- **Роут:** `/payments`
- **Файл:** [PaymentsBlock](/common\components\DashboardPage\blocks\payments.tsx)
- **Таблиця сторінки:** [PaymentsTable](/common\components\Tables\Payment\Table.tsx)
- **Хедер сторінки:** [PaymentsHeader](/common/components\Tables\Payment\Header.tsx)

## Вигляд сторінки

![payment](./screenshots/payment.png)

## Компоненти
- `PaymentsBlock` — головний блок сторінки
- `PaymentsHeader` — хедер головної сторінки 
- `PaymentCardHeader` — шапка з фільтрами та діями
- `PaymentsTable` — таблиця платежів
- `AddPaymentModal` — модалка додавання/редагування/перегляду

## AddPaymentModal
- **Опис:** Модальне вікно для додавання, редагування та перегляду платежу.
- **Файл:** [AddPaymentModal](/common\components\AddPaymentModal\index.tsx)
- **Вигляд модалки:**

![AddPaymentModal](./screenshots/addPaymentModal.png)

## Redux
- **Slice:** `payments`
- **Файл:** [modules/store/paymentsSlice.ts](../../modules/store/paymentsSlice.ts)
- **Actions:**
  - `setPage` — пагінація
  - `setFilters` — фільтри таблиці
  - `setDomainsFilter` — фільтр доменів
  - `setCompaniesFilter` — фільтр компаній
  - `setStreetsFilter` — фільтр вулиць
  - `setDateFilters` — фільтр дат
  - `setOpenView` — відкрити перегляд
  - `setOpenEdit` — відкрити редагування
  - `setCloseModal` — закрити модалку
  - `setDebtorCompanies` — компанії боржники
  - `setSelectedColumns` — вибрані колонки
  - `setPaymentsDeleteItems` — елементи для видалення
  - `setSelectedPayments` — вибрані платежі
  - `setSelectedDateField` — поле дати для фільтрації
  

## API endpoints

| Метод | URL | Опис |
|-------|-----|------|
| GET | `/api/spacehub/payment` | Отримати всі платежі |
| GET | `/api/spacehub/payment/:id` | Отримати платіж по id |
| POST | `/api/spacehub/payment` | Додати платіж |
| PATCH | `/api/spacehub/payment/:id` | Редагувати платіж |
| DELETE | `/api/spacehub/payment/:id` | Видалити платіж |
| DELETE | `/api/spacehub/payment/multiple` | Видалити декілька платежів |
| POST | `/api/spacehub/payment/generatePdf` | Генерація PDF |
| POST | `/api/spacehub/payment/generateExcel` | Генерація Excel |
| GET | `/api/spacehub/payment/:id/change-log` | Отримати changelog платежу |
| POST | `/api/spacehub/payment/:id/change-log` | Створити changelog |

## RTK Query хуки

| Хук | Опис |
|-----|------|
| `useGetAllPaymentsQuery` | Отримати всі платежі з фільтрами |
| `useGetPaymentQuery` | Отримати один платіж |
| `useAddPaymentMutation` | Додати платіж |
| `useEditPaymentMutation` | Редагувати платіж |
| `useDeletePaymentMutation` | Видалити платіж |
| `useDeleteMultiplePaymentsMutation` | Видалити декілька |
| `useGeneratePdfMutation` | Генерація PDF |
| `useGenerateExcelMutation` | Генерація Excel |
| `useGetPaymentChangeLogsQuery` | Отримати changelog |
| `useCreatePaymentChangeLogMutation` | Створити changelog |
| `useGetDomainFiltersQuery` | Фільтри доменів |
| `useGetRealEstateFiltersQuery` | Фільтри компаній |
| `useGetAddressFiltersQuery` | Фільтри адрес |
| `useGetDateFiltersQuery` | Фільтри дат |
| `useGetCurrentUserQuery` | Поточний юзер |
| `useGetDebtorsQuery` | Боржники |

## API

- [payment.api.ts](/common/api/paymentApi/payment.api.ts)
- [payment.api.types.ts](/common/api/paymentApi/payment.api.types.ts)

## API Route

- [pages/api/spacehub/payment/index.ts](/pages/api/spacehub/payment/index.ts)