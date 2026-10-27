import { useGetDebtCalculationQuery } from '@common/api/debtCalculationApi/debtCalculation.api'
import {
  useGetDomainIdsByServiceTypeQuery,
  useGetDomainsQuery,
} from '@common/api/domainApi/domain.api'
import { useGetInflationIndexesQuery } from '@common/api/inflationIndexApi/inflationIndex.api'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event'
import { useRouter } from 'next/compat/router'
import DebtCalculationBlock from './'

jest.mock('next/compat/router', () => ({ useRouter: jest.fn(() => null) }))

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
  usePlanStatementImportMutation: jest.fn(() => [jest.fn(), {}]),
  useImportStatementMutation: jest.fn(() => [jest.fn(), {}]),
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

// Why: antd's CSS-in-JS makes jsdom getComputedStyle slow, and both
// user-event's pointer-events check and getByRole's visibility check run it up
// the ancestor chain. Under a full parallel run that timed tests out, and a
// closing dropdown still animating with `pointer-events: none` failed the
// next click outright. The selects are always on screen, so neither check
// adds anything here.
const user = userEvent.setup({
  pointerEventsCheck: PointerEventsCheckLevel.Never,
})

/** Picks an option out of an antd Select addressed by its aria-label. */
const choose = async (select: string, option: string): Promise<void> => {
  await user.click(screen.getByRole('combobox', { name: select, hidden: true }))
  const target = (await screen.findAllByTitle(option)).find((element) =>
    element.classList.contains('ant-select-item-option')
  )
  await user.click(target)
}

const selected = (select: string): string =>
  screen
    .getByRole('combobox', { name: select, hidden: true })
    .closest('.ant-select')
    .querySelector('.ant-select-selection-item')
    ?.getAttribute('title') ?? ''

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
    currentData: { data: COMPANIES },
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

    await choose('Компанія', 'Перша компанія')

    expect(openingDebt()).toHaveValue('1111')
  })

  it('shows the other company its own data, not the previous one', async () => {
    render(<DebtCalculationBlock />)

    await choose('Компанія', 'Перша компанія')
    await choose('Компанія', 'Друга компанія')

    expect(openingDebt()).toHaveValue('2222')
  })

  it('brings the data back when you return to the first company', async () => {
    render(<DebtCalculationBlock />)

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

    await choose('Компанія', 'Перша компанія')

    expect(openingDebt()).toHaveValue('')
  })

  it('does not carry one company’s edits over to another', async () => {
    ;(useGetDebtCalculationQuery as jest.Mock).mockReturnValue({
      data: null,
      isFetching: false,
    })
    render(<DebtCalculationBlock />)

    await choose('Компанія', 'Перша компанія')
    await user.type(openingDebt(), '999')
    expect(openingDebt()).toHaveValue('999')

    await choose('Компанія', 'Друга компанія')

    expect(openingDebt()).toHaveValue('')
  })
})

describe('page defaults', () => {
  it('starts with the monthly method of art. 625', () => {
    render(<DebtCalculationBlock />)

    const method = screen.getByRole('combobox', { name: 'Метод інфляційних' })
    expect(method.closest('.ant-select')).toHaveTextContent(
      'Помісячний (ст. 625 ЦК)'
    )
  })

  it('a saved «за залишком» calculation keeps its method', async () => {
    ;(useGetDebtCalculationQuery as jest.Mock).mockImplementation(
      ({ companyId }: { companyId?: string }) => ({
        data: companyId
          ? { ...(SAVED[FIRST] as object), inflationMethod: 'balance' }
          : null,
        isFetching: false,
      })
    )
    render(<DebtCalculationBlock />)

    await choose('Компанія', 'Перша компанія')

    const method = screen.getByRole('combobox', { name: 'Метод інфляційних' })
    expect(method.closest('.ant-select')).toHaveTextContent(
      'За залишком (як в Акті)'
    )
  })

  it('shows the month picker in Ukrainian', async () => {
    render(<DebtCalculationBlock />)

    await userEvent.click(screen.getByLabelText('Період з'))

    expect(
      await screen.findByRole('button', { name: 'Обрати рік' })
    ).toBeInTheDocument()
    expect(screen.getByText('Січ')).toBeInTheDocument()
  })
})

describe('auto-picking the domain on open', () => {
  const OTHER_DOMAIN = '507f1f77bcf86cd799439012'
  const OTHER_COMPANY = '507f1f77bcf86cd799439023'
  const OTHER_COMPANIES = [
    {
      _id: OTHER_COMPANY,
      companyName: 'Компанія другого домену',
      totalArea: 30,
      pricePerMeter: 3,
    },
  ]

  beforeEach(() => {
    ;(useRouter as jest.Mock).mockReturnValue(null)
  })

  const withTwoDomains = (): { resolve: () => void } => {
    let isOtherLoaded = false
    ;(useGetDomainIdsByServiceTypeQuery as jest.Mock).mockReturnValue({
      data: [DOMAIN, OTHER_DOMAIN],
      isLoading: false,
    })
    ;(useGetDomainsQuery as jest.Mock).mockReturnValue({
      data: [
        { _id: DOMAIN, name: 'ОСББ Тест' },
        { _id: OTHER_DOMAIN, name: 'ОСББ Друге' },
      ],
    })

    ;(useGetAllRealEstateQuery as jest.Mock).mockImplementation(
      ({ domainId }: { domainId?: string }) =>
        domainId === OTHER_DOMAIN && !isOtherLoaded
          ? { data: { data: COMPANIES }, currentData: undefined }
          : {
              data: {
                data: domainId === OTHER_DOMAIN ? OTHER_COMPANIES : COMPANIES,
              },
              currentData: {
                data: domainId === OTHER_DOMAIN ? OTHER_COMPANIES : COMPANIES,
              },
            }
    )
    return {
      resolve: () => {
        isOtherLoaded = true
      },
    }
  }

  it('opens on the first domain and its first company', async () => {
    render(<DebtCalculationBlock />)

    expect(selected('Домен')).toBe('ОСББ Тест')
    expect(selected('Компанія')).toBe('Перша компанія')
  })

  it('loads the dependent data of the auto-picked company', async () => {
    render(<DebtCalculationBlock />)

    await waitFor(() => expect(openingDebt()).toHaveValue('1111'))
    expect(useGetAllPaymentsQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ domainIds: [DOMAIN], companyIds: [FIRST] }),
      { skip: false }
    )
    expect(useGetAllServicesQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ domainId: DOMAIN }),
      { skip: false }
    )
  })

  it('keeps a domain and company that are already chosen', async () => {
    withTwoDomains().resolve()
    ;(useRouter as jest.Mock).mockReturnValue({
      query: { domainId: OTHER_DOMAIN, companyId: OTHER_COMPANY },
    })
    render(<DebtCalculationBlock />)

    expect(selected('Домен')).toBe('ОСББ Друге')
    expect(selected('Компанія')).toBe('Компанія другого домену')
  })

  it('leaves the selector empty when there is no domain to pick', () => {
    ;(useGetDomainIdsByServiceTypeQuery as jest.Mock).mockReturnValue({
      data: [DOMAIN],
      isLoading: false,
    })
    ;(useGetDomainsQuery as jest.Mock).mockReturnValue({ data: [] })
    render(<DebtCalculationBlock />)

    expect(selected('Домен')).toBe('')
    expect(useGetAllRealEstateQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ domainId: undefined }),
      { skip: true }
    )
  })

  it('a manual switch picks the new domain’s company, not the old one’s', async () => {
    const { resolve } = withTwoDomains()
    const { rerender } = render(<DebtCalculationBlock />)
    expect(selected('Компанія')).toBe('Перша компанія')

    await choose('Домен', 'ОСББ Друге')
    expect(selected('Домен')).toBe('ОСББ Друге')
    expect(selected('Компанія')).toBe('')

    resolve()
    rerender(<DebtCalculationBlock />)

    expect(selected('Компанія')).toBe('Компанія другого домену')
  })
})
