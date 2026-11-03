import { renderHook } from '@testing-library/react'
import { Form } from 'antd'
import dayjs from 'dayjs'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { buildMonthServicePlaceholder } from '@common/components/Forms/AddPaymentForm/month-service-placeholder'
import { usePreviousMonthService } from './useService'
import { usePaymentFormData } from './usePaymentData'

jest.mock('@common/api/serviceApi/service.api', () => ({
  useGetAllServicesQuery: jest.fn(),
}))
jest.mock('@common/api/paymentApi/payment.api', () => ({
  useGetAllPaymentsQuery: jest.fn(() => ({ data: { data: [] } })),
}))
jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useGetAllRealEstateQuery: jest.fn(() => ({ data: { data: [] } })),
}))

const servicesQuery = useGetAllServicesQuery as jest.Mock

beforeEach(() => {
  servicesQuery.mockReset()
  servicesQuery.mockReturnValue({ data: { data: [] } })
})

// Every service lookup the hook made, as its query args.
const lookups = () => servicesQuery.mock.calls.map(([args]) => args)

describe('usePreviousMonthService (new service form prefill)', () => {
  it('asks for the previous month, not the one before it', () => {
    renderHook(() =>
      usePreviousMonthService({
        date: dayjs('2026-10-15'),
        domainId: 'd1',
        streetId: 's1',
      })
    )

    expect(lookups().at(-1)).toMatchObject({ month: 9, year: 2026 })
  })

  it('crosses the year in January', () => {
    renderHook(() =>
      usePreviousMonthService({
        date: dayjs('2026-01-10'),
        domainId: 'd1',
        streetId: 's1',
      })
    )

    expect(lookups().at(-1)).toMatchObject({ month: 12, year: 2025 })
  })

  it('without an address, looks only at address-less services', () => {
    renderHook(() =>
      usePreviousMonthService({
        date: dayjs('2026-10-15'),
        domainId: 'd1',
        streetId: undefined,
      })
    )

    expect(lookups().at(-1)).toMatchObject({ withoutStreet: true })
  })
})

describe('usePaymentFormData (payment form)', () => {
  const render = (values: Record<string, unknown>) =>
    renderHook(() => {
      const [form] = Form.useForm()
      return usePaymentFormData(form, values as any)
    })

  it('for a company without an address, looks up only address-less services', () => {
    render({
      domain: { _id: 'd1' },
      company: { _id: 'c1' },
      monthService: buildMonthServicePlaceholder(dayjs('2026-09-01')),
    })

    const byMonth = lookups().filter((args) => args?.month)
    expect(byMonth.length).toBeGreaterThan(0)
    for (const args of byMonth) {
      expect(args).toMatchObject({ withoutStreet: true })
      expect(args.streetId).toBeUndefined()
    }
  })

  it("takes last month's service on the same address", () => {
    render({
      domain: { _id: 'd1' },
      company: { _id: 'c1' },
      street: { _id: 's1' },
      monthService: buildMonthServicePlaceholder(dayjs('2026-09-01')),
    })

    const previous = lookups().find((args) => args?.month === 8)
    expect(previous).toMatchObject({ streetId: 's1', year: 2026 })
    expect(previous.withoutStreet).toBeUndefined()
  })
})
