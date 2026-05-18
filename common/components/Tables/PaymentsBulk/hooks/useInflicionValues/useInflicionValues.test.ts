import { renderHook } from '@testing-library/react'
import { Form } from 'antd'
import { useInflicionValues } from './useInflicionValues'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { usePrevPayment } from '@common/components/Tables/PaymentsBulk/hooks/usePrevPayment/usePrevPayment'
import { ServiceType } from '@utils/constants'

jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  Form: {
    useWatch: jest.fn(),
  },
}))
jest.mock('@common/components/DashboardPage/blocks/paymentsBulk', () => ({
  useInvoicesPaymentContext: jest.fn(),
}))
jest.mock(
  '@common/components/Tables/PaymentsBulk/hooks/usePrevPayment/usePrevPayment',
  () => ({
    usePrevPayment: jest.fn(),
  })
)

describe('useInflicionValues', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('with prevPayment', () => {
    it('takes previousPlacingPrice from prevPayment invoice', () => {
      ;(usePrevPayment as jest.Mock).mockReturnValue({
        invoice: [{ type: ServiceType.Placing, sum: 100 }],
      })
      ;(useInvoicesPaymentContext as jest.Mock).mockReturnValue({
        form: {},
        service: { rentPrice: 100 },
        prevService: { inflicionPrice: 110 },
      })
      ;(Form.useWatch as jest.Mock).mockReturnValue({
        totalArea: 100,
        pricePerMeter: 50,
      })

      const { result } = renderHook(() => useInflicionValues(0))

      expect(result.current.previousPlacingPrice).toBe(100)
      expect(result.current.inflicionAmount).toBe(10)
    })
  })

  describe('without prevPayment', () => {
    it('calculates previousPlacingPrice from totalArea * pricePerMeter', () => {
      ;(usePrevPayment as jest.Mock).mockReturnValue(undefined)
      ;(useInvoicesPaymentContext as jest.Mock).mockReturnValue({
        form: {},
        service: { rentPrice: 100 },
        prevService: { inflicionPrice: 105 },
      })
      ;(Form.useWatch as jest.Mock).mockReturnValue({
        totalArea: 200,
        pricePerMeter: 30,
      })

      const { result } = renderHook(() => useInflicionValues(0))

      expect(result.current.previousPlacingPrice).toBe(6000)
      expect(result.current.inflicionAmount).toBe(300)
    })
  })

  describe('negative inflicion', () => {
    it('returns inflicionAmount = 0 when inflicionPrice < 100', () => {
      ;(usePrevPayment as jest.Mock).mockReturnValue({
        invoice: [{ type: ServiceType.Placing, sum: 100 }],
      })
      ;(useInvoicesPaymentContext as jest.Mock).mockReturnValue({
        form: {},
        service: {},
        prevService: { inflicionPrice: 95 },
      })
      ;(Form.useWatch as jest.Mock).mockReturnValue({
        totalArea: 100,
        pricePerMeter: 50,
      })

      const { result } = renderHook(() => useInflicionValues(0))

      expect(result.current.inflicionAmount).toBe(0)
    })
  })
})
