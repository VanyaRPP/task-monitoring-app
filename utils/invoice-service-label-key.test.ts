import { ServiceType } from '@utils/constants'
import { getInvoiceServiceLabelKey } from './invoice-service-label-key'

describe('getInvoiceServiceLabelKey', () => {
  it('maps maintenancePrice', () => {
    expect(getInvoiceServiceLabelKey(ServiceType.Maintenance)).toBe('maintenance')
  })

  it('maps rentPrice to placing', () => {
    expect(getInvoiceServiceLabelKey('rentPrice')).toBe('placing')
  })

  it('maps unknown types to additional', () => {
    expect(getInvoiceServiceLabelKey(undefined)).toBe('additional')
    expect(getInvoiceServiceLabelKey('unknown')).toBe('additional')
  })
})
