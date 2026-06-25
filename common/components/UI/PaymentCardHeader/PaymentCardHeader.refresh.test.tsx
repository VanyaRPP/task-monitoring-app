import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { message } from 'antd'
import { AppRoutes, Roles } from '@utils/constants'
import PaymentCardHeader from '@components/UI/PaymentCardHeader'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('antd', () => {
  const antd = jest.requireActual('antd')
  return {
    ...antd,
    message: {
      loading: jest.fn(),
      success: jest.fn(),
      error: jest.fn(),
    },
  }
})

jest.mock('@common/api/paymentApi/payment.api', () => ({
  useDeleteMultiplePaymentsMutation: jest.fn(() => [jest.fn()]),
  useHtmlToPdfZipMutation: jest.fn(() => [jest.fn()]),
  useGenerateExcelMutation: jest.fn(() => [jest.fn()]),
}))

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(),
}))

jest.mock('@common/api/customServicesApi/customServices.api', () => ({
  useGetCustomServicesQuery: jest.fn(() => ({ data: { data: [] } })),
}))

jest.mock('@components/UI/PaymentCardHeader/PaymentCardLabel', () => {
  const Mock = () => <div data-testid="payment-card-label" />
  Mock.displayName = 'PaymentCardLabel'
  return Mock
})
jest.mock('@components/AddPaymentModal', () => {
  const Mock = () => null
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

const messageMock = message as unknown as {
  loading: jest.Mock
  success: jest.Mock
  error: jest.Mock
}

const { useGetCurrentUserQuery } = jest.requireMock(
  '@common/api/userApi/user.api'
)

const makeProps = (overrides: Record<string, any> = {}) => ({
  setCurrentDateFilter: jest.fn(),
  currentPayment: {},
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
  onRefresh: jest.fn().mockResolvedValue(undefined),
  isRefreshing: false,
  ...overrides,
})

const setAdmin = (isAdmin: boolean) =>
  (useGetCurrentUserQuery as jest.Mock).mockReturnValue({
    data: { roles: isAdmin ? [Roles.GLOBAL_ADMIN] : [] },
  })

const openDropdown = () => fireEvent.click(screen.getByRole('button'))

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({
    pathname: AppRoutes.PAYMENT,
    push: jest.fn(),
  })
  setAdmin(true)
})

describe('PaymentCardHeader — кнопка "Оновити"', () => {
  it('показує пункт "Оновити" для адміна', () => {
    render(<PaymentCardHeader {...makeProps()} />)
    openDropdown()

    expect(screen.getByText('Оновити')).toBeInTheDocument()
  })

  it('не показує пункт "Оновити" для не-адміна (немає меню)', () => {
    setAdmin(false)
    render(<PaymentCardHeader {...makeProps()} />)

    expect(screen.queryByText('Оновити')).not.toBeInTheDocument()
  })

  it('викликає onRefresh при кліку', () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined)
    render(<PaymentCardHeader {...makeProps({ onRefresh })} />)
    openDropdown()
    fireEvent.click(screen.getByText('Оновити'))

    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('не скидає фільтри, пошук та вибір при оновленні', () => {
    const props = makeProps()
    render(<PaymentCardHeader {...props} />)
    openDropdown()
    fireEvent.click(screen.getByText('Оновити'))

    expect(props.setFilters).not.toHaveBeenCalled()
    expect(props.setCurrentDateFilter).not.toHaveBeenCalled()
    expect(props.setSelectedPayments).not.toHaveBeenCalled()
    expect(props.setPaymentsDeleteItems).not.toHaveBeenCalled()
  })

  it('показує індикатор завантаження, а потім успіх', async () => {
    render(<PaymentCardHeader {...makeProps()} />)
    openDropdown()
    fireEvent.click(screen.getByText('Оновити'))

    expect(messageMock.loading).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'payments-refresh' })
    )
    await waitFor(() =>
      expect(messageMock.success).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'payments-refresh' })
      )
    )
    expect(messageMock.error).not.toHaveBeenCalled()
  })

  it('показує помилку, якщо оновлення впало', async () => {
    const onRefresh = jest.fn().mockRejectedValue(new Error('network'))
    render(<PaymentCardHeader {...makeProps({ onRefresh })} />)
    openDropdown()
    fireEvent.click(screen.getByText('Оновити'))

    await waitFor(() =>
      expect(messageMock.error).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'payments-refresh' })
      )
    )
    expect(messageMock.success).not.toHaveBeenCalled()
  })

  it('крутить іконку, поки isRefreshing === true', () => {
    render(<PaymentCardHeader {...makeProps({ isRefreshing: true })} />)
    openDropdown()

    expect(document.querySelector('.anticon-spin')).toBeTruthy()
  })
})
