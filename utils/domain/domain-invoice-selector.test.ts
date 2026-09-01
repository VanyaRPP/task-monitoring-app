import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { defaultServices, ServiceType } from '../constants'
import {
  buildInvoiceAddPayloadFromCatalogRow,
  catalogRowToSelectOption,
  flattenDomainCatalogServices,
  invoiceLineExcludeKey,
  isCatalogOptionExcluded,
  resolveCustomServicePrice,
  typedServiceTypesOnInvoice,
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

  describe('typedServiceTypesOnInvoice', () => {
    it('collects utility types from auto-seeded rows that have no serviceId', () => {
      const set = typedServiceTypesOnInvoice([
        { type: ServiceType.Maintenance },
        { type: ServiceType.Electricity },
      ])
      expect(set.has(ServiceType.Maintenance)).toBe(true)
      expect(set.has(ServiceType.Electricity)).toBe(true)
    })

    it('ignores rows that carry a serviceId (added from the catalog)', () => {
      const set = typedServiceTypesOnInvoice([
        { type: ServiceType.Water, serviceId: '68156cdbf520914e5e1ad877' },
      ])
      expect(set.has(ServiceType.Water)).toBe(false)
    })

    it('ignores custom and empty rows', () => {
      const set = typedServiceTypesOnInvoice([
        { type: ServiceType.Custom, fieldName: 'internetPrice' } as any,
        null,
        undefined,
      ])
      expect(set.size).toBe(0)
    })
  })

  describe('isCatalogOptionExcluded', () => {
    const maintenanceOption = catalogRowToSelectOption({
      _id: '677d414283b6ef93c6b8ea2c',
      name: 'Утримання',
      fieldName: 'rentPrice',
      groupName: 'Комунальні',
    })

    it('hides a utility option whose ServiceType a typed line already owns', () => {
      const excluded = isCatalogOptionExcluded(
        maintenanceOption,
        ['stype:maintenancePrice'],
        typedServiceTypesOnInvoice([{ type: ServiceType.Maintenance }])
      )
      expect(excluded).toBe(true)
    })

    it('keeps the option when no line owns that ServiceType', () => {
      const excluded = isCatalogOptionExcluded(
        maintenanceOption,
        [],
        typedServiceTypesOnInvoice([{ type: ServiceType.Electricity }])
      )
      expect(excluded).toBe(false)
    })

    it('still hides an option matched by its line key', () => {
      const excluded = isCatalogOptionExcluded(
        maintenanceOption,
        [maintenanceOption.value],
        new Set<string>()
      )
      expect(excluded).toBe(true)
    })

    it('does not hide a second same-type catalog service when the first was added from the catalog', () => {
      const total = catalogRowToSelectOption({
        _id: '6816bca1e26e39a785fd7a0d',
        name: 'Всього Водопостачання',
        fieldName: 'waterPriceTotal',
        groupName: 'Комунальні',
      })
      const excludeServiceTypes = typedServiceTypesOnInvoice([
        { type: ServiceType.Water, serviceId: '68156cdbf520914e5e1ad877' },
      ])
      const excluded = isCatalogOptionExcluded(
        total,
        ['sid:68156cdbf520914e5e1ad877'],
        excludeServiceTypes
      )
      expect(excluded).toBe(false)
    })
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

describe('resolveCustomServicePrice', () => {
  const companyWithInternet: Partial<IRealestate> = {
    customServices: [
      {
        _id: '65b8a9f4a35a75f7da9f1010' as any,
        label: 'Інтернет',
        fieldName: 'internetPrice',
        price: 300,
      },
    ],
  }
  const serviceWithInternet: Partial<IService> = {
    customServices: [
      {
        _id: '65b8a9f4a35a75f7da9f1010' as any,
        label: 'Інтернет',
        fieldName: 'internetPrice',
        price: 200,
      },
    ],
  }
  const prevWithInternet: Partial<IPayment> = {
    invoice: [
      {
        type: ServiceType.Custom,
        name: 'Інтернет',
        fieldName: 'internetPrice',
        price: 100,
        sum: 100,
      },
    ],
  }

  it('returns undefined when fieldName is missing', () => {
    expect(
      resolveCustomServicePrice(undefined, { company: companyWithInternet })
    ).toBeUndefined()
  })

  it('uses company.customServices price when matched', () => {
    expect(
      resolveCustomServicePrice('internetPrice', {
        company: companyWithInternet,
      })
    ).toBe(300)
  })

  it('uses service.customServices price when company has no match', () => {
    expect(
      resolveCustomServicePrice('internetPrice', {
        service: serviceWithInternet,
      })
    ).toBe(200)
  })

  // New fallback path — this is the feature being added.
  it('falls back to prevPayment custom-invoice price when company and service have no price', () => {
    expect(
      resolveCustomServicePrice('internetPrice', {
        prevPayment: prevWithInternet,
      })
    ).toBe(100)
  })

  it('prefers company over service and prev when all three match', () => {
    expect(
      resolveCustomServicePrice('internetPrice', {
        company: companyWithInternet,
        service: serviceWithInternet,
        prevPayment: prevWithInternet,
      })
    ).toBe(300)
  })

  it('prefers service over prev when company is missing', () => {
    expect(
      resolveCustomServicePrice('internetPrice', {
        service: serviceWithInternet,
        prevPayment: prevWithInternet,
      })
    ).toBe(200)
  })

  it('ignores prev invoice rows whose type is not Custom', () => {
    const prev: Partial<IPayment> = {
      invoice: [
        {
          type: ServiceType.Electricity,
          fieldName: 'internetPrice',
          price: 999,
          sum: 999,
        },
      ],
    }
    expect(
      resolveCustomServicePrice('internetPrice', { prevPayment: prev })
    ).toBeUndefined()
  })

  it('ignores prev invoice rows with different fieldName', () => {
    const prev: Partial<IPayment> = {
      invoice: [
        {
          type: ServiceType.Custom,
          fieldName: 'cleaningPrice',
          price: 555,
          sum: 555,
        },
      ],
    }
    expect(
      resolveCustomServicePrice('internetPrice', { prevPayment: prev })
    ).toBeUndefined()
  })

  it('returns explicit 0 from company when set, not undefined', () => {
    const company: Partial<IRealestate> = {
      customServices: [
        {
          _id: 'x' as any,
          label: 'Free',
          fieldName: 'freebie',
          price: 0,
        },
      ],
    }
    expect(resolveCustomServicePrice('freebie', { company })).toBe(0)
  })
})

describe('buildInvoiceAddPayloadFromCatalogRow with context', () => {
  it('still returns price: 0 for an unknown-id row when no context provided (backward compat)', () => {
    const p = buildInvoiceAddPayloadFromCatalogRow({
      _id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
      name: 'Інтернет',
      fieldName: 'internetPrice',
    })
    expect(p.type).toBe(ServiceType.Custom)
    expect(p.price).toBe(0)
    expect(p.sum).toBe(0)
  })

  // New behavior: when context has a prev-payment match, the catalog→payload
  // conversion seeds price/sum from it instead of defaulting to 0.
  it('seeds price/sum from prevPayment custom invoice when service & company are empty', () => {
    const p = buildInvoiceAddPayloadFromCatalogRow(
      {
        _id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
        name: 'Інтернет',
        fieldName: 'internetPrice',
      },
      {
        prevPayment: {
          invoice: [
            {
              type: ServiceType.Custom,
              name: 'Інтернет',
              fieldName: 'internetPrice',
              price: 250,
              sum: 250,
            },
          ],
        },
      }
    )
    expect(p.type).toBe(ServiceType.Custom)
    expect(p.price).toBe(250)
    expect(p.sum).toBe(250)
  })

  it('prefers company over prevPayment when both are present', () => {
    const p = buildInvoiceAddPayloadFromCatalogRow(
      {
        _id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
        name: 'Інтернет',
        fieldName: 'internetPrice',
      },
      {
        company: {
          customServices: [
            {
              _id: 'cc' as any,
              label: 'Інтернет',
              fieldName: 'internetPrice',
              price: 333,
            },
          ],
        },
        prevPayment: {
          invoice: [
            {
              type: ServiceType.Custom,
              fieldName: 'internetPrice',
              price: 100,
              sum: 100,
            },
          ],
        },
      }
    )
    expect(p.price).toBe(333)
  })

  // Out-of-scope guard: utility (non-Custom) catalog rows should not be
  // touched by the new price-resolution path even when context is given.
  it('does not attach a price to utility-type rows even when context has data', () => {
    const id = defaultServices[1] // maps to ServiceType.Electricity
    const p = buildInvoiceAddPayloadFromCatalogRow(
      {
        _id: id,
        name: 'Електроенергія',
        fieldName: 'electricityPrice',
      },
      {
        prevPayment: {
          invoice: [
            {
              type: ServiceType.Custom,
              fieldName: 'electricityPrice',
              price: 999,
              sum: 999,
            },
          ],
        },
      }
    )
    expect(p.type).toBe(ServiceType.Electricity)
    expect(p.price).toBeUndefined()
    expect(p.sum).toBeUndefined()
  })

  it('catalogRowToSelectOption threads context through to the payload', () => {
    const opt = catalogRowToSelectOption(
      {
        _id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
        name: 'Прибирання',
        fieldName: 'cleaningCustom',
        groupName: 'Group',
      },
      {
        prevPayment: {
          invoice: [
            {
              type: ServiceType.Custom,
              fieldName: 'cleaningCustom',
              price: 75,
              sum: 75,
            },
          ],
        },
      }
    )
    expect(opt.payload.price).toBe(75)
    expect(opt.payload.sum).toBe(75)
  })
})
