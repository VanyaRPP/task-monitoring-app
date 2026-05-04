import { ServiceType, UTILITY_SERVICE_ID_TO_TYPE } from '../constants'

const SERVICE_TYPE_VALUES = new Set<string>(Object.values(ServiceType))

function isServiceType(value: string): value is ServiceType {
  return SERVICE_TYPE_VALUES.has(value) && value !== ServiceType.Custom
}

export function resolveServiceType(row: {
  _id?: string | { toString(): string } | null
  serviceType?: string | null
  fieldName?: string | null
}): ServiceType | null {
  if (row.serviceType && isServiceType(String(row.serviceType))) {
    return row.serviceType as ServiceType
  }

  const id = row._id != null ? String(row._id) : ''
  if (id) {
    const mapped = UTILITY_SERVICE_ID_TO_TYPE[id]
    if (mapped) return mapped
  }

  if (row.fieldName && isServiceType(String(row.fieldName))) {
    return row.fieldName as ServiceType
  }

  return null
}
