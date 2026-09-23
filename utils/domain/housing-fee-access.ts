import { BUILT_IN_SERVICE_ID_TO_TYPE, ServiceType } from '@utils/constants'
import { resolveServiceType } from './resolve-service-type'

/**
 * Мінімальна форма послуги каталогу — структурно сумісна і з
 * `ICustomDomainService['services'][number]`, і з документом `CustomService`.
 */
export interface IDomainCatalogServiceLike {
  _id?: string | { toString(): string } | null
  serviceType?: string | null
  fieldName?: string | null
}

export interface IDomainCatalogGroupLike {
  services?: IDomainCatalogServiceLike[] | null
}

/**
 * Перша послуга заданого типу в каталозі домену, або `undefined`.
 *
 * Тип резолвиться через {@link resolveServiceType}, а НЕ звіркою з фіксованим
 * `_id`: клонування шаблону в домен створює власні копії послуг із новими
 * `_id` (див. `/api/domain-type-templates/[id]/clone-for-domain`), і спільним
 * лишається саме `serviceType`. Fallback на фіксований id потрібен для старих
 * доменів, які посилаються на глобальні послуги напряму.
 */
export const findDomainServiceByType = (
  groups: IDomainCatalogGroupLike[] | null | undefined,
  type: ServiceType
): IDomainCatalogServiceLike | undefined => {
  for (const group of groups ?? []) {
    for (const service of group?.services ?? []) {
      if (service && resolveServiceType(service) === type) return service
    }
  }

  return undefined
}

/**
 * Чи має домен послугу «Квартплата» — умова доступу до сторінки розрахунку
 * заборгованості.
 */
export const hasHousingFeeService = (
  groups: IDomainCatalogGroupLike[] | null | undefined
): boolean => !!findDomainServiceByType(groups, ServiceType.HousingFee)

/**
 * Фіксовані `_id` вбудованих послуг заданого типу.
 *
 * Потрібні серверу, щоб знайти домени, які посилаються на глобальну послугу
 * напряму, ще до того як у документа з'явиться поле `serviceType`.
 */
export const builtInServiceIdsForType = (type: ServiceType): string[] =>
  Object.entries(BUILT_IN_SERVICE_ID_TO_TYPE)
    .filter(([, mapped]) => mapped === type)
    .map(([id]) => id)
