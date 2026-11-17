import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/router'
import { AppRoutes, Operations, Roles } from '@utils/constants'
import PaymentCardHeader from '@components/UI/PaymentCardHeader'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@common/api/paymentApi/payment.api', () => ({
  useDeleteMultiplePaymentsMutation: jest.fn(() => [jest.fn()]),
  useHtmlToPdfZipMutation: jest.fn(() => [jest.fn()]),
  useGenerateExcelMutation: jest.fn(() => [jest.fn()]),
}))

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(),
}))

jest.mock('@common/api/domainApi/domain.api', () => ({
  useGetDomainsQuery: jest.fn(() => ({ data: [] })),
}))

jest.mock('@components/UI/PaymentCardHeader/PaymentCardLabel', () => {
  const Mock = () => <div data-testid="payment-card-label" />
  Mock.displayName = 'PaymentCardLabel'
  return Mock
})
// Stands in for the modal and shows what it was opened for.
jest.mock('@components/AddPaymentModal', () => {
  const Mock = ({
    initialOperation,
    closeModal,
  }: {
    initialOperation?: string
    closeModal: () => void
  }) => (
    <div data-testid="add-payment-modal" data-operation={initialOperation}>
      <button onClick={() => closeModal()}>close modal</button>
    </div>
  )
  Mock.displayName = 'AddPaymentModal'
  return Mock
})
jest.mock('@components/UI/PaymentCardHeader/ImportInvoices', () => {
  const Mock = () => null
  Mock.displayName = 'ImportInvoices'
  return Mock
})
jest.mock(
  '@components/UI/PaymentCardHeader/ImportInvoices/ImportInvoicesModal',
  () => {
    const Mock = () => null
    Mock.displayName = 'ImportInvoicesModal'
    return Mock
  }
)
jest.mock(
  '@components/Forms/GroupedReceiptForm/HeadlessReceiptRenderer',
  () => ({
    __esModule: true,
    default: () => null,
  })
)

const { useGetCurrentUserQuery } = jest.requireMock(
  '@common/api/userApi/user.api'
)

const makeProps = (overrides: Record<string, unknown> = {}) => ({
  onDateRangeChange: jest.fn(),
  currentPayment: null,
  paymentActions: { edit: false, preview: false },
  closeEditModal: jest.fn(),
  paymentsDeleteItems: [],
  payments: { data: [], total: 0 },
  streets: [],
  filters: {},
  setFilters: jest.fn(),
  selectedPayments: [],
  setPaymentsDeleteItems: jest.fn(),
  setSelectedPayments: jest.fn(),
  enablePaymentsButton: true,
  onColumnsSelect: jest.fn(),
  domainFilter: [],
  realEstatesFilter: [],
  ...overrides,
})

const setAdmin = (isAdmin: boolean) =>
  (useGetCurrentUserQuery as jest.Mock).mockReturnValue({
    data: { roles: isAdmin ? [Roles.GLOBAL_ADMIN] : [] },
  })

const CREATE_INVOICE = 'Створити рахунок'
const openMenu = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Додаткові дії' }))
const modal = () => screen.queryByTestId('add-payment-modal')

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({
    pathname: AppRoutes.PAYMENT,
    push: jest.fn(),
  })
  setAdmin(true)
})

describe('PaymentCardHeader — створення рахунку та оплати', () => {
  it('кнопка «Створити рахунок» видима одразу, без відкриття меню', () => {
    render(<PaymentCardHeader {...makeProps()} />)

    expect(
      screen.getByRole('button', { name: CREATE_INVOICE })
    ).toBeInTheDocument()
    expect(modal()).not.toBeInTheDocument()
  })

  it('відкриває форму рахунку (дебет)', () => {
    render(<PaymentCardHeader {...makeProps()} />)

    fireEvent.click(screen.getByRole('button', { name: CREATE_INVOICE }))

    expect(modal()).toHaveAttribute('data-operation', Operations.Debit)
  })

  it('оплата (кредит) додається окремим пунктом меню', () => {
    render(<PaymentCardHeader {...makeProps()} />)

    openMenu()
    fireEvent.click(screen.getByText('Додати оплату'))

    expect(modal()).toHaveAttribute('data-operation', Operations.Credit)
  })

  it('після закриття наступне відкриття знову про рахунок, а не про оплату', () => {
    render(<PaymentCardHeader {...makeProps()} />)
    openMenu()
    fireEvent.click(screen.getByText('Додати оплату'))

    fireEvent.click(screen.getByText('close modal'))
    expect(modal()).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: CREATE_INVOICE }))
    expect(modal()).toHaveAttribute('data-operation', Operations.Debit)
  })

  it('не-адмін не бачить кнопки створення', () => {
    setAdmin(false)
    render(<PaymentCardHeader {...makeProps()} />)

    expect(
      screen.queryByRole('button', { name: CREATE_INVOICE })
    ).not.toBeInTheDocument()
  })

  it('на дашборді обидві дії лишаються в меню', () => {
    render(<PaymentCardHeader {...makeProps({ isDashboard: true })} />)

    openMenu()
    fireEvent.click(screen.getByText(CREATE_INVOICE))
    expect(modal()).toHaveAttribute('data-operation', Operations.Debit)
  })
})
