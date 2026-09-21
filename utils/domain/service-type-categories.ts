import { ServiceName, ServiceType } from '@utils/constants'
import { DomainTypeTemplateCategory } from '@modules/models/domain-type-template'

export const SERVICE_TYPES_BY_CATEGORY: Record<
  DomainTypeTemplateCategory,
  ServiceType[]
> = {
  utility: [
    ServiceType.Electricity,
    ServiceType.Water,
    ServiceType.WaterPart,
    ServiceType.GarbageCollector,
    ServiceType.Maintenance,
    ServiceType.Placing,
    ServiceType.Inflicion,
    ServiceType.Cleaning,
    ServiceType.Discount,
  ],
  it: [],
  edu: [],
  auto: [],
  'real-estate': [],
  other: [],
}

/**
 * Типи, що рахуються від площі компанії (м² × тариф), а не від показників
 * лічильника чи частки.
 *
 * Площа є в КОЖНОЇ компанії домену, тому такі послуги комунальні за природою:
 * у Payment Bulk вони рендеряться для всіх компаній і не ховаються за гейтом
 * «компанія несе послугу» — рівно як нативні колонки Розміщення/Утримання.
 * Лічильники (електрика, вода) належать конкретним компаніям і гейт зберігають.
 */
export const AREA_BASED_SERVICE_TYPES: ReadonlySet<ServiceType> = new Set([
  ServiceType.Placing,
  ServiceType.Maintenance,
])

export const isAreaBasedServiceType = (
  type?: ServiceType | string | null
): boolean => !!type && AREA_BASED_SERVICE_TYPES.has(type as ServiceType)

export const UNDEFINED_SERVICE_TYPE_VALUE = ''
export const UNDEFINED_SERVICE_TYPE_LABEL = 'Невизначений'

export function getServiceTypeLabel(type: ServiceType | string): string {
  return ServiceName[type as keyof typeof ServiceName] ?? String(type)
}

export interface ServiceTypeOption {
  value: string
  label: string
}

export function getServiceTypeOptionsForCategory(
  category?: DomainTypeTemplateCategory | string | null
): ServiceTypeOption[] {
  const types =
    (category &&
      SERVICE_TYPES_BY_CATEGORY[category as DomainTypeTemplateCategory]) ||
    []
  return [
    {
      value: UNDEFINED_SERVICE_TYPE_VALUE,
      label: UNDEFINED_SERVICE_TYPE_LABEL,
    },
    ...types.map((type) => ({ value: type, label: getServiceTypeLabel(type) })),
  ]
}

export function getAssignableServiceTypeOptions(): ServiceTypeOption[] {
  const allTypes = Array.from(
    new Set(Object.values(SERVICE_TYPES_BY_CATEGORY).flat())
  )
  return [
    {
      value: UNDEFINED_SERVICE_TYPE_VALUE,
      label: UNDEFINED_SERVICE_TYPE_LABEL,
    },
    ...allTypes.map((type) => ({
      value: type,
      label: getServiceTypeLabel(type),
    })),
  ]
}
