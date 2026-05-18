import { defaultServices, ServiceType } from '../constants'
import {
  buildInvoiceAddPayloadFromCatalogRow,
  catalogRowToSelectOption,
  flattenDomainCatalogServices,
  invoiceLineExcludeKey,
} from './domain-invoice-selector'

describe('domain-invoice-selector', () => {
  it('invoiceLineExcludeKey prefers serviceId when present', () => {
    expect(
      invoiceLineExcludeKey({
        type: ServiceType.Custom,
        fieldName: 'foo',
        serviceId: 'x',
      })
    ).toBe('sid:x')
    expect(
      invoiceLineExcludeKey({
        type: 'custom',
        fieldName: undefined,
        serviceId: 'abc',
      })
    ).toBe('sid:abc')
  })

  it('invoiceLineExcludeKey falls back to fieldName for custom without serviceId', () => {
    expect(
      invoiceLineExcludeKey({
        type: ServiceType.Custom,
        fieldName: 'foo',
      })
    ).toBe('custom:foo')
  })

  it('invoiceLineExcludeKey falls back to ServiceType for utility without serviceId', () => {
    expect(invoiceLineExcludeKey({ type: ServiceType.Electricity })).toBe(
      'stype:electricityPrice'
    )
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
      {
        groupName: 'B',
        services: [{ _id: '1', name: 'One', fieldName: 'one' }],
      },
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

  it('buildInvoiceAddPayload prefers explicit serviceType field on the row', () => {
    const p = buildInvoiceAddPayloadFromCatalogRow({
      _id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
      name: 'Whatever',
      fieldName: 'anyField',
      serviceType: ServiceType.Inflicion,
    })
    expect(p.type).toBe(ServiceType.Inflicion)
    expect(p.serviceId).toBe('bbbbbbbbbbbbbbbbbbbbbbbb')
    expect(p.customService).toBeUndefined()
  })

  it('flattenDomainCatalogServices threads serviceType through', () => {
    const rows = flattenDomainCatalogServices([
      {
        groupName: 'A',
        services: [
          {
            _id: '1',
            name: 'One',
            fieldName: 'one',
            serviceType: ServiceType.Water,
          },
        ],
      },
    ])
    expect(rows[0].serviceType).toBe(ServiceType.Water)
  })

  // Two real catalog ids both map to ServiceType.Water in
  // COMMUNAL_UTILITY_CUSTOM_SERVICE_ID_TO_SERVICE_TYPE:
  //   '68156cdbf520914e5e1ad877'  // Водопостачання
  //   '6816bca1e26e39a785fd7a0d'  // Всього Водопостачання
  // They are separate catalog entries — must remain independently selectable
  // and independently excludable on the invoice.
  it('two utility rows with same ServiceType get distinct select option values', () => {
    const a = catalogRowToSelectOption({
      _id: '68156cdbf520914e5e1ad877',
      name: 'Водопостачання',
      fieldName: 'waterPrice',
      groupName: 'Стандартні послуги',
    })
    const b = catalogRowToSelectOption({
      _id: '6816bca1e26e39a785fd7a0d',
      name: 'Всього Водопостачання',
      fieldName: 'waterPrice',
      groupName: 'Стандартні послуги',
    })
    expect(a.value).not.toBe(b.value)
  })

  it('excludeKey for two utility rows with same ServiceType is distinct', () => {
    const a = buildInvoiceAddPayloadFromCatalogRow({
      _id: '68156cdbf520914e5e1ad877',
      name: 'Водопостачання',
      fieldName: 'waterPrice',
    })
    const b = buildInvoiceAddPayloadFromCatalogRow({
      _id: '6816bca1e26e39a785fd7a0d',
      name: 'Всього Водопостачання',
      fieldName: 'waterPrice',
    })
    const keyA = invoiceLineExcludeKey({
      type: a.type,
      fieldName: a.fieldName,
      serviceId: a.serviceId,
    })
    const keyB = invoiceLineExcludeKey({
      type: b.type,
      fieldName: b.fieldName,
      serviceId: b.serviceId,
    })
    expect(keyA).not.toBe(keyB)
  })

  it('adding utility row A does not block adding utility row B with same ServiceType', () => {
    const aOpt = catalogRowToSelectOption({
      _id: '68156cdbf520914e5e1ad877',
      name: 'Водопостачання',
      fieldName: 'waterPrice',
      groupName: 'Стандартні послуги',
    })
    const bOpt = catalogRowToSelectOption({
      _id: '6816bca1e26e39a785fd7a0d',
      name: 'Всього Водопостачання',
      fieldName: 'waterPrice',
      groupName: 'Стандартні послуги',
    })
    const aLineKey = invoiceLineExcludeKey({
      type: aOpt.payload.type,
      fieldName: aOpt.payload.fieldName,
      serviceId: aOpt.payload.serviceId,
    })
    expect(bOpt.value).not.toBe(aLineKey)
  })
})
