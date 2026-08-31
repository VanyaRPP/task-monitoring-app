/**
 * Ланцюжок тарифу для per-domain послуги з serviceType = Електропостачання:
 *
 *   сторінка послуги (ціна за кВт)  ->  Payment Bulk (формула)  ->  інвойс
 *
 * Правила, які фіксують ці тести:
 *  - ціна такої послуги живе в service.customServices[].price (сторінка послуги),
 *    індивідуальна ціна компанії її перебиває, 0/порожньо = «не задано»;
 *  - булк рахує суму з тарифу САМОГО рядка, а не з нативного electricityPrice;
 *  - булк зберігає рядок тим самим типом, яким його додає інвойс із каталогу,
 *    тому інвойс рахує ту саму суму і не перетирає її.
 */
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'
import {
  buildInvoiceAddPayloadFromCatalogRow,
  resolveCustomServicePrice,
} from '@utils/domain/domain-invoice-selector'
import { act, render, waitFor } from '@testing-library/react'
import { Form } from 'antd'
import React from 'react'

// --- контекст Payment Bulk (для комірок булку) -----------------------------
const mockBulkContext: { current: any } = { current: {} }
jest.mock('@common/components/DashboardPage/blocks/paymentsBulk', () => ({
  __esModule: true,
  useInvoicesPaymentContext: () => mockBulkContext.current,
}))

// --- контекст інвойсу (для комірок EditInvoiceTable) -----------------------
jest.mock('@components/AddPaymentModal', () => ({
  __esModule: true,
  usePaymentContext: () => ({}),
}))
jest.mock('@modules/hooks/useInvoiceCurrency', () => ({
  __esModule: true,
  useInvoiceCurrency: () => 'UAH',
}))

// eslint-disable-next-line import/first
import { ElectricitySum } from './cells/Electricity'
// eslint-disable-next-line import/first
import ElectricityInvoiceRow from '../EditInvoiceTable/Electricity'
// eslint-disable-next-line import/first
import { LossesCollapse } from '@components/Losses/LossesCollapse'
// eslint-disable-next-line import/first
import { buildTypedInvoiceEntry } from './buildTypedInvoiceEntry'

const CUSTOM_SERVICE = {
  _id: '68a0000000000000000000a1',
  name: 'Електрика (склад)',
  fieldName: 'elektrykasklad',
  serviceType: ServiceType.Electricity,
}

/** Тариф, який адмін вписав цій послузі на сторінці послуги. */
const CUSTOM_TARIFF = 8
/** Нативний тариф електрики домену — має бути НЕ задіяний для цієї послуги. */
const NATIVE_TARIFF = 10

const LAST_READING = 120
const NEW_READING = 150
const CONSUMED = NEW_READING - LAST_READING // 30 кВт

/**
 * Місячна послуга у вигляді, в якому її зберігає сторінка послуги
 * (AddServiceModal.handleSubmit): нативні тарифи витягуються з рядків
 * customServices ЗА fieldName ('electricityPrice' -> service.electricityPrice),
 * а решта рядків лишаються у service.customServices зі своєю ціною.
 */
const monthService = (
  nativeElectricityPrice: number,
  { losses = 0, customPrice = CUSTOM_TARIFF } = {}
) => ({
  _id: 'month-service-1',
  date: new Date('2026-08-01'),
  domain: { _id: 'domain-1' },
  street: { _id: 'street-1' },
  electricityPrice: nativeElectricityPrice,
  waterPrice: 0,
  losses,
  customServices: [
    {
      _id: CUSTOM_SERVICE._id,
      label: CUSTOM_SERVICE.name,
      fieldName: CUSTOM_SERVICE.fieldName,
      price: customPrice,
    },
  ],
})

const companyWithPrice = (price: number | null) => ({
  _id: 'company-1',
  companyName: 'ТОВ Склад',
  customServices: [
    {
      _id: CUSTOM_SERVICE._id,
      label: CUSTOM_SERVICE.name,
      fieldName: CUSTOM_SERVICE.fieldName,
      price,
    },
  ],
})

/** Компанія, якій послугу роздав бекенд-каскад (price: 0). */
const company = companyWithPrice(0)

const typedEntry = (service: any, companyArg: any = company) =>
  buildTypedInvoiceEntry({
    customService: CUSTOM_SERVICE,
    serviceType: ServiceType.Electricity,
    company: companyArg,
    service,
    prevReading: LAST_READING,
  })

/**
 * Рендерить комірку "Загальне" булку з рядком, засіяним так само, як це робить
 * Table.tsx, вводить новий показник і повертає порахований sum.
 */
const bulkSum = async (service: any, companyArg: any = company) => {
  const key = CUSTOM_SERVICE._id
  let form: any

  const Harness: React.FC = () => {
    const [instance] = Form.useForm()
    form = instance
    mockBulkContext.current = { form: instance, service }
    return (
      <Form form={instance}>
        <Form.List name="payments">
          {() => <ElectricitySum name={0} fieldName={key} />}
        </Form.List>
      </Form>
    )
  }

  render(<Harness />)

  const entry: any = typedEntry(service, companyArg)
  act(() => {
    for (const field of ['price', 'losses', 'lastAmount'] as const) {
      form.setFieldValue(['payments', 0, 'invoice', key, field], entry[field])
    }
    form.setFieldValue(['payments', 0, 'invoice', key, 'amount'], NEW_READING)
  })

  await waitFor(() => {
    expect(
      form.getFieldValue(['payments', 0, 'invoice', key, 'sum'])
    ).toBeDefined()
  })

  return form.getFieldValue(['payments', 0, 'invoice', key, 'sum'])
}

/** Проєкція рядка інвойсу, яку робить Header.tsx перед відправкою. */
const submittedLines = (invoice: Record<string, any>) =>
  Object.values(invoice).filter(({ sum }: any) => sum)

describe('1. сторінка послуги -> місячна послуга', () => {
  it('ціна типізованої послуги живе в service.customServices, а не в electricityPrice', () => {
    const service = monthService(0)

    // AddServiceModal мапить у service.electricityPrice ЛИШЕ рядок із
    // fieldName === 'electricityPrice' (нативна послуга домену).
    expect(service.electricityPrice).toBe(0)
    expect(
      service.customServices.find(
        (s) => s.fieldName === CUSTOM_SERVICE.fieldName
      )?.price
    ).toBe(CUSTOM_TARIFF)

    // Саме цю ціну бачить інвойс (resolveCustomServicePrice).
    expect(
      resolveCustomServicePrice(CUSTOM_SERVICE.fieldName, {
        company: companyWithPrice(null),
        service,
      } as any)
    ).toBe(CUSTOM_TARIFF)
  })
})

describe('1b. сторінка послуги: формула втрат', () => {
  // LossesCollapse шукає рядок customServices із fieldName === 'electricityPrice'.
  const renderLosses = (customServices: any[], general: number) => {
    let form: any
    const Harness: React.FC = () => {
      const [instance] = Form.useForm()
      form = instance
      return (
        <Form
          form={instance}
          initialValues={{
            customServices,
            consumedElectricity: 1000,
            generalElectricity: general,
          }}
        >
          <Form.List name="customServices">
            {(fields) =>
              fields.map((field) => (
                <Form.Item key={field.key} name={[field.name, 'price']}>
                  <input />
                </Form.Item>
              ))
            }
          </Form.List>
          <LossesCollapse form={instance} name="losses" />
        </Form>
      )
    }
    const utils = render(<Harness />)
    return { ...utils, getForm: () => form }
  }

  it('рахує % втрат від НАТИВНОГО тарифу electricityPrice', async () => {
    // тариф з ПДВ 12 -> без ПДВ 10; 10 × 1000 = 10000; факт 11000 -> +10%
    const { getForm } = renderLosses(
      [
        {
          fieldName: ServiceType.Electricity,
          label: 'Електропостачання',
          price: 12,
        },
      ],
      11000
    )

    await waitFor(() => {
      expect(getForm().getFieldValue('losses')).toBe(10)
    })
  })

  it('без нативної електрики блок втрат не показується — втрати домену не рахуються', async () => {
    const { queryByText, getForm } = renderLosses(
      [
        {
          fieldName: CUSTOM_SERVICE.fieldName,
          label: CUSTOM_SERVICE.name,
          price: 12,
        },
      ],
      11000
    )

    expect(queryByText(/Втрати в трансформаторі/)).not.toBeInTheDocument()
    expect(getForm().getFieldValue('losses')).toBeUndefined()
  })
})

describe('2. місячна послуга -> Payment Bulk', () => {
  it('рядок отримує тариф самої послуги, а не нативний', () => {
    expect(typedEntry(monthService(NATIVE_TARIFF)).price).toBe(CUSTOM_TARIFF)
  })

  it('індивідуальна ціна компанії перебиває місячну', () => {
    expect(
      typedEntry(monthService(NATIVE_TARIFF), companyWithPrice(6)).price
    ).toBe(6)
  })

  it.each([[0], [null]])(
    'price = %p у компанії означає «не задано» і падає на місячний тариф',
    (price) => {
      expect(
        typedEntry(monthService(NATIVE_TARIFF), companyWithPrice(price)).price
      ).toBe(CUSTOM_TARIFF)
    }
  )

  it('рахує суму за тарифом послуги, а не за нативним electricityPrice', async () => {
    await expect(bulkSum(monthService(NATIVE_TARIFF))).resolves.toBe(
      CONSUMED * CUSTOM_TARIFF
    )
  })

  it('працює і коли в домені взагалі немає нативної електрики', async () => {
    const sum = await bulkSum(monthService(0))

    expect(sum).toBe(CONSUMED * CUSTOM_TARIFF)

    // Header.tsx: invoice = Object.values(...).filter(({ sum }) => sum)
    const invoice = {
      [CUSTOM_SERVICE._id]: { ...typedEntry(monthService(0)), sum },
    }
    expect(submittedLines(invoice)).toHaveLength(1)
  })

  it('застосовує втрати домену і зберігає їх у рядку', async () => {
    const service = monthService(NATIVE_TARIFF, { losses: 10 })

    expect(typedEntry(service).losses).toBe(10)
    // (30 + 10%) × 8 = 264
    await expect(bulkSum(service)).resolves.toBe(
      (CONSUMED + CONSUMED * 0.1) * CUSTOM_TARIFF
    )
  })
})

describe('3. Payment Bulk -> інвойс', () => {
  it('булк і каталог інвойсу створюють рядок одного типу', () => {
    const fromBulk = typedEntry(monthService(NATIVE_TARIFF))

    const fromInvoiceCatalog = buildInvoiceAddPayloadFromCatalogRow(
      {
        _id: CUSTOM_SERVICE._id,
        name: CUSTOM_SERVICE.name,
        fieldName: CUSTOM_SERVICE.fieldName,
        serviceType: CUSTOM_SERVICE.serviceType,
      },
      { company, service: monthService(NATIVE_TARIFF) } as any
    )

    expect(fromBulk.type).toBe(ServiceType.Electricity)
    expect(fromBulk.type).toBe(fromInvoiceCatalog.type)
    expect(String(fromBulk.serviceId)).toBe(
      String(fromInvoiceCatalog.serviceId)
    )
  })

  it('інвойс рахує ту саму суму і не перетирає її', async () => {
    const savedLine = {
      ...typedEntry(monthService(NATIVE_TARIFF)),
      amount: NEW_READING,
      sum: CONSUMED * CUSTOM_TARIFF,
    }

    let form: any
    const Harness: React.FC = () => {
      const [instance] = Form.useForm()
      form = instance
      return (
        <Form form={instance} initialValues={{ invoice: [savedLine] }}>
          <Form.List name="invoice">
            {() => (
              <>
                <ElectricityInvoiceRow.Amount
                  form={instance}
                  name={0}
                  record={savedLine as any}
                  editable
                />
                <ElectricityInvoiceRow.Price
                  form={instance}
                  name={0}
                  record={savedLine as any}
                  editable
                />
                <ElectricityInvoiceRow.Sum
                  form={instance}
                  name={0}
                  record={savedLine as any}
                />
              </>
            )}
          </Form.List>
        </Form>
      )
    }

    render(<Harness />)

    await waitFor(() => {
      expect(form.getFieldValue(['invoice', 0, 'sum'])).toBe(
        CONSUMED * CUSTOM_TARIFF
      )
    })
  })

  it('повторне відкриття платежу зберігає рядок і не зливає його з нативним', () => {
    const service = monthService(NATIVE_TARIFF)
    const savedLine = {
      ...typedEntry(service),
      amount: NEW_READING,
      sum: CONSUMED * CUSTOM_TARIFF,
    }
    const nativeLine = {
      type: ServiceType.Electricity,
      price: NATIVE_TARIFF,
      lastAmount: 500,
      amount: 560,
      sum: 600,
    }

    const rows = getInvoices({
      company: company as any,
      service: service as any,
      payment: { invoice: [nativeLine, savedLine] } as any,
    })

    const scoped = rows.filter(
      (row: any) => String(row?.serviceId ?? '') === CUSTOM_SERVICE._id
    )
    expect(scoped).toHaveLength(1)
    expect(scoped[0]).toMatchObject({
      type: ServiceType.Electricity,
      price: CUSTOM_TARIFF,
      lastAmount: LAST_READING,
      amount: NEW_READING,
      sum: CONSUMED * CUSTOM_TARIFF,
      customName: CUSTOM_SERVICE.name,
    })

    // Нативний рядок лишається окремо і зі своїм тарифом.
    const native = rows.filter(
      (row: any) => row?.type === ServiceType.Electricity && !row?.serviceId
    )
    expect(native).toHaveLength(1)
    expect(native[0].price).toBe(NATIVE_TARIFF)
  })
})
