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
