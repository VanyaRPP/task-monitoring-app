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
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event'
import { defaultDebtPeriod } from '@utils/debt-calculation/company-debt'
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
  usePlanStatementImportMutation: jest.fn(() => [jest.fn(), {}]),
  useImportStatementMutation: jest.fn(() => [jest.fn(), {}]),
}))

jest.mock('@common/api/serviceApi/service.api', () => ({
  useGetAllServicesQuery: jest.fn(),
}))

// Fixed, so the page opens on a period the КМУ №206 moratorium falls in.
jest.mock('@utils/debt-calculation/company-debt', () => ({
  ...jest.requireActual('@utils/debt-calculation/company-debt'),
  defaultDebtPeriod: jest.fn(),
}))

jest.mock('@common/api/debtCalculationApi/debtCalculation.api', () => ({
  useGetDebtCalculationQuery: jest.fn(),
  useSaveDebtCalculationMutation: jest.fn(() => [
    jest.fn(),
    { isLoading: false },
  ]),
}))

const OVERLAPPING_PERIOD = {
  from: { year: 2022, month: 6 },
  to: { year: 2023, month: 5 },
}

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
  await user.click(await screen.findByTitle(option))
}

const openingDebt = (): HTMLInputElement =>
  screen.getByLabelText('Борг на початок періоду') as HTMLInputElement

beforeEach(() => {
  jest.clearAllMocks()
  ;(defaultDebtPeriod as jest.Mock).mockReturnValue(OVERLAPPING_PERIOD)
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
    await user.type(openingDebt(), '999')
    expect(openingDebt()).toHaveValue('999')

    await choose('Компанія', 'Друга компанія')

    expect(openingDebt()).toHaveValue('')
  })
})

describe('excluded periods follow their company', () => {
  beforeEach(() => {
    ;(defaultDebtPeriod as jest.Mock).mockReturnValue(OVERLAPPING_PERIOD)
    ;(useGetDebtCalculationQuery as jest.Mock).mockReturnValue({
      data: null,
      isFetching: false,
    })
  })

  // Plain DOM queries: role queries crawl on a page with this many inputs.
  const settingsButton = (): HTMLElement =>
    document.querySelector('button[aria-label="Виключені періоди"]')

  const cmuSwitch = (): HTMLElement | null =>
    document.querySelector('button[role="switch"]')

  /** The badge on the settings button: how many periods apply here. */
  const periodCount = (): string =>
    settingsButton().closest('.ant-badge')?.querySelector('sup')?.textContent ??
    '0'

  const isOn = (): boolean =>
    cmuSwitch()?.getAttribute('aria-checked') === 'true'

  it('a new calculation starts with the КМУ №206 moratorium on', async () => {
    render(<DebtCalculationBlock />)
    await choose('Домен', 'ОСББ Тест')
    await choose('Компанія', 'Перша компанія')

    expect(isOn()).toBe(true)
    expect(periodCount()).toBe('1')
  })

  it('a calculation saved without it keeps none', async () => {
    ;(useGetDebtCalculationQuery as jest.Mock).mockReturnValue({
      data: SAVED[FIRST],
      isFetching: false,
    })
    render(<DebtCalculationBlock />)
    await choose('Домен', 'ОСББ Тест')
    await choose('Компанія', 'Перша компанія')

    expect(isOn()).toBe(false)
    expect(periodCount()).toBe('0')
  })

  it('a calculation saved with it has it', async () => {
    ;(useGetDebtCalculationQuery as jest.Mock).mockReturnValue({
      data: {
        ...(SAVED[FIRST] as object),
        overrides: {
          [FIRST]: {
            excludedPeriods: [
              {
                id: 'p1',
                type: 'cmu_206',
                startDate: '2022-02-24',
                endDate: '2023-12-29',
              },
            ],
          },
        },
      },
      isFetching: false,
    })
    render(<DebtCalculationBlock />)
    await choose('Домен', 'ОСББ Тест')
    await choose('Компанія', 'Перша компанія')

    expect(isOn()).toBe(true)
  })

  it('switching it off stays off when you come back to the company', async () => {
    render(<DebtCalculationBlock />)
    await choose('Домен', 'ОСББ Тест')
    await choose('Компанія', 'Перша компанія')
    await user.click(cmuSwitch())
    expect(isOn()).toBe(false)

    // The other company is new too: it starts with the moratorium on.
    await choose('Компанія', 'Друга компанія')
    expect(isOn()).toBe(true)

    await choose('Компанія', 'Перша компанія')
    expect(isOn()).toBe(false)
    expect(periodCount()).toBe('0')
  })

  it('an added period is still there when you come back', async () => {
    render(<DebtCalculationBlock />)
    await choose('Домен', 'ОСББ Тест')
    await choose('Компанія', 'Перша компанія')
    await user.click(settingsButton())
    await user.click(await screen.findByText('Додати період'))
    await user.click(settingsButton())
    await choose('Компанія', 'Друга компанія')
    await choose('Компанія', 'Перша компанія')

    await user.click(settingsButton())
    // Two rows - the default КМУ №206 and the added one - of two date fields.
    expect((await screen.findAllByLabelText('Виключений період')).length).toBe(
      4
    )
  })

  it('has no switch when the moratorium is outside the period', async () => {
    ;(defaultDebtPeriod as jest.Mock).mockReturnValue({
      from: { year: 2025, month: 10 },
      to: { year: 2026, month: 9 },
    })
    render(<DebtCalculationBlock />)
    await choose('Домен', 'ОСББ Тест')
    await choose('Компанія', 'Перша компанія')

    expect(cmuSwitch()).toBeNull()
    expect(periodCount()).toBe('0')
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

    await choose('Домен', 'ОСББ Тест')
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
