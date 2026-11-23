import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import {
  BUILT_IN_SERVICE_ID_TO_TYPE,
  ServiceName,
  ServiceType,
} from '@utils/constants'
import {
  getDisabledServiceIds,
  getSelectedServiceIds,
  IDomainForVisibility,
} from '@utils/servicesVisibility'

export interface ServiceFilterOption {
  value: string
  label: string
}

// The set of services actually present in the loaded (already domain-narrowed)
// invoices. Built-in services are keyed by their ServiceType; custom services
// are keyed by name — the same key the table columns use — so the filter and
// the table stay in sync and the list is implicitly scoped to the selected
// domain(s) for every role.
export function getAllowedServices(
  payments: { data?: IExtendedPayment[] } | undefined,
  customServiceNames: string[]
): Set<string> | undefined {
  if (!payments?.data?.length) return undefined
  const types = new Set<string>()
  payments.data.forEach((payment) => {
    payment.invoice?.forEach((field) => {
      if (field.type && field.type !== ServiceType.Custom && !field.serviceId) {
        types.add(field.type)
      }
    })
  })
  customServiceNames.forEach((name) => types.add(name))
  return types
}

// Built-in service types switched off in the domains (every catalog entry of
// the type is disabled, none is enabled elsewhere). Only a hint for the filter:
// a type that still appears in loaded invoices is never hidden by it.
export function getDisabledBuiltInTypes(
  domains: IDomainForVisibility[] | undefined
): Set<string> {
  const list = domains ?? []
  const disabledIds = new Set(getDisabledServiceIds(list))
  const enabledIds = new Set(getSelectedServiceIds(list))
  const enabledTypes = new Set<string>()
  const disabledTypes = new Set<string>()
  Object.entries(BUILT_IN_SERVICE_ID_TO_TYPE).forEach(([id, type]) => {
    if (enabledIds.has(id)) enabledTypes.add(type)
    else if (disabledIds.has(id)) disabledTypes.add(type)
  })
  enabledTypes.forEach((type) => disabledTypes.delete(type))
  return disabledTypes
}

// Built-in services (ServiceName) shown in the filter. When "Доступні сервіси"
// is on, only those present in the loaded (domain-narrowed) invoices remain.
// Services disabled in the domain are dropped too, unless invoices still use
// them (historical amounts must stay visible).
export function getFilteredBuiltInEntries(
  allowedServices: Set<string> | undefined,
  filterByAvailable: boolean,
  disabledTypes?: Set<string>
): [string, string][] {
  return Object.entries(ServiceName).filter(([value]) => {
    if (disabledTypes?.has(value) && !allowedServices?.has(value)) return false
    if (!filterByAvailable || !allowedServices) return true
    return allowedServices.has(value)
  }) as [string, string][]
}

// Default set of selected columns: every service actually available in the
// loaded invoices — built-in (by ServiceType) plus custom (by name).
export function getAvailableColumns(
  allowedServices: Set<string>,
  customEntries: ServiceFilterOption[]
): string[] {
  const builtIn = Object.entries(ServiceName)
    .filter(([value]) => value !== 'custom' && allowedServices.has(value))
    .map(([value]) => value)
  const customs = customEntries
    .map((entry) => entry.value)
    .filter((value) => allowedServices.has(value))
  return [...builtIn, ...customs]
}
