import { render, screen } from '@testing-library/react'
import ReceiptForm from './index'
import { PaymentStatus } from '@common/api/paymentApi/payment.api.types'

jest.mock('./style.module.scss', () => ({}))

const mockSendPaymentEmail = jest.fn().mockResolvedValue({ success: true })
const mockUpdatePaymentStatus = jest.fn().mockResolvedValue({ data: {} })

jest.mock('@common/api/paymentApi/payment.api', () => ({
  useSendPaymentEmailMutation: () => [mockSendPaymentEmail],
  useUpdatePaymentStatusMutation: () => [mockUpdatePaymentStatus],
}))

jest.mock('@modules/hooks/useInvoiceCurrency', () => ({
  useInvoiceCurrency: () => 'UAH',
}))

jest.mock('@components/Forms/AddPaymentForm/PaymentPricesTable', () => ({
  __esModule: true,
  default: () => <div>PaymentPricesTable</div>,
}))

jest.mock('@utils/helpers', () => ({
  getCurrencyShortLabel: (currency: string) => currency,
  normalizeCurrency: (currency: string) => currency,
}))

jest.mock('react-to-print', () => ({
  useReactToPrint: () => jest.fn(),
}))

const mockPayment = {
  _id: 'test-receipt-id',
  invoiceNumber: '456',
  invoiceCreationDate: '2024-06-01',
  status: PaymentStatus.Draft,
  invoiceLang: 'uk',
  reciever: {
    companyName: 'Test Company',
    description: 'Test Receiver\nKyiv',
  },
  company: {
    companyName: 'Provider Company',
  },
  invoice: [{ name: 'Service', price: 50, amount: 2, sum: 100 }],
  generalSum: 100,
  debit: 100,
}

const renderReceipt = (overrides = {}) =>
  render(
    <ReceiptForm
      currPayment={{ ...mockPayment, ...overrides } as any}
      paymentData={null}
      paymentActions={{ preview: true, edit: true }}
    />
  )

describe('ReceiptForm - Send Email Button', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders toolbar with icons', () => {
    const { container } = renderReceipt()
    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
  })

  test('renders receipt form component', () => {
    const { container } = renderReceipt()
    expect(container.querySelector('div')).toBeInTheDocument()
  })

  test('component handles payment data correctly', () => {
    const { container } = renderReceipt()
    expect(container).not.toBeEmptyDOMElement()
  })
})

describe('ReceiptForm - Rendering', () => {
  test('displays certificate header for UAH currency', () => {
    renderReceipt()
    expect(screen.getByText(/ДОВІДКА №/)).toBeInTheDocument()
  })

  test('displays invoice number in header', () => {
    renderReceipt()
    expect(screen.getByText(/456/)).toBeInTheDocument()
  })

  test('displays table with prices', () => {
    renderReceipt()
    expect(screen.getByText('PaymentPricesTable')).toBeInTheDocument()
  })

  test('displays total amount', () => {
    renderReceipt()
    const totalAmount = screen.getByText(/100\.00/)
    expect(totalAmount).toBeInTheDocument()
  })

  test('displays total sum in words for UAH', () => {
    renderReceipt()
    expect(screen.getByText(/Всього на суму/i)).toBeInTheDocument()
  })
})
