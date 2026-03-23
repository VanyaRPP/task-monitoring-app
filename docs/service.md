# Services (Послуги)

Сторінка для управління послугами — місячними даними про комунальні платежі для компаній.

## Сторінка
- **Роут:** `/service`
- **Файл:** [ServicesBlock](/common\components\DashboardPage\blocks\services.tsx)
- **Таблиця:** [ServicesTable](/common\components\Tables\Services\Table.tsx)
- **Хедер:** [ServicesHeader](/common\components\Tables\Services\Header.tsx)

## Вигляд сторінки
![Сторінка послуг](./screenshots/service.png)

## Компоненти
- `ServicesBlock` — головний блок сторінки
- `ServicesHeader` — хедер з фільтрами та кнопкою додавання
- `ServicesTable` — таблиця послуг з фільтрами
- `AddServiceModal` — модалка додавання/редагування послуги
- `AddServiceForm` — Форма для додавання та редагування
- `PreviewServiceForm` — Форма тільки для перегляду
- `ServiceCardHeader` — хедер картки на дашборді
- `DomainFilterTags` — теги фільтру надавачів послуг
- `StreetFilterTags` — теги фільтру вулиць
- `ModalDelete` — модалка підтвердження видалення

## Вигляд модалки
- **Опис:** Модальне вікно для додавання, редагування та перегляду послуги за місяць.
- **Файл:** [AddServiceModal](/common\components\AddServiceModal\index.tsx)
- **Вигляд модалки:**

![Модалка послуги](./screenshots/addServiceModal.png)

## Ролі доступу
| Роль | Доступ |
|------|--------|
| `GLOBAL_ADMIN` | Повний доступ |
| `DOMAIN_ADMIN` | Бачить послуги свого домену, може додавати та редагувати |
| `USER` | Бачить тільки послуги своїх компаній |

## API endpoints

| Метод | URL | Опис |
|-------|-----|------|
| `GET` | `/api/service` | Отримати всі послуги |
| `GET` | `/api/service/address` | Отримати адреси послуг |
| `POST` | `/api/service` | Створити послугу |
| `PATCH` | `/api/service/:id` | Редагувати послугу |
| `DELETE` | `/api/service/:id` | Видалити послугу |

## RTK Query хуки

| Хук | Опис |
|-----|------|
| `useGetAllServicesQuery` | Отримати всі послуги |
| `useGetServicesAddressQuery` | Отримати адреси послуг |
| `useAddServiceMutation` | Додати послугу |
| `useEditServiceMutation` | Редагувати послугу |
| `useDeleteServiceMutation` | Видалити послугу |
| `useGetCurrentUserQuery` | Поточний юзер |
| `useGetCustomServicesQuery` | Отримати кастомні послуги |
| `useGetDomainFiltersQuery` | Фільтри доменів |
| `useGetAddressFiltersQuery` | Фільтри адрес |
| `useGetDateFiltersQuery` | Фільтри дат |

## API файли
- [service.api.ts](/common/api/serviceApi/service.api.ts)
- [service.api.types.ts](/common/api/serviceApi/service.api.types.ts)

## API Route
- [pages/api/service/index.ts](/pages/api/service/index.ts)