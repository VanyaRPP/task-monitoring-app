import { render, screen } from '@testing-library/react'
import GroupedReceiptForm from './index'

jest.mock('./style.module.scss', () => ({}))
jest.mock('./templates/style.module.scss', () => ({}))

let template = 'olimp'
let companyCurrency = 'UAH'

jest.mock('@components/AddPaymentModal', () => ({
  usePaymentContext: () => ({
    template,
    setTemplate: jest.fn(),
    company: {
      currency: companyCurrency,
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

jest.mock('@components/Forms/GroupedReceiptForm/GroupedPricesTable', () => ({
  __esModule: true,
  default: () => <div>GroupedPricesTable</div>,
}))

jest.mock('@common/api/paymentApi/payment.api', () => ({
  useEditPaymentMutation: () => [jest.fn().mockResolvedValue({ data: {} })],
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

const mockPayment = {
  invoiceNumber: '123',
  invoiceCreationDate: '2024-01-01',
  monthService: '12345j32jkl5423',
  reciever: {
    companyName: 'Test Company',
    description: 'Kyiv\nUkraine',
    adminEmails: ['test@gmail.com'],
  },
  provider: { description: 'Provider company' },
  domain: { name: 'Test Domain', description: 'Test Client\nKyiv' },
  invoice: [{ name: 'Development services', price: 100, amount: 1, sum: 100 }],
  generalSum: 100,
}

const renderOlimp = (overrides = {}) =>
  render(
    <GroupedReceiptForm
      paymentData={{ ...mockPayment, ...overrides } as any}
      paymentActions={{ preview: true, edit: true }}
    />
  )

describe('OLIMP template', () => {
  beforeEach(() => {
    template = 'olimp'
    companyCurrency = 'UAH'
  })

  test('renders invoice header and total', () => {
    renderOlimp()
    expect(screen.getAllByText(/INVOICE|РАХУНОК/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/TOTAL|ВСЬОГО/i).length).toBeGreaterThan(0)
  })

  test('displays main invoice data', () => {
    renderOlimp()
    expect(screen.getAllByText('Test Domain').length).toBeGreaterThan(0)
    expect(screen.getByText('Development services')).toBeInTheDocument()
    expect(
      screen.getAllByText((c) => c.includes('100.00'))[0]
    ).toBeInTheDocument()
  })

  test('service act is hidden', () => {
    renderOlimp()
    expect(screen.queryByText(/акт надання послуг/i)).not.toBeInTheDocument()
  })

  test('показує РАХУНОК № для UAH валюти', () => {
    renderOlimp()
    expect(screen.getByText(/РАХУНОК №/i)).toBeInTheDocument()
    expect(screen.queryByText(/INVOICE №/i)).not.toBeInTheDocument()
  })

  test('показує INVOICE № для USD валюти', () => {
    companyCurrency = 'USD'
    renderOlimp()
    expect(screen.getByText(/INVOICE №/i)).toBeInTheDocument()
    expect(screen.queryByText(/РАХУНОК №/i)).not.toBeInTheDocument()
  })

  test('показує секцію "ПЛАТІЖНІ ДАНІ" для UAH', () => {
    renderOlimp()
    expect(screen.getByText(/ПЛАТІЖНІ ДАНІ/i)).toBeInTheDocument()
  })

  test('показує секцію "PAYMENT INFO" для USD', () => {
    companyCurrency = 'USD'
    renderOlimp()
    expect(screen.getByText(/PAYMENT INFO/i)).toBeInTheDocument()
  })

  test('показує секцію "ОТРИМУВАЧ" для UAH', () => {
    renderOlimp()
    expect(screen.getByText(/ОТРИМУВАЧ/i)).toBeInTheDocument()
  })

  test('показує секцію "ISSUED TO" для USD', () => {
    companyCurrency = 'USD'
    renderOlimp()
    expect(screen.getByText(/ISSUED TO/i)).toBeInTheDocument()
  })

  test('відображає дату у форматі DD.MM.YYYY', () => {
    renderOlimp()
    expect(screen.getByText(/01\.01\.2024/)).toBeInTheDocument()
  })

  test('дата оплати = invoiceCreationDate + 5 днів', () => {
    renderOlimp()
    expect(screen.getByText(/06\.01\.2024/)).toBeInTheDocument()
  })

  // TODO: Write a real test for provider data
  // once OLIMP template starts rendering provider info explicitly.
  test.todo('OLIMP template: displays provider data when implemented')

  test('відображає email Отримувача', () => {
    renderOlimp()
    expect(screen.getByText('test@gmail.com')).toBeInTheDocument()
  })

  test('повертає null якщо paymentData відсутній', () => {
    const { container } = render(
      <GroupedReceiptForm
        paymentData={null}
        paymentActions={{ preview: true, edit: true }}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  // TODO: Add a real test for generalSum
  // when OLIMP template starts using this field directly.
  test.todo('OLIMP template: generalSum = 0 renders 0.00 when supported')

  test('порожній invoice не ламає рендер', () => {
    renderOlimp({ invoice: [] })
    expect(screen.getByText(/РАХУНОК №/i)).toBeInTheDocument()
  })
})

describe('Classic template', () => {
  beforeEach(() => {
    template = 'classic'
    companyCurrency = 'UAH'
  })

  const renderClassic = (overrides = {}) =>
    render(
      <GroupedReceiptForm
        paymentData={{ ...mockPayment, ...overrides } as any}
        paymentActions={{ preview: true, edit: true }}
      />
    )

  test('service act is visible', () => {
    renderClassic({
      reciever: {
        ...mockPayment.reciever,
        description: 'ФОП Test\nакт надання послуг',
      },
    } as any)
    expect(screen.getByText(/акт надання послуг/i)).toBeInTheDocument()
  })

  test('відображає дані провайдера', () => {
    renderClassic()
    expect(screen.getByText(/Постачальник/i)).toBeInTheDocument()
  })

  test('повертає null якщо paymentData відсутній', () => {
    const { container } = render(
      <GroupedReceiptForm
        paymentData={null}
        paymentActions={{ preview: true, edit: true }}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  test('generalSum = 0 відображає 0.00', () => {
    renderClassic({ generalSum: 0 })
    expect(screen.getByText(/0\.00/)).toBeInTheDocument()
  })
})
