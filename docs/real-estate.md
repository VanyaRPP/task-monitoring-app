# RealEstate (Компанії)

Сторінка для управління компаніями — об'єктами нерухомості які належать надавачам послуг.

## Сторінка
- **Роут:** `/real-estate`
- **Файл:** [RealEstateBlock](/common\components\DashboardPage\blocks\realEstates.tsx)
- **Таблиця:** [CompaniesTable](/common\components\Tables\Companies\Table.tsx)
- **Хедер:** [CompaniesHeader](/common\components\Tables\Companies\Header.tsx)

## Вигляд сторінки
![Сторінка компаній](./screenshots/real-estate.png)

## Компоненти
- `RealEstateBlock` — головний блок сторінки
- `CompaniesHeader` — хедер з фільтрами та кнопкою додавання
- `CompaniesTable` — таблиця компаній
- `RealEstateModal` — модалка додавання/редагування компанії
- `RealEstateForm` — форма модалки з усіма полями
- `RealEstateCardHeader` — хедер картки на дашборді
- `CustomServicesCard` — картка кастомних послуг
- `DomainsSelect` — вибір надавача послуг
- `AddressesSelect` — вибір адреси


## RealEstateModal (модалка)
- **Опис:** Модальне вікно для додавання та редагування компанії.
- **Файл:** [RealEstateModal](/common\components\UI\RealEstateComponents\RealEstateModal\index.tsx)
- **Вигляд модалки:**

![RealEstateModal](./screenshots/realEstateModal.png)

### Поля форми
| Поле | Опис |
|------|------|
| `domain` | Надавач послуг |
| `street` | Адреса |
| `companyName` | Назва компанії |
| `description` | Опис |
| `adminEmails` | Email адміністраторів |
| `currency` | Валюта (UAH, USD, EUR) |
| `discount` | Знижка |
| `totalArea` | Площа (м²) |
| `pricePerMeter` | Ціна (грн/м²) |
| `garbageCollector` | Вивіз сміття |
| `inflicion` | Індекс інфляції |
| `customServices` | Кастомні послуги |
| `archived` | Архівована |

## Ролі доступу
| Роль | Доступ |
|------|--------|
| `GLOBAL_ADMIN` | Повний доступ |
| `DOMAIN_ADMIN` | Бачить компанії свого домену, може додавати та редагувати |
| `USER` | Бачить тільки свої компанії |

## API endpoints

| Метод | URL | Опис |
|-------|-----|------|
| `GET` | `/api/real-estate` | Отримати всі компанії |
| `POST` | `/api/real-estate` | Створити компанію |
| `PATCH` | `/api/real-estate/:id` | Редагувати компанію |
| `DELETE` | `/api/real-estate/:id` | Видалити компанію |
| `PATCH` | `/api/archived/:id` | Архівувати компанію |

## RTK Query хуки

| Хук | Опис |
|-----|------|
| `useGetAllRealEstateQuery` | Отримати всі компанії |
| `useAddRealEstateMutation` | Додати компанію |
| `useEditRealEstateMutation` | Редагувати компанію |
| `useDeleteRealEstateMutation` | Видалити компанію |
| `useUpdateArchivedItemMutation` | Архівувати компанію |
| `useGetDomainByPkQuery` | Отримати домен по id |
| `useGetAllServicesQuery` | Отримати послуги домену |
| `useGetCustomServicesQuery` | Отримати кастомні послуги |
| `useGetCustomServicesByDomainQuery` | Отримати кастомні послуги домену |
| `useGetCurrentUserQuery` | Поточний юзер |

## API файли
- [realestate.api.ts](/common/api/realestateApi/realestate.api.ts)
- [realestate.api.types.ts](/common/api/realestateApi/realestate.api.types.ts)

## API Route
- [pages/api/real-estate/index.ts](/pages/api/real-estate/index.ts)