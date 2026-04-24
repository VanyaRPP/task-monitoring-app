import { defaultServices, ServiceType } from '../constants'
import {
  buildInvoiceAddPayloadFromCatalogRow,
  flattenDomainCatalogServices,
  invoiceLineExcludeKey,
} from './domain-invoice-selector'

describe('domain-invoice-selector', () => {
  it('invoiceLineExcludeKey distinguishes custom lines by fieldName', () => {
    expect(
      invoiceLineExcludeKey({
        type: ServiceType.Custom,
        fieldName: 'foo',
        serviceId: 'x',
      })
    ).toBe('custom:foo')
    expect(
      invoiceLineExcludeKey({
        type: 'custom',
        fieldName: undefined,
        serviceId: 'abc',
      })
    ).toBe('sid:abc')
    expect(
      invoiceLineExcludeKey({ type: ServiceType.Electricity })
    ).toBe('stype:electricityPrice')
  })

  it('flattenDomainCatalogServices dedupes by service id', () => {
    const rows = flattenDomainCatalogServices([
      {
        groupName: 'A',
        services: [
          { _id: '1', name: 'One', fieldName: 'one' },
          { _id: '1', name: 'One', fieldName: 'one' },
        ],
      },
      { groupName: 'B', services: [{ _id: '1', name: 'One', fieldName: 'one' }] },
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0].groupName).toBe('A')
  })

  it('buildInvoiceAddPayload maps default utility id to ServiceType', () => {
    const id = defaultServices[1]
    const p = buildInvoiceAddPayloadFromCatalogRow({
      _id: id,
      name: 'E',
      fieldName: 'ignored',
    })
    expect(p.type).toBe(ServiceType.Electricity)
  })

  it('buildInvoiceAddPayload uses custom row for unknown id', () => {
    const p = buildInvoiceAddPayloadFromCatalogRow({
      _id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
      name: 'X',
      fieldName: 'customField',
    })
    expect(p.type).toBe(ServiceType.Custom)
    expect(p.fieldName).toBe('customField')
    expect(p.customService).toBe(true)
  })
})
