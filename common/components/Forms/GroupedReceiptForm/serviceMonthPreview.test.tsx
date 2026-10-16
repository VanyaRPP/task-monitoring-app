import { render, screen } from '@testing-library/react'
import dayjs from 'dayjs'
import GroupedReceiptForm from './index'
import PriceList from '../AddPaymentForm/PriceList'

/*
 * Repro: invoice duplicated from August, service month changed to September,
 * invoice date = today (October). The edit-mode preview shows "October 2026",
 * the saved invoice shows "September 2026".
 *
 * Two render paths feed the templates different shapes of `monthService`:
 * - view mode (`paymentData`): saved payment, `monthService` populated
 *   as `{ _id, date }`;
 * - create/edit preview (`currPayment` from AddPaymentModal.handleOk): form
 *   values, `monthService` is a bare id string (or a `month-YYYY-MM`
 *   placeholder), so the templates cannot read the picked month from it.
 */

jest.mock('./style.module.scss', () => ({}))
jest.mock('./templates/style.module.scss', () => ({}))

let template = 'official'

jest.mock('@components/AddPaymentModal', () => ({
  usePaymentContext: () => ({
    template,
    setTemplate: jest.fn(),
    form: { getFieldValue: jest.fn() },
    company: {
      currency: 'UAH',
      domain: { name: 'Test Domain', description: 'Test Company\nKyiv' },
    },
    showQuantityInPreview: false,
    setShowQuantityInPreview: jest.fn(),
  }),
}))
;(global as any).ResizeObserver = class {
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
}

jest.mock('react-to-print', () => ({
  useReactToPrint: () => jest.fn(),
}))

jest.mock('@components/Forms/GroupedReceiptForm/GroupedPricesTable', () => ({
  __esModule: true,
  default: () => <div>GroupedPricesTable</div>,
}))

jest.mock('@common/api/paymentApi/payment.api', () => ({
  useEditPaymentMutation: () => [jest.fn().mockResolvedValue({ data: {} })],
  useSendPaymentEmailMutation: () => [
    jest.fn().mockResolvedValue({ success: true }),
  ],
  useUpdatePaymentStatusMutation: () => [
    jest.fn().mockResolvedValue({ data: {} }),
  ],
}))

jest.mock('@common/api/invoiceTemplateApi/invoiceTemplate.api', () => ({
  useGetInvoiceTemplatesQuery: () => ({ data: { data: [] } }),
  useCreateInvoiceTemplateMutation: () => [jest.fn()],
  useUpdateInvoiceTemplateMutation: () => [jest.fn()],
}))

jest.mock('next/dynamic', () => (importFn: () => Promise<any>) => {
  let Component: any = null
  importFn().then((mod: any) => {
    Component = mod.default
  })
  const DynamicComponent = (props: any) => {
    if (!Component) return null
    return require('react').createElement(Component, props)
  }
  return DynamicComponent
})

const SEPTEMBER_SERVICE_ID = '66f000000000000000000009'
const SEPTEMBER = /(September|вересень) 2026/i
const OCTOBER = /(October|жовтень) 2026/i

const base = {
  invoiceNumber: '77',
  reciever: {
    companyName: 'Client LLC',
    description: 'Kyiv',
    adminEmails: [],
  },
  provider: { description: 'Provider' },
  domain: { name: 'Test Domain', description: 'Provider\nKyiv' },
  invoice: [{ name: 'Rent', price: 100, amount: 1, sum: 100 }],
  generalSum: 100,
}

// What the view mode gets: payment fetched from the API (populated).
const savedPayment = {
  ...base,
  _id: 'p1',
  invoiceCreationDate: '2026-10-13T09:00:00.000Z',
  monthService: { _id: SEPTEMBER_SERVICE_ID, date: '2026-09-01T00:00:00.000Z' },
}

// What the create/edit preview gets: AddPaymentModal.handleOk ->
// setCurrPayment({ ...form.validateFields(), monthService: resolvedId }).
const formPreviewPayment = (overrides: Record<string, unknown> = {}) => ({
  ...base,
  invoiceCreationDate: dayjs('2026-10-13T09:00:00.000Z'),
  monthService: SEPTEMBER_SERVICE_ID,
  ...overrides,
})

const getSubject = () =>
  screen.getByText(/Послуги надані за|Services rendered for/)

describe('Official template — "Призначення" service month', () => {
  beforeEach(() => {
    template = 'official'
  })

  it('view mode (saved payment): shows the picked service month', async () => {
    render(
      <GroupedReceiptForm
        paymentData={savedPayment as any}
        paymentActions={{ preview: true, edit: false }}
      />
    )
    await screen.findByText(/Послуги надані за|Services rendered for/)

    expect(getSubject()).toHaveTextContent(SEPTEMBER)
  })

  it('edit preview after duplicate: shows the picked month, not the invoice date month', async () => {
    render(
      <GroupedReceiptForm
        currPayment={formPreviewPayment() as any}
        paymentData={
          { ...savedPayment, monthService: { date: '2026-08-01' } } as any
        }
        paymentActions={{ preview: false, edit: true }}
      />
    )
    await screen.findByText(/Послуги надані за|Services rendered for/)

    expect(getSubject()).not.toHaveTextContent(OCTOBER)
    expect(getSubject()).toHaveTextContent(SEPTEMBER)
  })

  it('create preview with a new-provider month placeholder: shows the picked month', async () => {
    render(
      <GroupedReceiptForm
        currPayment={
          formPreviewPayment({ monthService: 'month-2026-09' }) as any
        }
        paymentActions={{ preview: false, edit: false }}
      />
    )
    await screen.findByText(/Послуги надані за|Services rendered for/)

    expect(getSubject()).toHaveTextContent(SEPTEMBER)
  })

  it('edit preview: changing only the invoice date does not change the service month', async () => {
    render(
      <GroupedReceiptForm
        currPayment={
          formPreviewPayment({
            invoiceCreationDate: dayjs('2026-11-02T09:00:00.000Z'),
          }) as any
        }
        paymentData={savedPayment as any}
        paymentActions={{ preview: false, edit: true }}
      />
    )
    await screen.findByText(/Послуги надані за|Services rendered for/)

    expect(getSubject()).toHaveTextContent(SEPTEMBER)
  })

  it('edit preview with populated monthService: shows the picked month (control)', async () => {
    render(
      <GroupedReceiptForm
        currPayment={
          formPreviewPayment({
            monthService: { _id: SEPTEMBER_SERVICE_ID, date: '2026-09-01' },
          }) as any
        }
        paymentActions={{ preview: false, edit: true }}
      />
    )
    await screen.findByText(/Послуги надані за|Services rendered for/)

    expect(getSubject()).toHaveTextContent(SEPTEMBER)
  })
})

describe('Olimp template — "Примітка" service month', () => {
  beforeEach(() => {
    template = 'olimp'
    // "now" differs from both the service month and the invoice date, so a
    // fallback to dayjs(undefined) is distinguishable.
    jest.useFakeTimers({
      now: new Date('2026-12-05T12:00:00.000Z'),
      doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'],
    })
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  const getNote = () => screen.getByText(/Примітка:|Note:/)

  it('view mode (saved payment): shows the picked service month', async () => {
    render(
      <GroupedReceiptForm
        paymentData={savedPayment as any}
        paymentActions={{ preview: true, edit: false }}
      />
    )
    await screen.findByText(/Примітка:|Note:/)

    expect(getNote()).toHaveTextContent(SEPTEMBER)
  })

  it('edit preview: shows the picked month, not the current month', async () => {
    render(
      <GroupedReceiptForm
        currPayment={formPreviewPayment() as any}
        paymentData={savedPayment as any}
        paymentActions={{ preview: false, edit: true }}
      />
    )
    await screen.findByText(/Примітка:|Note:/)

    expect(getNote()).not.toHaveTextContent(/(December|грудень) 2026/i)
    expect(getNote()).toHaveTextContent(SEPTEMBER)
  })
})

describe('Act (PriceList) — "Послуги надані за" service month', () => {
  it('view mode (saved payment): shows the picked service month', () => {
    render(<PriceList data={savedPayment as any} />)

    expect(getSubject()).toHaveTextContent(SEPTEMBER)
  })

  it('edit preview: shows the picked month, not the invoice date month', () => {
    render(<PriceList data={formPreviewPayment() as any} />)

    expect(getSubject()).not.toHaveTextContent(OCTOBER)
    expect(getSubject()).toHaveTextContent(SEPTEMBER)
  })
})
