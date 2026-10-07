import { render } from '@testing-library/react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import PaymentsBlock from './payments'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { useGetDebtorsQuery } from '@common/api/debtorsApi/debtors.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { setFilters } from '@modules/store/paymentsSlice'
import { dateRangeToQueryBounds } from '@utils/paymentDateRange'

jest.mock('next/router', () => ({ useRouter: jest.fn() }))

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}))

jest.mock('@common/api/paymentApi/payment.api', () => ({
  paymentApi: { util: { invalidateTags: jest.fn() } },
  useGetAllPaymentsQuery: jest.fn(),
  useDeletePaymentMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
  useDeleteMultiplePaymentsMutation: jest.fn(() => [jest.fn()]),
  useMarkPaymentsPaidMutation: jest.fn(() => [jest.fn()]),
  useDuplicatePaymentsMutation: jest.fn(() => [jest.fn()]),
  useSendPaymentEmailMutation: jest.fn(() => [jest.fn()]),
  useUpdatePaymentStatusMutation: jest.fn(() => [jest.fn()]),
}))

jest.mock('@common/api/debtorsApi/debtors.api', () => ({
  debtorsApi: {
    util: { invalidateTags: jest.fn(), updateQueryData: jest.fn() },
  },
  useGetDebtorsQuery: jest.fn(),
}))

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(),
}))

jest.mock('@common/api/filterApi/filter.api', () => ({
  useGetDomainFiltersQuery: jest.fn(() => ({ data: undefined })),
  useGetRealEstateFiltersQuery: jest.fn(() => ({ data: undefined })),
  useGetAddressFiltersQuery: jest.fn(() => ({ data: undefined })),
  useGetDateFiltersQuery: jest.fn(() => ({ data: undefined })),
}))

const captured: { header?: any; table?: any } = {}

jest.mock('@components/UI/TableCard', () => {
  const Mock = ({ title, children }: any) => (
    <div>
      {title}
      {children}
    </div>
  )
  Mock.displayName = 'TableCard'
  return Mock
})
jest.mock('@components/Tables/Payment/Header', () => {
  const Mock = (props: any) => {
    captured.header = props
    return null
  }
  Mock.displayName = 'PaymentsHeader'
  return Mock
})
jest.mock('@components/Tables/Payment/Table', () => {
  const Mock = (props: any) => {
    captured.table = props
    return null
  }
  Mock.displayName = 'PaymentsTable'
  return Mock
})
jest.mock('@components/UI/ModalDelete', () => {
  const Mock = () => null
  Mock.displayName = 'ModalDelete'
  return Mock
})

global.BroadcastChannel = jest.fn().mockImplementation(() => ({
  close: jest.fn(),
  onmessage: null,
})) as any

const RANGE = { dateFrom: '2026-08-01', dateTo: '2026-09-28' }
const OTHER_FILTERS = {
  domain: ['domain-1'],
  company: ['company-1'],
  type: ['debit'],
  street: ['street-1'],
}

let dispatch: jest.Mock

const renderWithFilters = (
  filters: Record<string, any> | undefined,
  sepDomainID?: string
) => {
  ;(useSelector as unknown as jest.Mock).mockImplementation((selector: any) =>
    selector({
      payments: {
        filters,
        domainsFilter: [],
        companiesFilter: [],
        streetsFilter: [],
        selectedPayments: [],
        paymentsDeleteItems: [],
        selectedColumns: [],
        debtorCompanies: [],
        currentPage: 1,
        pageSize: 10,
      },
    })
  )
  return render(<PaymentsBlock sepDomainID={sepDomainID} />)
}

const lastFiltersDispatched = () => {
  const call = dispatch.mock.calls
    .map(([action]) => action)
    .filter((action) => action?.type === setFilters.type)
    .pop()
  return call?.payload
}

beforeEach(() => {
  jest.clearAllMocks()
  dispatch = jest.fn()
  ;(useDispatch as unknown as jest.Mock).mockReturnValue(dispatch)
  ;(useRouter as jest.Mock).mockReturnValue({
    pathname: '/payment',
    query: {},
    isReady: true,
    replace: jest.fn(),
  })
  ;(useGetCurrentUserQuery as jest.Mock).mockReturnValue({
    data: { roles: ['GlobalAdmin'] },
  })
  ;(useGetDebtorsQuery as jest.Mock).mockReturnValue({ refetch: jest.fn() })
  ;(useGetAllPaymentsQuery as jest.Mock).mockReturnValue({ data: undefined })
})

describe('PaymentsBlock — фільтр "За проміжок"', () => {
  it('передає проміжок у запит разом з іншими фільтрами', () => {
    renderWithFilters({ ...OTHER_FILTERS, ...RANGE })

    const args = (useGetAllPaymentsQuery as jest.Mock).mock.lastCall[0]
    expect(args).toMatchObject({
      ...dateRangeToQueryBounds(RANGE),
      domainIds: ['domain-1'],
      companyIds: ['company-1'],
      streetIds: ['street-1'],
      type: ['debit'],
    })
  })

  it('без проміжку запит не має date-range обмеження', () => {
    renderWithFilters(OTHER_FILTERS)

    const args = (useGetAllPaymentsQuery as jest.Mock).mock.lastCall[0]
    expect(args.dateFrom).toBeUndefined()
    expect(args.dateTo).toBeUndefined()
  })

  it('вибір проміжку зберігає решту фільтрів', () => {
    renderWithFilters(OTHER_FILTERS)

    captured.header.onDateRangeChange(RANGE)

    expect(lastFiltersDispatched()).toEqual({ ...OTHER_FILTERS, ...RANGE })
  })

  it('очищення прибирає лише проміжок', () => {
    renderWithFilters({ ...OTHER_FILTERS, ...RANGE })

    captured.header.onDateRangeChange(null)

    expect(lastFiltersDispatched()).toEqual(OTHER_FILTERS)
  })

  it('зміна фільтра колонки таблиці не скидає проміжок', () => {
    renderWithFilters({ ...OTHER_FILTERS, ...RANGE })

    captured.table.tableEventProps.handleTableChange(
      { current: 1, pageSize: 10 },
      { domain: ['domain-2'], type: ['credit'] },
      {},
      { action: 'filter' }
    )

    expect(lastFiltersDispatched()).toMatchObject({
      domain: ['domain-2'],
      type: ['credit'],
      street: ['street-1'],
      ...RANGE,
    })
  })
})

describe('PaymentsBlock — фільтр "За проміжок" на сторінці домену', () => {
  const mockSepDomainRouter = (query: Record<string, string> = {}) => {
    const replace = jest.fn()
    ;(useRouter as jest.Mock).mockReturnValue({
      pathname: '/sepdomain',
      query: { domain: 'dom-9', ...query },
      isReady: true,
      replace,
    })
    return replace
  }

  it('показує RangePicker і веде історію в scope цього домену', () => {
    mockSepDomainRouter()
    renderWithFilters(undefined, 'dom-9')

    expect(captured.header.showDateRangeFilter).toBe(true)
    expect(captured.header.dateHistoryScope).toBe('domain:dom-9')
  })

  it('компанія має пріоритет над доменом сторінки', () => {
    mockSepDomainRouter()
    renderWithFilters({ company: ['c-2', 'c-1'] }, 'dom-9')

    expect(captured.header.dateHistoryScope).toBe('company:c-1,c-2')
  })

  it('передає проміжок у запит разом з доменом сторінки', () => {
    mockSepDomainRouter()
    renderWithFilters(RANGE, 'dom-9')

    expect(
      (useGetAllPaymentsQuery as jest.Mock).mock.lastCall[0]
    ).toMatchObject({ ...dateRangeToQueryBounds(RANGE), domainIds: 'dom-9' })
  })

  it('вибір і очищення проміжку працюють так само, як на /payment', () => {
    mockSepDomainRouter()
    renderWithFilters({ type: ['debit'] }, 'dom-9')

    captured.header.onDateRangeChange(RANGE)
    expect(lastFiltersDispatched()).toEqual({ type: ['debit'], ...RANGE })

    captured.header.onDateRangeChange(null)
    expect(lastFiltersDispatched()).toEqual({ type: ['debit'] })
  })

  it('відновлює проміжок з URL сторінки домену', () => {
    mockSepDomainRouter({ dateFrom: RANGE.dateFrom, dateTo: RANGE.dateTo })
    renderWithFilters(undefined, 'dom-9')

    expect(lastFiltersDispatched()).toEqual(RANGE)
  })

  it('на /payment RangePicker показується у звичайному блоці фільтрів', () => {
    renderWithFilters({ domain: ['domain-1'] })

    expect(captured.header.showDateRangeFilter).toBe(false)
    expect(captured.header.dateHistoryScope).toBe('domain:domain-1')
  })
})
