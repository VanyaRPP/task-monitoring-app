/**
 * Per-domain послуга з serviceType = Розміщення:
 *
 *   каталог домену -> Payment Bulk (формула м² × тариф) -> інвойс
 *
 * Те саме, що вже працює для електрики й води, але для типу «за площею».
 * Правила, які фіксують ці тести:
 *  - назва лишається кастомною, а формула береться від Розміщення;
 *  - рядок засівається площею компанії, а не показником лічильника;
 *  - тариф живе в рядку (ціна компанії > ціна з місячної послуги);
 *  - нативну колонку Розміщення така послуга НЕ дублює;
 *  - інфляція індексує тільки нативний рядок, не копію.
 */
import { ServiceType } from '@utils/constants'
import {
  buildTypedCustomColumn,
  getDefaultColumns,
  hasTypedColumn,
  resolveCommunalType,
  resolveServiceType,
  applyCustomColumnGate,
} from './column.config'
import { buildInvoiceAddPayloadFromCatalogRow } from '@utils/domain/domain-invoice-selector'
import { getInvoices } from '@utils/getInvoices'
import { act, render, waitFor } from '@testing-library/react'
import { Form } from 'antd'
import React from 'react'

const mockBulkContext: { current: any } = { current: {} }
jest.mock('@common/components/DashboardPage/blocks/paymentsBulk', () => ({
  __esModule: true,
  useInvoicesPaymentContext: () => mockBulkContext.current,
}))

// eslint-disable-next-line import/first
import { PlacingSum, PlacingPrice } from './cells/Placing'
// eslint-disable-next-line import/first
import { buildTypedInvoiceEntry } from './buildTypedInvoiceEntry'

/** Per-domain копія: власний _id, своя назва, тег serviceType. */
const CUSTOM_SERVICE = {
  _id: '68a0000000000000000000b7',
  name: 'Розміщення (паркінг)',
  fieldName: 'rozmishchenniaParkinh',
  serviceType: ServiceType.Placing,
}

const CUSTOM_TARIFF = 80
const COMPANY_TARIFF = 95
const TOTAL_AREA = 40

const monthService = (price: number = CUSTOM_TARIFF) => ({
  _id: 'month-service-1',
  date: new Date('2026-09-01'),
  domain: { _id: 'domain-1' },
  street: { _id: 'street-1' },
  rentPrice: 10,
  customServices: [
    {
      _id: CUSTOM_SERVICE._id,
      label: CUSTOM_SERVICE.name,
      fieldName: CUSTOM_SERVICE.fieldName,
      price,
    },
  ],
})

const company = (customPrice: number | null = 0, overrides: any = {}) => ({
  _id: 'company-1',
  companyName: 'ТОВ Паркінг',
  totalArea: TOTAL_AREA,
  pricePerMeter: 0,
  inflicion: false,
  customServices: [
    {
      _id: CUSTOM_SERVICE._id,
      label: CUSTOM_SERVICE.name,
      fieldName: CUSTOM_SERVICE.fieldName,
      price: customPrice,
    },
  ],
  ...overrides,
})

const typedEntry = (
  companyArg: any = company(),
  service: any = monthService()
) =>
  buildTypedInvoiceEntry({
    customService: CUSTOM_SERVICE,
    serviceType: ServiceType.Placing,
    company: companyArg,
    service,
    prevReading: 0,
  })

/** Рендерить пару комірок булку під заданим ключем рядка. */
const renderCells = async (
  fieldName: string,
  row: { company: any; invoice: Record<string, any> },
  service: any = monthService()
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
              <PlacingPrice name={0} fieldName={fieldName} />
              <PlacingSum name={0} fieldName={fieldName} />
            </>
          )}
        </Form.List>
      </Form>
    )
  }

  render(<Harness />)
  act(() => {
    form.setFieldsValue({ payments: [row] })
  })

  await waitFor(() => {
    expect(
      form.getFieldValue(['payments', 0, 'invoice', fieldName, 'sum'])
    ).toBeDefined()
  })

  return (field: 'price' | 'sum') =>
    form.getFieldValue(['payments', 0, 'invoice', fieldName, field])
}

describe('1. Каталог -> тип і колонка', () => {
  it('serviceType робить послугу Розміщенням', () => {
    expect(resolveServiceType(CUSTOM_SERVICE)).toBe(ServiceType.Placing)
  })

  it('але НЕ вмикає нативну колонку Розміщення', () => {
    expect(resolveCommunalType(CUSTOM_SERVICE)).toBeUndefined()
  })

  it('Розміщення тепер має власний білдер колонки', () => {
    expect(hasTypedColumn(ServiceType.Placing)).toBe(true)
  })

  it('колонка будується з кастомною назвою і формулою Розміщення', () => {
    const column: any = buildTypedCustomColumn(CUSTOM_SERVICE, {
      key: CUSTOM_SERVICE._id,
    })

    expect(column.title).toBe(CUSTOM_SERVICE.name)
    expect(column.children.map((child: any) => child.title)).toEqual([
      'За м²',
      'Загальне',
    ])
  })

  it('колонка «Площа, м²» вмикається і без сидованого Розміщення', () => {
    const titles = (getDefaultColumns(jest.fn(), [CUSTOM_SERVICE]) as any[])
      .map((col) => col?.title)
      .filter((title) => typeof title === 'string')

    expect(titles).toContain('Площа, м²')
    // Нативної колонки «Розміщення» серед них немає — лише власна колонка
    // послуги, яку Table.tsx додає окремо.
    expect(titles).not.toContain('Розміщення')
  })
})

describe('2. Засів рядка: площа, а не лічильник', () => {
  it('amount = площа компанії, lastAmount не ставиться', () => {
    const entry: any = typedEntry()

    expect(entry.amount).toBe(TOTAL_AREA)
    expect(entry.lastAmount).toBeUndefined()
  })

  it('рядок іде типом Розміщення зі своїм serviceId і кастомною назвою', () => {
    const entry: any = typedEntry()

    expect(entry).toEqual(
      expect.objectContaining({
        type: ServiceType.Placing,
        serviceId: CUSTOM_SERVICE._id,
        customName: CUSTOM_SERVICE.name,
        fieldName: CUSTOM_SERVICE.fieldName,
      })
    )
  })

  it('тариф береться з місячної послуги, коли в компанії 0', () => {
    expect(typedEntry().price).toBe(CUSTOM_TARIFF)
  })

  it('індивідуальна ціна компанії перебиває місячну', () => {
    expect(typedEntry(company(COMPANY_TARIFF)).price).toBe(COMPANY_TARIFF)
  })

  it('площа 0 не робить NaN', () => {
    const entry: any = typedEntry(company(0, { totalArea: undefined }))

    expect(entry.amount).toBe(0)
  })
})

describe('3. Булк рахує м² × тариф', () => {
  const row = (companyArg: any = company()) => ({
    company: companyArg,
    invoice: { [CUSTOM_SERVICE._id]: typedEntry(companyArg) },
  })

  it('«Загальне» = площа × тариф рядка', async () => {
    const read = await renderCells(CUSTOM_SERVICE._id, row())

    expect(read('price')).toBe(CUSTOM_TARIFF)
    expect(read('sum')).toBe(TOTAL_AREA * CUSTOM_TARIFF)
  })

  it('рахує з індивідуального тарифу компанії', async () => {
    const companyArg = company(COMPANY_TARIFF)
    const read = await renderCells(CUSTOM_SERVICE._id, row(companyArg))

    expect(read('sum')).toBe(TOTAL_AREA * COMPANY_TARIFF)
  })

  it('інфляція компанії НЕ індексує per-domain копію', async () => {
    // Нативний рядок під інфляцією стає абсолютною сумою; копія лишається
    // «м² × тариф», інакше одна компанія індексувалася б двічі.
    const companyArg = company(0, { inflicion: true })
    const read = await renderCells(CUSTOM_SERVICE._id, row(companyArg))

    expect(read('sum')).toBe(TOTAL_AREA * CUSTOM_TARIFF)
  })

  it('нативний рядок під інфляцією поводиться як і раніше', async () => {
    const companyArg = company(0, { inflicion: true })
    const read = await renderCells(ServiceType.Placing, {
      company: companyArg,
      invoice: {
        [ServiceType.Placing]: {
          type: ServiceType.Placing,
          price: 1234,
          sum: 0,
        },
      },
    })

    // Інфляційний рядок — абсолютна сума, площа не множиться.
    expect(read('sum')).toBe(1234)
  })
})

describe('4. Булк -> інвойс', () => {
  it('булк і каталог інвойсу створюють рядок одного типу', () => {
    const fromCatalog = buildInvoiceAddPayloadFromCatalogRow(
      CUSTOM_SERVICE as any,
      { company: company(), service: monthService() } as any
    )

    expect(fromCatalog).toEqual(
      expect.objectContaining({
        type: ServiceType.Placing,
        serviceId: CUSTOM_SERVICE._id,
        customName: CUSTOM_SERVICE.name,
      })
    )
    expect(typedEntry().type).toBe(fromCatalog.type)
  })

  it('повторне відкриття платежу не зливає копію з нативним Розміщенням', () => {
    const payment = {
      invoice: [
        { type: ServiceType.Placing, amount: 120, price: 10, sum: 1200 },
        typedEntry(),
      ],
    }

    const invoices = getInvoices({
      company: company() as any,
      service: monthService() as any,
      payment: payment as any,
    })

    const placingRows = invoices.filter(
      (inv) => inv.type === ServiceType.Placing
    )

    expect(placingRows).toHaveLength(2)
    expect(
      placingRows.find((inv) => inv.serviceId === CUSTOM_SERVICE._id)
    ).toEqual(
      expect.objectContaining({
        customName: CUSTOM_SERVICE.name,
        amount: TOTAL_AREA,
      })
    )
  })
})

/**
 * Відтворює диспетчер колонок із Table.tsx: applyCustomColumnGate вирішує, чи
 * ховати клітинки на рядках компаній, які послугу не «несуть».
 *
 * Для типів «за площею» гейту немає — вони комунальні, як нативне Розміщення.
 * Це і був блокер: послуга, дописана в каталог домену, не рендерилась ніде,
 * бо прив'язка до компаній відбувається лише при СТВОРЕННІ послуги.
 */
describe('5. Гейт «компанія несе послугу» не діє на типи «за площею»', () => {
  const gated = (service: any) =>
    applyCustomColumnGate(
      buildTypedCustomColumn(CUSTOM_SERVICE, { key: CUSTOM_SERVICE._id }),
      service,
      { serviceKey: CUSTOM_SERVICE._id, fieldName: CUSTOM_SERVICE.fieldName }
    )

  const renderCell = async (companyArg: any, service: any = CUSTOM_SERVICE) => {
    const column: any = gated(service)

    let form: any
    const Harness: React.FC = () => {
      const [instance] = Form.useForm()
      form = instance
      mockBulkContext.current = {
        form: instance,
        service: monthService(),
        prevService: null,
        prevPayments: [],
      }
      return (
        <Form form={instance}>
          <Form.List name="payments">
            {() => <>{column.children[0].render(null, { name: 0 }, 0)}</>}
          </Form.List>
        </Form>
      )
    }

    const utils = render(<Harness />)
    act(() => {
      form.setFieldsValue({
        payments: [
          {
            company: companyArg,
            invoice: { [CUSTOM_SERVICE._id]: typedEntry(companyArg) },
          },
        ],
      })
    })
    await waitFor(() => expect(form.getFieldValue('payments')).toHaveLength(1))

    return utils.container
  }

  it('компанія БЕЗ запису про послугу все одно бачить клітинку', async () => {
    const container = await renderCell({ ...company(), customServices: [] })

    expect(container.querySelector('input')).not.toBeNull()
  })

  it('і з price = null теж — гейт тут не застосовується', async () => {
    const container = await renderCell(company(null))

    expect(container.querySelector('input')).not.toBeNull()
  })

  it('тариф такій компанії падає на місячну послугу', async () => {
    const entry: any = buildTypedInvoiceEntry({
      customService: CUSTOM_SERVICE,
      serviceType: ServiceType.Placing,
      company: { ...company(), customServices: [] },
      service: monthService(),
      prevReading: 0,
    })

    expect(entry.price).toBe(CUSTOM_TARIFF)
  })

  it('лічильник (електрика) гейт зберігає', async () => {
    const meter = {
      _id: CUSTOM_SERVICE._id,
      name: 'Електрика (склад)',
      fieldName: 'elektrykaSklad',
      serviceType: ServiceType.Electricity,
    }
    const container = await renderCell(
      { ...company(), customServices: [] },
      meter
    )

    expect(container.querySelector('input')).toBeNull()
  })
})
