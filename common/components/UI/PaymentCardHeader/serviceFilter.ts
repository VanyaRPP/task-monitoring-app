import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { ServiceName, ServiceType } from '@utils/constants'

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

// Built-in services (ServiceName) shown in the filter. When "Доступні сервіси"
// is on, only those present in the loaded (domain-narrowed) invoices remain.
export function getFilteredBuiltInEntries(
  allowedServices: Set<string> | undefined,
  filterByAvailable: boolean
): [string, string][] {
  return Object.entries(ServiceName).filter(([value]) => {
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
