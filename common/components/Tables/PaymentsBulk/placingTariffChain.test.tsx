/**
 * Ланцюжок тарифу Розміщення:
 *
 *   каталог домену -> місячна послуга -> getInvoices -> комірки /payment/bulk
 *
 * Правила, які фіксують ці тести:
 *  - Утримання бере тариф із service.rentPrice (саме туди AddServiceModal
 *    піднімає рядок каталогу з fieldName === 'rentPrice');
 *  - Розміщення бере СВІЙ тариф із service.customServices, включно з нулем;
 *  - фолбек Розміщення на service.rentPrice лишився тільки для легасі-доменів,
 *    у каталозі яких послуги «Розміщення» взагалі немає;
 *  - індивідуальні ціни компанії (pricePerMeter / servicePricePerMeter)
 *    перебивають місячні;
 *  - послуга, що має нативний рядок, більше не дублюється як custom.
 *
 * До виправлення незаповнене Розміщення мовчки брало тариф Утримання і
 * подвоювало рахунок, а заповнене — не рахувалось узагалі.
 */
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import serviceFilter from '@common/components/AddPaymentModal/serviceFilter'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'
import { invoiceCSFilter } from '@utils/helpers'
import { transliterateAndCamelCase } from '@utils/transliterateAndCamelCase'
import { act, render, waitFor } from '@testing-library/react'
import { Form } from 'antd'
import React from 'react'

import { buildBulkInvoiceMap } from './buildInvoiceMap'
import { getDefaultColumns } from './column.config'

// Контекст булку — комірки читають із нього форму (і service/prevService).
const mockBulkContext: { current: any } = { current: {} }
jest.mock('@common/components/DashboardPage/blocks/paymentsBulk', () => ({
  __esModule: true,
  useInvoicesPaymentContext: () => mockBulkContext.current,
}))

// eslint-disable-next-line import/first
import { MaintenancePrice, MaintenanceSum } from './cells/Maintenance'
// eslint-disable-next-line import/first
import { PlacingPrice, PlacingSum } from './cells/Placing'

// Закріплені _id сидів (UTILITY_SERVICE_ID_ENTRIES у utils/constants.ts).
const MAINTENANCE_SERVICE = {
  _id: '677d414283b6ef93c6b8ea2c',
  name: 'Утримання приміщень (грн/м²)',
  // Саме цей fieldName AddServiceModal піднімає в service.rentPrice.
  fieldName: 'rentPrice',
}
const PLACING_SERVICE = {
  _id: '682dd48d9665126611c81950',
  name: 'Розміщення',
  fieldName: 'placingPrice',
}

/** Каталог послуг домену — те, що повертає GET /api/custom-services/domain. */
const allowedServices = [MAINTENANCE_SERVICE, PLACING_SERVICE]

const MAINTENANCE_TARIFF = 10
const PLACING_TARIFF = 40
const TOTAL_AREA = 120

const customServiceItem = (
  svc: { _id: string; name: string; fieldName: string },
  price: number,
  fieldName = svc.fieldName
) => ({
  _id: svc._id as any,
  label: svc.name,
  fieldName,
  price,
})

/**
 * Місячна послуга у тому вигляді, у якому її зберігає AddServiceModal: рядок
 * каталогу з fieldName === 'rentPrice' підіймається в service.rentPrice,
 * решта лишається в service.customServices.
 */
const monthService = ({
  maintenance = MAINTENANCE_TARIFF,
  placing = PLACING_TARIFF,
  placingFieldName = PLACING_SERVICE.fieldName,
  withPlacingInCatalog = true,
}: {
  maintenance?: number
  placing?: number
  placingFieldName?: string
  withPlacingInCatalog?: boolean
} = {}): Partial<IService> => ({
  _id: 'month-service-1' as any,
  date: new Date('2026-09-01'),
  domain: { _id: 'domain-1' } as any,
  street: { _id: 'street-1' } as any,
  rentPrice: maintenance,
  electricityPrice: 0,
  waterPrice: 0,
  waterPriceTotal: 0,
  garbageCollectorPrice: 0,
  inflicionPrice: 0,
  customServices: [
    customServiceItem(MAINTENANCE_SERVICE, maintenance),
    ...(withPlacingInCatalog
      ? [customServiceItem(PLACING_SERVICE, placing, placingFieldName)]
      : []),
  ],
})

/**
 * Компанія без індивідуальних цін. pricePerMeter у моделі `default: 0`,
 * servicePricePerMeter не required — тому його в документі просто немає.
 */
const company = (
  overrides: Partial<IRealestate> = {}
): Partial<IRealestate> => ({
  _id: 'company-1' as any,
  companyName: 'ТОВ Без власних цін',
  domain: { _id: 'domain-1' } as any,
  street: { _id: 'street-1' } as any,
  totalArea: TOTAL_AREA,
  pricePerMeter: 0,
  inflicion: false,
  customServices: [],
  ...overrides,
})

const invoiceOf = (invoices: any[], type: ServiceType) =>
  invoices.find((inv) => inv?.type === type)

/** Рівно те, чим Table.tsx засіває `payments` у формі. */
const seedRow = (
  companyArg: Partial<IRealestate>,
  service: Partial<IService>
) => {
  const all = getInvoices({ company: companyArg, service })
  return {
    company: companyArg,
    invoice: buildBulkInvoiceMap(all, serviceFilter(all, allowedServices)),
  }
}

/**
 * Рендерить комірки Утримання/Розміщення одного рядка булку, засіявши форму
 * так само, як Table.tsx, і повертає читач значень із форми.
 */
const renderBulkRow = async (
  companyArg: Partial<IRealestate> = company(),
  service: Partial<IService> = monthService()
) => {
  let form: any

  const Harness: React.FC = () => {
    const [instance] = Form.useForm()
    form = instance
    mockBulkContext.current = {
      form: instance,
      service,
      prevService: null,
      prevPayments: [],
    }
    return (
      <Form form={instance}>
        <Form.List name="payments">
          {() => (
            <>
              <MaintenancePrice name={0} />
              <MaintenanceSum name={0} />
              <PlacingPrice name={0} />
              <PlacingSum name={0} />
            </>
          )}
        </Form.List>
      </Form>
    )
  }

  render(<Harness />)

  act(() => {
    form.setFieldsValue({ payments: [seedRow(companyArg, service)] })
  })

  const read = (type: ServiceType, field: 'price' | 'sum') =>
    form.getFieldValue(['payments', 0, 'invoice', type, field])

  await waitFor(() => {
    expect(read(ServiceType.Maintenance, 'sum')).toBeDefined()
    expect(read(ServiceType.Placing, 'sum')).toBeDefined()
  })

  return read
}

describe('1. Каталог домену -> колонки булку', () => {
  it('показує і «Утримання», і «Розміщення»', () => {
    const titles = (getDefaultColumns(jest.fn(), allowedServices) as any[])
      .map((col) => col?.title)
      .filter((title) => typeof title === 'string')

    expect(titles).toContain('Утримання')
    expect(titles).toContain('Розміщення')
    expect(titles).toContain('Площа, м²')
  })
})

describe('2. Кожна послуга бере СВІЙ тариф', () => {
  it('Утримання — із service.rentPrice', () => {
    const invoices = getInvoices({
      company: company(),
      service: monthService(),
    })

    expect(invoiceOf(invoices, ServiceType.Maintenance)).toEqual(
      expect.objectContaining({
        amount: TOTAL_AREA,
        price: MAINTENANCE_TARIFF,
        sum: TOTAL_AREA * MAINTENANCE_TARIFF,
      })
    )
  })

  it('Розміщення — зі свого рядка в service.customServices', () => {
    const invoices = getInvoices({
      company: company(),
      service: monthService(),
    })

    expect(invoiceOf(invoices, ServiceType.Placing)).toEqual(
      expect.objectContaining({
        amount: TOTAL_AREA,
        price: PLACING_TARIFF,
        sum: TOTAL_AREA * PLACING_TARIFF,
      })
    )
  })

  it('тарифи більше не злипаються в одну цифру', () => {
    const invoices = getInvoices({
      company: company(),
      service: monthService(),
    })

    expect(invoiceOf(invoices, ServiceType.Placing).price).not.toBe(
      invoiceOf(invoices, ServiceType.Maintenance).price
    )
  })

  it('працює і з транслітерованим fieldName послуги Розміщення', () => {
    // Послуга, створена через форму, має fieldName 'rozmishchennia';
    // сид — 'placingPrice'. Резолвер ловить обидва за закріпленим _id.
    const fieldName = transliterateAndCamelCase(PLACING_SERVICE.name)
    const invoices = getInvoices({
      company: company(),
      service: monthService({ placingFieldName: fieldName }),
    })

    expect(invoiceOf(invoices, ServiceType.Placing)).toEqual(
      expect.objectContaining({
        price: PLACING_TARIFF,
        sum: TOTAL_AREA * PLACING_TARIFF,
      })
    )
  })
})

describe('3. Незаповнене Розміщення = 0, а не тариф Утримання', () => {
  const service = () => monthService({ placing: 0 })

  it('Розміщення лишається нулем', () => {
    const invoices = getInvoices({ company: company(), service: service() })

    expect(invoiceOf(invoices, ServiceType.Placing)).toEqual(
      expect.objectContaining({ price: 0, sum: 0 })
    )
  })

  it('Утримання при цьому рахується як і раніше', () => {
    const invoices = getInvoices({ company: company(), service: service() })

    expect(invoiceOf(invoices, ServiceType.Maintenance)).toEqual(
      expect.objectContaining({
        price: MAINTENANCE_TARIFF,
        sum: TOTAL_AREA * MAINTENANCE_TARIFF,
      })
    )
  })

  it('у рахунок іде тільки Утримання — подвоєння немає', async () => {
    const read = await renderBulkRow(company(), service())

    expect(read(ServiceType.Maintenance, 'sum')).toBe(
      TOTAL_AREA * MAINTENANCE_TARIFF
    )
    expect(read(ServiceType.Placing, 'sum')).toBe(0)
  })
})

describe('4. Легасі-домени: фолбек на rentPrice збережено', () => {
  it('без послуги «Розміщення» в каталозі тариф береться з rentPrice', () => {
    const invoices = getInvoices({
      company: company(),
      service: monthService({ withPlacingInCatalog: false }),
    })

    expect(invoiceOf(invoices, ServiceType.Placing)).toEqual(
      expect.objectContaining({
        price: MAINTENANCE_TARIFF,
        sum: TOTAL_AREA * MAINTENANCE_TARIFF,
      })
    )
  })

  it('щойно послуга з’являється в каталозі — фолбек вимикається', () => {
    const legacy = getInvoices({
      company: company(),
      service: monthService({ withPlacingInCatalog: false }),
    })
    const migrated = getInvoices({
      company: company(),
      service: monthService({ placing: 0 }),
    })

    expect(invoiceOf(legacy, ServiceType.Placing).price).toBe(
      MAINTENANCE_TARIFF
    )
    expect(invoiceOf(migrated, ServiceType.Placing).price).toBe(0)
  })
})

describe('5. Індивідуальні ціни компанії перебивають місячні', () => {
  it('pricePerMeter -> тільки Розміщення', () => {
    const invoices = getInvoices({
      company: company({ pricePerMeter: 25 }),
      service: monthService(),
    })

    expect(invoiceOf(invoices, ServiceType.Placing)).toEqual(
      expect.objectContaining({ price: 25, sum: TOTAL_AREA * 25 })
    )
    expect(invoiceOf(invoices, ServiceType.Maintenance).price).toBe(
      MAINTENANCE_TARIFF
    )
  })

  it('servicePricePerMeter -> тільки Утримання', () => {
    const invoices = getInvoices({
      company: company({ servicePricePerMeter: 7 } as Partial<IRealestate>),
      service: monthService(),
    })

    expect(invoiceOf(invoices, ServiceType.Maintenance)).toEqual(
      expect.objectContaining({ price: 7, sum: TOTAL_AREA * 7 })
    )
    expect(invoiceOf(invoices, ServiceType.Placing).price).toBe(PLACING_TARIFF)
  })

  it('servicePricePerMeter = 0 -> рядка Утримання немає взагалі', () => {
    const invoices = getInvoices({
      company: company({ servicePricePerMeter: 0 } as Partial<IRealestate>),
      service: monthService(),
    })

    expect(invoiceOf(invoices, ServiceType.Maintenance)).toBeUndefined()
    expect(invoiceOf(invoices, ServiceType.Placing).price).toBe(PLACING_TARIFF)
  })
})

describe('6. Фантомних custom-рядків більше немає', () => {
  it.each([
    ['fieldName сида', PLACING_SERVICE.fieldName],
    ['транслітерований fieldName', transliterateAndCamelCase('Розміщення')],
  ])(
    'послуга з нативним рядком не дублюється як custom (%s)',
    (_label, placingFieldName) => {
      const invoices = getInvoices({
        company: company(),
        service: monthService({ placingFieldName }),
      })

      expect(
        invoices.filter((inv) => inv.type === ServiceType.Custom)
      ).toHaveLength(0)
    }
  )

  it('Утримання теж більше не дублюється рядком за fieldName rentPrice', () => {
    const row = seedRow(company(), monthService())

    expect(row.invoice['rentPrice']).toBeUndefined()
  })

  it('у рахунок іде рівно дві позиції — Утримання і Розміщення', () => {
    const row = seedRow(company(), monthService())
    const submitted = invoiceCSFilter(
      Object.values(row.invoice).filter((inv: any) => inv.sum)
    )

    expect(submitted).toHaveLength(2)
    expect(submitted.map((inv: any) => inv.type).sort()).toEqual(
      [ServiceType.Maintenance, ServiceType.Placing].sort()
    )
  })

  it('per-domain копія лишається окремою custom-послугою', () => {
    // Власний _id + свій fieldName -> не сид, має власну колонку-формулу.
    const copy = {
      _id: '68a0000000000000000000a1' as any,
      label: 'Прибирання даху',
      fieldName: 'prybyranniaDakhu',
      price: 500,
    }
    const service = monthService()
    const invoices = getInvoices({
      company: company(),
      service: {
        ...service,
        customServices: [...service.customServices, copy],
      },
    })

    expect(invoices).toContainEqual(
      expect.objectContaining({
        type: ServiceType.Custom,
        fieldName: copy.fieldName,
        price: 500,
      })
    )
  })
})

describe('7. Що саме видно в комірках /payment/bulk', () => {
  it('колонки показують свої тарифи і свої суми', async () => {
    const read = await renderBulkRow()

    expect(read(ServiceType.Maintenance, 'price')).toBe(MAINTENANCE_TARIFF)
    expect(read(ServiceType.Maintenance, 'sum')).toBe(
      TOTAL_AREA * MAINTENANCE_TARIFF
    )
    expect(read(ServiceType.Placing, 'price')).toBe(PLACING_TARIFF)
    expect(read(ServiceType.Placing, 'sum')).toBe(TOTAL_AREA * PLACING_TARIFF)
  })

  it('заповнене тільки Розміщення -> рахується саме воно', async () => {
    const read = await renderBulkRow(
      company(),
      monthService({ maintenance: 0, placing: PLACING_TARIFF })
    )

    expect(read(ServiceType.Placing, 'price')).toBe(PLACING_TARIFF)
    expect(read(ServiceType.Placing, 'sum')).toBe(TOTAL_AREA * PLACING_TARIFF)
    expect(read(ServiceType.Maintenance, 'sum')).toBe(0)
  })

  it('індивідуальний pricePerMeter видно в колонці Розміщення', async () => {
    const read = await renderBulkRow(company({ pricePerMeter: 25 }))

    expect(read(ServiceType.Placing, 'sum')).toBe(TOTAL_AREA * 25)
    expect(read(ServiceType.Maintenance, 'sum')).toBe(
      TOTAL_AREA * MAINTENANCE_TARIFF
    )
  })
})
