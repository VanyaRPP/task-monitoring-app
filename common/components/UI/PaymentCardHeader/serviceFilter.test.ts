import { ServiceType } from '@utils/constants'
import type { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { getInvoiceCustomServiceNames } from '@components/Tables/Payment/usePaymentColumns'
import {
  getAllowedServices,
  getAvailableColumns,
  getFilteredBuiltInEntries,
} from './serviceFilter'

const payment = (invoice: any[]): IExtendedPayment =>
  ({ _id: Math.random().toString(36).slice(2), invoice }) as any

// Reproduces what ColumnSelect renders as filter options: the narrowed built-in
// services plus the invoice-derived custom services.
const filterOptionValues = (
  payments: { data?: IExtendedPayment[] },
  filterByAvailable = true
) => {
  const customNames = getInvoiceCustomServiceNames({ payments } as any)
  const allowed = getAllowedServices(payments, customNames)
  const builtIn = getFilteredBuiltInEntries(allowed, filterByAvailable).map(
    ([value]) => value
  )
  return [...builtIn, ...customNames]
}

describe('payments service filter — invoice-derived, domain-narrowed', () => {
  it('acceptance: shows only the services provided by the selected domain', () => {
    // Domain "А" payments (already narrowed server-side) — cleaning + garbage.
    const domainA = {
      data: [
        payment([
          { type: ServiceType.Custom, name: 'Прибирання', sum: 100 },
          { type: ServiceType.Custom, name: 'Вивіз сміття', sum: 50 },
        ]),
      ],
    }

    expect(filterOptionValues(domainA)).toEqual(['Прибирання', 'Вивіз сміття'])
    // a service from another domain is not present in domain "А" payments
    expect(filterOptionValues(domainA)).not.toContain('Охорона')
  })

  it('includes ad-hoc "Власне" custom fields that are not registered to the domain', () => {
    const payments = {
      data: [
        payment([
          // registered custom service (has serviceId)
          {
            type: ServiceType.Custom,
            name: 'Прибирання',
            serviceId: 'abc123',
            sum: 100,
          },
          // ad-hoc "Власне" field (no serviceId) — must still appear in the filter
          { type: ServiceType.Custom, name: 'Ремонт даху', sum: 30 },
        ]),
      ],
    }

    const values = filterOptionValues(payments)
    expect(values).toContain('Прибирання')
    expect(values).toContain('Ремонт даху')
  })

  it('narrows built-in services to those present in the invoices', () => {
    const payments = {
      data: [payment([{ type: 'electricityPrice', name: 'Електро', sum: 5 }])],
    }

    const values = filterOptionValues(payments)
    expect(values).toEqual(['electricityPrice'])
    // other built-ins that are not in the invoices are hidden
    expect(values).not.toContain('waterPrice')
    expect(values).not.toContain('garbageCollectorPrice')
  })

  it('switching domain changes the filter (different payments → different services)', () => {
    const domainA = {
      data: [
        payment([{ type: ServiceType.Custom, name: 'Прибирання', sum: 1 }]),
      ],
    }
    const domainB = {
      data: [payment([{ type: ServiceType.Custom, name: 'Охорона', sum: 1 }])],
    }

    expect(filterOptionValues(domainA)).toEqual(['Прибирання'])
    expect(filterOptionValues(domainB)).toEqual(['Охорона'])
  })

  it('"Доступні сервіси" off shows all built-in services', () => {
    const payments = {
      data: [payment([{ type: 'electricityPrice', name: 'Електро', sum: 5 }])],
    }

    const values = filterOptionValues(payments, false)
    expect(values).toContain('electricityPrice')
    expect(values).toContain('waterPrice')
    expect(values).toContain('garbageCollectorPrice')
  })

  it('getAvailableColumns picks exactly the invoice services (built-in + custom)', () => {
    const payments = {
      data: [
        payment([
          { type: 'electricityPrice', name: 'Електро', sum: 5 },
          { type: ServiceType.Custom, name: 'Прибирання', sum: 100 },
        ]),
      ],
    }
    const customNames = getInvoiceCustomServiceNames({ payments } as any)
    const allowed =
      getAllowedServices(payments, customNames) ?? new Set<string>()
    const customOptions = customNames.map((name) => ({
      value: name,
      label: name,
    }))

    expect(getAvailableColumns(allowed, customOptions).sort()).toEqual(
      ['electricityPrice', 'Прибирання'].sort()
    )
  })

  it('getAllowedServices is undefined when there are no payments', () => {
    expect(getAllowedServices({ data: [] }, [])).toBeUndefined()
    expect(getAllowedServices(undefined, [])).toBeUndefined()
  })
})
