import { useGetDebtCalculationQuery } from '@common/api/debtCalculationApi/debtCalculation.api'
import {
  useGetDomainIdsByServiceTypeQuery,
  useGetDomainsQuery,
} from '@common/api/domainApi/domain.api'
import { useGetInflationIndexesQuery } from '@common/api/inflationIndexApi/inflationIndex.api'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DebtCalculationBlock from './'

jest.mock('@common/api/domainApi/domain.api', () => ({
  useGetDomainIdsByServiceTypeQuery: jest.fn(),
  useGetDomainsQuery: jest.fn(),
}))

jest.mock('@common/api/inflationIndexApi/inflationIndex.api', () => ({
  useGetInflationIndexesQuery: jest.fn(),
}))

jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useGetAllRealEstateQuery: jest.fn(),
}))

jest.mock('@common/api/paymentApi/payment.api', () => ({
  useGetAllPaymentsQuery: jest.fn(),
}))

jest.mock('@common/api/serviceApi/service.api', () => ({
  useGetAllServicesQuery: jest.fn(),
}))

jest.mock('@common/api/debtCalculationApi/debtCalculation.api', () => ({
  useGetDebtCalculationQuery: jest.fn(),
  useSaveDebtCalculationMutation: jest.fn(() => [
    jest.fn(),
    { isLoading: false },
  ]),
}))

const DOMAIN = '507f1f77bcf86cd799439011'
const FIRST = '507f1f77bcf86cd799439021'
const SECOND = '507f1f77bcf86cd799439022'

const COMPANIES = [
  {
    _id: FIRST,
    companyName: 'Перша компанія',
    totalArea: 10,
    pricePerMeter: 1,
  },
  {
    _id: SECOND,
    companyName: 'Друга компанія',
    totalArea: 20,
    pricePerMeter: 2,
  },
]

const SAVED: Record<string, unknown> = {
  [FIRST]: {
    _id: 'calc-1',
    domain: DOMAIN,
    company: FIRST,
    overrides: { [FIRST]: { openingDebt: 1111 } },
    updatedAt: new Date('2026-09-01T10:00:00.000Z'),
  },
  [SECOND]: {
    _id: 'calc-2',
    domain: DOMAIN,
    company: SECOND,
    overrides: { [SECOND]: { openingDebt: 2222 } },
    updatedAt: new Date('2026-09-01T10:00:00.000Z'),
  },
}

/** Picks an option out of an antd Select addressed by its aria-label. */
const choose = async (select: string, option: string): Promise<void> => {
  await userEvent.click(screen.getByRole('combobox', { name: select }))
  await userEvent.click(await screen.findByTitle(option))
}

const openingDebt = (): HTMLInputElement =>
  screen.getByLabelText('Борг на початок періоду') as HTMLInputElement

beforeEach(() => {
  jest.clearAllMocks()
  window.localStorage.clear()
  ;(useGetDomainIdsByServiceTypeQuery as jest.Mock).mockReturnValue({
    data: [DOMAIN],
    isLoading: false,
  })
  ;(useGetDomainsQuery as jest.Mock).mockReturnValue({
    data: [{ _id: DOMAIN, name: 'ОСББ Тест' }],
  })
  ;(useGetAllRealEstateQuery as jest.Mock).mockReturnValue({
    data: { data: COMPANIES },
    isLoading: false,
  })
  ;(useGetInflationIndexesQuery as jest.Mock).mockReturnValue({
    data: [],
    isLoading: false,
  })
  ;(useGetAllPaymentsQuery as jest.Mock).mockReturnValue({
    data: { data: [] },
    isLoading: false,
  })
  ;(useGetAllServicesQuery as jest.Mock).mockReturnValue({
    data: { data: [] },
    isLoading: false,
  })
  // `isFetching: false` on every render is the cached case - RTK answers from
  // cache the moment you return to a company you already opened. That is
  // exactly the path where the loaded snapshot used to be wiped.
  ;(useGetDebtCalculationQuery as jest.Mock).mockImplementation(
    ({ companyId }: { companyId?: string }) => ({
      data: (companyId && SAVED[companyId]) || null,
      isFetching: false,
    })
  )
})

describe('switching the company filter', () => {
  it('loads the saved data of the company that was picked', async () => {
    render(<DebtCalculationBlock />)

    await choose('Домен', 'ОСББ Тест')
    await choose('Компанія', 'Перша компанія')

    expect(openingDebt()).toHaveValue('1111')
  })

  it('shows the other company its own data, not the previous one', async () => {
    render(<DebtCalculationBlock />)

    await choose('Домен', 'ОСББ Тест')
    await choose('Компанія', 'Перша компанія')
    await choose('Компанія', 'Друга компанія')

    expect(openingDebt()).toHaveValue('2222')
  })

  it('brings the data back when you return to the first company', async () => {
    render(<DebtCalculationBlock />)

    await choose('Домен', 'ОСББ Тест')
    await choose('Компанія', 'Перша компанія')
    await choose('Компанія', 'Друга компанія')
    await choose('Компанія', 'Перша компанія')

    // The regression: this used to come back empty, because the reset effect
    // wiped what the load effect had just applied and never let it run again.
    expect(openingDebt()).toHaveValue('1111')
  })

  it('leaves the field empty for a company with nothing saved', async () => {
    ;(useGetDebtCalculationQuery as jest.Mock).mockReturnValue({
      data: null,
      isFetching: false,
    })
    render(<DebtCalculationBlock />)

    await choose('Домен', 'ОСББ Тест')
    await choose('Компанія', 'Перша компанія')

    expect(openingDebt()).toHaveValue('')
  })

  it('does not carry one company’s edits over to another', async () => {
    ;(useGetDebtCalculationQuery as jest.Mock).mockReturnValue({
      data: null,
      isFetching: false,
    })
    render(<DebtCalculationBlock />)

    await choose('Домен', 'ОСББ Тест')
    await choose('Компанія', 'Перша компанія')
    await userEvent.type(openingDebt(), '999')
    expect(openingDebt()).toHaveValue('999')

    await choose('Компанія', 'Друга компанія')

    expect(openingDebt()).toHaveValue('')
  })
})
