import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { keepInvoiceRow } from '@common/components/AddPaymentModal/invoiceRowFilter'
import serviceFilter from '@common/components/AddPaymentModal/serviceFilter'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'

describe('getInvoices - default services without a month service', () => {
  const company: Partial<IRealestate> = {
    totalArea: 50,
    garbageCollector: true,
    rentPart: 10,
    customServices: [
      {
        _id: '65b8a9f4a35a75f7da9f1011' as any,
        label: 'Інтернет',
        fieldName: 'internetPrice',
        price: 300,
      },
    ],
  }

  const types = (invoices: { type?: string }[]) =>
    invoices.map((invoice) => invoice.type)

  it.each([
    ['service = null', null],
    ['service = undefined', undefined],
    ['service = {}', {}],
  ])('seeds the default rows at zero price when %s', (_, service) => {
    const invoices = getInvoices({ company, service })

    expect(invoices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: ServiceType.Maintenance,
          amount: 50,
          price: 0,
          sum: 0,
        }),
        expect.objectContaining({
          type: ServiceType.Electricity,
          price: 0,
          sum: 0,
        }),
        expect.objectContaining({ type: ServiceType.Water, price: 0, sum: 0 }),
        expect.objectContaining({
          type: ServiceType.GarbageCollector,
          price: 0,
          sum: 0,
        }),
        expect.objectContaining({ type: ServiceType.Discount }),
      ])
    )
  })

  it('seeds the company custom services when there is no month service', () => {
    const invoices = getInvoices({ company, service: null })

    expect(invoices).toContainEqual(
      expect.objectContaining({
        type: ServiceType.Custom,
        fieldName: 'internetPrice',
        price: 300,
        sum: 300,
      })
    )
  })

  it('produces the same rows as a freshly created (zero-priced) month service', () => {
    const zeroMonthService: Partial<IService> = {
      rentPrice: 0,
      electricityPrice: 0,
      waterPrice: 0,
      waterPriceTotal: 0,
      garbageCollectorPrice: 0,
      inflicionPrice: 0,
      customServices: [],
    }

    expect(getInvoices({ company, service: null })).toEqual(
      getInvoices({ company, service: zeroMonthService })
    )
  })

  it('still takes prices from the month service when it exists', () => {
    const invoices = getInvoices({
      company,
      service: { electricityPrice: 7.5, waterPrice: 40, rentPrice: 12 },
    })

    expect(invoices).toContainEqual(
      expect.objectContaining({ type: ServiceType.Electricity, price: 7.5 })
    )
    expect(invoices).toContainEqual(
      expect.objectContaining({ type: ServiceType.Water, price: 40 })
    )
    expect(invoices).toContainEqual(
      expect.objectContaining({
        type: ServiceType.Maintenance,
        price: 12,
        sum: 600,
      })
    )
  })

  it('does not require an address on the month service', () => {
    const service: Partial<IService> = {
      electricityPrice: 5,
      street: undefined,
    }

    expect(getInvoices({ company, service })).toContainEqual(
      expect.objectContaining({ type: ServiceType.Electricity, price: 5 })
    )
  })

  it('returns nothing when there is neither a company nor a saved payment', () => {
    expect(getInvoices({ company: null, service: null })).toEqual([])
  })

  it('keeps a saved payment untouched regardless of the month service', () => {
    const payment = {
      invoice: [
        {
          type: ServiceType.Electricity,
          price: 3,
          amount: 10,
          lastAmount: 4,
          sum: 18,
        },
      ],
    }

    expect(types(getInvoices({ company, service: null, payment }))).toEqual(
      types(
        getInvoices({ company, service: { electricityPrice: 99 }, payment })
      )
    )
  })

  describe('invoice modal pipeline (serviceFilter + keepInvoiceRow)', () => {
    const domainServices = [
      { _id: 'e', name: 'Електрика', fieldName: ServiceType.Electricity },
      { _id: 'm', name: 'Утримання', fieldName: 'rentPrice' },
      {
        _id: 'g',
        name: 'Вивіз сміття',
        fieldName: ServiceType.GarbageCollector,
      },
    ]

    const seed = (service: Partial<IService> | null) =>
      serviceFilter(getInvoices({ company, service }), domainServices).filter(
        keepInvoiceRow
      )

    it('shows the domain default services when no month service exists', () => {
      expect(types(seed(null))).toEqual(
        expect.arrayContaining([
          ServiceType.Maintenance,
          ServiceType.Electricity,
          ServiceType.GarbageCollector,
        ])
      )
    })

    it('shows the same default services with or without a month service', () => {
      // a saved month service always carries every price (model defaults to 0)
      const savedMonthService: Partial<IService> = {
        rentPrice: 1,
        electricityPrice: 5,
        waterPrice: 0,
        waterPriceTotal: 0,
        garbageCollectorPrice: 0,
        inflicionPrice: 0,
        customServices: [],
      }

      expect(types(seed(null)).sort()).toEqual(
        types(seed(savedMonthService)).sort()
      )
    })
  })
})
