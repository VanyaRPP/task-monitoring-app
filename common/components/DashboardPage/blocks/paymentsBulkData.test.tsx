import { renderHook } from '@testing-library/react'
import dayjs from 'dayjs'
import { buildMonthServicePlaceholder } from '@common/components/Forms/AddPaymentForm/month-service-placeholder'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { usePaymentsBulkData } from './paymentsBulk'

jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useGetAllRealEstateQuery: jest.fn(),
}))
jest.mock('@common/api/serviceApi/service.api', () => ({
  useGetAllServicesQuery: jest.fn(),
}))
jest.mock('@common/api/paymentApi/payment.api', () => ({
  useGetAllPaymentsQuery: jest.fn(),
}))
// the block's UI is irrelevant here; keep heavy table modules out
jest.mock('@common/components/Tables/PaymentsBulk/Header', () => () => null)
jest.mock('@common/components/Tables/PaymentsBulk/Table', () => () => null)
jest.mock('@common/components/UI/TableCard', () => () => null)

const companiesQuery = useGetAllRealEstateQuery as jest.Mock
const servicesQuery = useGetAllServicesQuery as jest.Mock
const paymentsQuery = useGetAllPaymentsQuery as jest.Mock

const companies = [{ _id: 'company_1', companyName: 'Acme' }]
const prevService = { _id: 'prev_service', date: '2026-04-01' }

// Default responses: companies exist, a previous month service exists.
const setupQueries = ({ realService }: { realService?: any } = {}) => {
  companiesQuery.mockImplementation((_args, { skip }) =>
    skip ? { data: undefined } : { data: { data: companies } }
  )
  servicesQuery.mockImplementation((args, { skip }) => {
    if (skip) return { data: undefined }
    if (args.serviceId) return { data: { data: [realService] } }
    return { data: { data: [prevService] } }
  })
  paymentsQuery.mockImplementation((_args, { skip }) =>
    skip ? { data: undefined } : { data: { data: [] } }
  )
}

const lastCall = (mock: jest.Mock, predicate: (args: any) => boolean) =>
  [...mock.mock.calls].reverse().find(([args]) => predicate(args))

describe('usePaymentsBulkData — address is optional', () => {
  const placeholder = buildMonthServicePlaceholder(dayjs('2026-05-10'))

  beforeEach(() => {
    jest.clearAllMocks()
    setupQueries()
  })

  it('loads the provider companies and a placeholder month service without an address', () => {
    const { result } = renderHook(() =>
      usePaymentsBulkData({ domainId: 'domain_1', serviceId: placeholder })
    )

    const [companyArgs, companyOpts] = companiesQuery.mock.calls.at(-1)
    expect(companyOpts.skip).toBe(false)
    expect(companyArgs).toEqual({ domainId: 'domain_1', streetId: undefined })

    expect(result.current.companies).toEqual(companies)
    expect(result.current.service).toMatchObject({
      _id: placeholder,
      domain: { _id: 'domain_1' },
      electricityPrice: 0,
    })
    expect(result.current.service).not.toHaveProperty('street')
  })

  it('treats an empty street value as "no address"', () => {
    renderHook(() =>
      usePaymentsBulkData({
        domainId: 'domain_1',
        streetId: '',
        serviceId: placeholder,
      })
    )

    const [companyArgs, companyOpts] = companiesQuery.mock.calls.at(-1)
    expect(companyOpts.skip).toBe(false)
    expect(companyArgs.streetId).toBeUndefined()
  })

  it('loads an existing month service, previous service and payments without an address', () => {
    setupQueries({
      realService: { _id: 'service_may', date: '2026-05-01' },
    })

    const { result } = renderHook(() =>
      usePaymentsBulkData({ domainId: 'domain_1', serviceId: 'service_may' })
    )

    const serviceById = lastCall(servicesQuery, (a) => !!a.serviceId)
    expect(serviceById[1].skip).toBe(false)

    const prev = lastCall(servicesQuery, (a) => !a.serviceId)
    expect(prev[1].skip).toBe(false)
    expect(prev[0]).toMatchObject({
      domainId: 'domain_1',
      streetId: undefined,
      month: 4,
      year: 2026,
    })

    const [paymentArgs, paymentOpts] = paymentsQuery.mock.calls.at(-1)
    expect(paymentOpts.skip).toBe(false)
    expect(paymentArgs.streetIds).toBeUndefined()

    expect(result.current.service).toMatchObject({ _id: 'service_may' })
    expect(result.current.prevService).toEqual(prevService)
  })

  it('still narrows every query by the address when one is selected', () => {
    const { result } = renderHook(() =>
      usePaymentsBulkData({
        domainId: 'domain_1',
        streetId: 'street_1',
        serviceId: placeholder,
      })
    )

    expect(companiesQuery.mock.calls.at(-1)[0]).toEqual({
      domainId: 'domain_1',
      streetId: 'street_1',
    })
    expect(lastCall(servicesQuery, (a) => !a.serviceId)[0].streetId).toBe(
      'street_1'
    )
    expect(paymentsQuery.mock.calls.at(-1)[0].streetIds).toEqual(['street_1'])
    expect(result.current.service).toMatchObject({
      street: { _id: 'street_1' },
    })
  })

  it('still requires a provider and a month', () => {
    const { result } = renderHook(() =>
      usePaymentsBulkData({ streetId: 'street_1', serviceId: placeholder })
    )
    expect(companiesQuery.mock.calls.at(-1)[1].skip).toBe(true)
    expect(result.current.service).toBeUndefined()

    renderHook(() => usePaymentsBulkData({ domainId: 'domain_1' }))
    expect(companiesQuery.mock.calls.at(-1)[1].skip).toBe(true)
  })
})
