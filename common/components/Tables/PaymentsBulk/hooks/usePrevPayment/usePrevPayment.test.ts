import { renderHook } from '@testing-library/react'
import { Form } from 'antd'
import { usePrevPayment } from './usePrevPayment'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'

jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  Form: {
    useWatch: jest.fn(),
  },
}))

jest.mock('@common/components/DashboardPage/blocks/paymentsBulk', () => ({
  useInvoicesPaymentContext: jest.fn(),
}))

describe('usePrevPayment hook', () => {
  const mockPrevPayments = [
    {
      company: { _id: 'comp_1' },
      monthService: { _id: 'serv_1' },
      street: { _id: 'str_1' },
      domain: { _id: 'dom_1' },
      type: 'debit',
    },
  ]

  const mockPrevService = {
    _id: 'serv_1',
    street: { _id: 'str_1' },
    domain: { _id: 'dom_1' },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useInvoicesPaymentContext as jest.Mock).mockReturnValue({
      form: {},
      prevPayments: mockPrevPayments,
      prevService: mockPrevService,
    })
  })

  it('знайти співпадіння, коли всі 4 поля збігаються', () => {
    ;(Form.useWatch as jest.Mock).mockReturnValue('comp_1')

    const { result } = renderHook(() => usePrevPayment(0))

    expect(result.current).toEqual(mockPrevPayments[0])
  })

  it('повернути undefined, якщо одне з полів (наприклад, street) не збігається', () => {
    ;(useInvoicesPaymentContext as jest.Mock).mockReturnValue({
      form: {},
      prevPayments: mockPrevPayments,
      prevService: { ...mockPrevService, street: { _id: 'DIFFERENT_STREET' } },
    })
    ;(Form.useWatch as jest.Mock).mockReturnValue('comp_1')

    const { result } = renderHook(() => usePrevPayment(0))

    expect(result.current).toBeUndefined()
  })

  it('працювати коректно, коли компанія ще не обрана (companyId undefined)', () => {
    ;(Form.useWatch as jest.Mock).mockReturnValue(undefined)

    const { result } = renderHook(() => usePrevPayment(0))

    expect(result.current).toBeUndefined()
  })
})
