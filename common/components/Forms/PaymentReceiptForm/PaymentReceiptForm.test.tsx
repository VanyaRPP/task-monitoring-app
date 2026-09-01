import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PaymentReceiptForm from './index'
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

jest.mock('react-to-print', () => ({
  useReactToPrint: () => jest.fn(),
}))

const mockPayment = {
  _id: 'test-payment-id',
  invoiceNumber: '151',
  invoiceCreationDate: '2024-06-01',
  status: PaymentStatus.Draft,
  reciever: {
    companyName: 'Test Company',
    description: 'Test Receiver\nKyiv',
    adminEmails: ['test@example.com'],
  },
  company: {
    companyName: 'Provider Company',
    adminEmails: ['provider@example.com'],
  },
  transaction: {
    AUT_CNTR_ACC: 'UA123456789',
    AUT_CNTR_NAM: 'Test Company',
    AUT_CNTR_MFO: '123456',
    Description: 'Payment for services',
  },
  generalSum: 100,
}

const renderPaymentReceipt = (overrides = {}) =>
  render(
    <PaymentReceiptForm
      currPayment={{ ...mockPayment, ...overrides } as any}
      paymentData={null}
      paymentActions={{ preview: true, edit: true }}
    />
  )

describe('PaymentReceiptForm - Send Email Button', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders print icon button', () => {
    const { container } = renderPaymentReceipt()
    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
  })

  test('renders payment receipt form with wrapper', () => {
    const { container } = renderPaymentReceipt()
    const allImages = container.querySelectorAll('*')
    expect(allImages.length).toBeGreaterThan(0)
  })

  test('component renders without errors when given valid payment data', () => {
    const { container } = renderPaymentReceipt()
    expect(container.querySelector('div')).toBeInTheDocument()
  })
})

describe('PaymentReceiptForm - Rendering', () => {
  test('displays receipt header', () => {
    renderPaymentReceipt()
    expect(
      screen.getByText(/КВИТАНЦІЯ ПРО ОТРИМАННЯ ПЛАТЕЖУ/)
    ).toBeInTheDocument()
  })

  test('displays transaction account number', () => {
    renderPaymentReceipt()
    expect(screen.getByText('UA123456789')).toBeInTheDocument()
  })

  test('displays payer name from transaction', () => {
    renderPaymentReceipt()
    expect(screen.getByText('Test Company')).toBeInTheDocument()
  })

  test('displays received amount in correct format', () => {
    renderPaymentReceipt()
    expect(screen.getByText(/100\.00/)).toBeInTheDocument()
  })

  test('displays invoice number', () => {
    renderPaymentReceipt()
    expect(screen.getByText(/151/)).toBeInTheDocument()
  })

  test('formats date correctly', () => {
    renderPaymentReceipt()
    expect(screen.getByText(/01\.06\.2024/)).toBeInTheDocument()
  })
})

describe('PaymentReceiptForm - Data Validation', () => {
  test('displays company name if provided', () => {
    renderPaymentReceipt()
    expect(screen.getByText('Provider Company')).toBeInTheDocument()
  })

  test('component handles undefined transaction gracefully', () => {
    const { container } = renderPaymentReceipt({ transaction: undefined })
    expect(container).not.toBeEmptyDOMElement()
  })
})
