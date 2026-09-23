import { useGetDomainIdsByServiceTypeQuery } from '@common/api/domainApi/domain.api'
import { useGetInflationIndexesQuery } from '@common/api/inflationIndexApi/inflationIndex.api'
import {
  useDeleteDebtCalculationMutation,
  useGetDebtCalculationsQuery,
  useSaveDebtCalculationMutation,
} from '@common/api/debtCalculationApi/debtCalculation.api'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import { buildDebtCalculationInput } from '@utils/debt-calculation/build-input'
import { calculateDebt } from '@utils/debt-calculation/calculate'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DebtCalculationBlock, {
  DebtCalculationContext,
  IDebtCalculationContext,
} from './'
import MonthsTable from './MonthsTable'
import DebtCalculationHeader from './Header'
import DebtCalculationTable from './Table'

jest.mock('@common/api/domainApi/domain.api', () => ({
  useGetDomainIdsByServiceTypeQuery: jest.fn(),
  useGetDomainsQuery: jest.fn(() => ({ data: [] })),
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
  useGetDebtCalculationsQuery: jest.fn(),
  useSaveDebtCalculationMutation: jest.fn(),
  useDeleteDebtCalculationMutation: jest.fn(),
}))

const COMPANY: IExtendedRealestate = {
  _id: 'apt-1',
  companyName: 'Квартира №3, Петренко П. П.',
  description: 'о/р 123456',
  totalArea: 67.08,
  pricePerMeter: 5.25,
} as IExtendedRealestate

const result = calculateDebt(
  buildDebtCalculationInput({
    company: COMPANY,
    from: { year: 2024, month: 1 },
    to: { year: 2024, month: 3 },
    indexByPeriod: { '2024-01': 100.4, '2024-02': 100.3, '2024-03': 100.5 },
    overrides: { openingDebt: 100 },
  })
)

const makeContext = (
  patch: Partial<IDebtCalculationContext> = {}
): IDebtCalculationContext =>
  ({
    domainId: 'domain-1',
    setDomainId: jest.fn(),
    allowedDomainIds: ['domain-1'],
    annualRatePercent: 3,
    inflationMethod: 'balance',
    setFrom: jest.fn(),
    setTo: jest.fn(),
    setAnnualRatePercent: jest.fn(),
    setInflationMethod: jest.fn(),
    companies: [COMPANY],
    results: { 'apt-1': result },
    overrides: {},
    prefillByCompany: {},
    savedCalculations: [],
    name: '',
    setName: jest.fn(),
    isDirty: false,
    isSaving: false,
    save: jest.fn(),
    load: jest.fn(),
    remove: jest.fn(),
    reset: jest.fn(),
    setApartmentOverride: jest.fn(),
    setMonthOverride: jest.fn(),
    missingIndexPeriods: [],
    isLoading: false,
    ...patch,
  }) as IDebtCalculationContext

const renderWithContext = (
  ui: React.ReactElement,
  patch?: Partial<IDebtCalculationContext>
) =>
  render(
    <DebtCalculationContext.Provider value={makeContext(patch)}>
      {ui}
    </DebtCalculationContext.Provider>
  )

beforeEach(() => {
  jest.clearAllMocks()
  ;(useGetDomainIdsByServiceTypeQuery as jest.Mock).mockReturnValue({
    data: ['domain-1'],
    isLoading: false,
  })
  ;(useGetAllRealEstateQuery as jest.Mock).mockReturnValue({
    data: { data: [] },
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
  ;(useGetDebtCalculationsQuery as jest.Mock).mockReturnValue({ data: [] })
  ;(useSaveDebtCalculationMutation as jest.Mock).mockReturnValue([
    jest.fn(),
    { isLoading: false },
  ])
  ;(useDeleteDebtCalculationMutation as jest.Mock).mockReturnValue([
    jest.fn(),
    { isLoading: false },
  ])
})

describe('DebtCalculationBlock — гейт доступу', () => {
  it('показує пояснення, коли жоден домен не має послуги «Квартплата»', () => {
    ;(useGetDomainIdsByServiceTypeQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    })

    render(<DebtCalculationBlock />)

    expect(
      screen.getByText('Розрахунок заборгованості недоступний')
    ).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('показує сторінку, щойно хоч один домен має послугу', () => {
    render(<DebtCalculationBlock />)

    expect(
      screen.queryByText('Розрахунок заборгованості недоступний')
    ).not.toBeInTheDocument()
    expect(
      screen.getByText('Оберіть домен, щоб побачити квартири')
    ).toBeInTheDocument()
  })
})

describe('DebtCalculationTable', () => {
  it('просить обрати домен, поки його не обрано', () => {
    renderWithContext(<DebtCalculationTable />, { domainId: undefined })

    expect(
      screen.getByText('Оберіть домен, щоб побачити квартири')
    ).toBeInTheDocument()
  })

  it('показує назву й опис квартири', () => {
    renderWithContext(<DebtCalculationTable />)

    expect(screen.getByText('Квартира №3, Петренко П. П.')).toBeInTheDocument()
    expect(screen.getByText('о/р 123456')).toBeInTheDocument()
  })

  it('виводить тіло, річні, інфляційні та разом у рядку квартири', () => {
    renderWithContext(<DebtCalculationTable />)

    const row = screen
      .getByText('Квартира №3, Петренко П. П.')
      .closest('tr') as HTMLElement

    expect(within(row).getByText(result.body.toFixed(2))).toBeInTheDocument()
    expect(
      within(row).getByText(result.interest.toFixed(2))
    ).toBeInTheDocument()
    expect(
      within(row).getByText(result.inflation.toFixed(2))
    ).toBeInTheDocument()
    expect(within(row).getByText(result.total.toFixed(2))).toBeInTheDocument()
  })

  it('підсумковий рядок повторює єдину квартиру', () => {
    renderWithContext(<DebtCalculationTable />)

    const totals = screen
      .getByText('Разом по 1 квартирах')
      .closest('tr') as HTMLElement

    expect(
      within(totals).getByText(result.total.toFixed(2))
    ).toBeInTheDocument()
  })

  it('підказує площу й тариф компанії плейсхолдерами, поки їх не правили', () => {
    renderWithContext(<DebtCalculationTable />)

    expect(screen.getByPlaceholderText('67.08')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('5.25')).toBeInTheDocument()
  })

  it('попереджає про місяці без індексу в довіднику', () => {
    renderWithContext(<DebtCalculationTable />, {
      missingIndexPeriods: ['2024-02', '2024-03'],
    })

    expect(
      screen.getByText(
        'У довіднику немає індексу інфляції за деякі місяці періоду'
      )
    ).toBeInTheDocument()
    expect(screen.getByText(/2024-02, 2024-03/)).toBeInTheDocument()
  })
})

describe('MonthsTable', () => {
  it('рендерить рядок на кожен місяць періоду', () => {
    renderWithContext(<MonthsTable companyId="apt-1" result={result} />)

    expect(screen.getByText('Січень 2024')).toBeInTheDocument()
    expect(screen.getByText('Лютий 2024')).toBeInTheDocument()
    expect(screen.getByText('Березень 2024')).toBeInTheDocument()
  })

  it('перший місяць має коефіцієнт 1 — індекс місяця виникнення не рахується', () => {
    renderWithContext(<MonthsTable companyId="apt-1" result={result} />)

    expect(result.rows[0].coefficient).toBe(1)
    expect(screen.getAllByText('1.0000').length).toBeGreaterThan(0)
  })

  it('у підсумку показує суму днів і підсумкові інфляційні', () => {
    renderWithContext(<MonthsTable companyId="apt-1" result={result} />)

    const totals = screen.getByText('Всього').closest('tr')
    expect(
      within(totals).getByText(String(result.totals.days))
    ).toBeInTheDocument()
    expect(
      within(totals).getByText(result.inflation.toFixed(2))
    ).toBeInTheDocument()
  })

  it('пояснює, чому інфляційні — не сума колонки', () => {
    renderWithContext(<MonthsTable companyId="apt-1" result={result} />)

    expect(
      screen.getByText(/значення останнього місяця, а не сума по колонці/)
    ).toBeInTheDocument()
  })

  it('для помісячного методу показує інше пояснення', () => {
    renderWithContext(<MonthsTable companyId="apt-1" result={result} />, {
      inflationMethod: 'monthly',
    })

    expect(
      screen.getByText(/кожне нарахування індексується від свого місяця/)
    ).toBeInTheDocument()
  })
})

describe('MonthsTable — префіл із бази', () => {
  const prefillByCompany = {
    'apt-1': {
      '2024-01': { paid: 500, charged: 419.25, tariff: 6.25 },
    },
  }

  it('показує підтягнуте значенням, а не сірим плейсхолдером', () => {
    renderWithContext(<MonthsTable companyId="apt-1" result={result} />, {
      prefillByCompany,
    })

    expect(screen.getByDisplayValue('500')).toBeInTheDocument()
    expect(screen.getByDisplayValue('419.25')).toBeInTheDocument()
    expect(screen.getByDisplayValue('6.25')).toBeInTheDocument()
  })

  it('ручна правка місяця перекриває підтягнуте', () => {
    renderWithContext(<MonthsTable companyId="apt-1" result={result} />, {
      prefillByCompany,
      overrides: { 'apt-1': { months: { '2024-01': { paid: 123 } } } },
    })

    expect(screen.getByDisplayValue('123')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('500')).not.toBeInTheDocument()
  })

  it('місяці без префілу лишаються порожніми', () => {
    renderWithContext(<MonthsTable companyId="apt-1" result={result} />, {
      prefillByCompany,
    })

    // Префіл є лише на січень — лютий і березень порожні.
    expect(screen.getAllByDisplayValue('500')).toHaveLength(1)
  })
})

describe('DebtCalculationHeader — збереження', () => {
  it('позначає незбережені зміни', () => {
    renderWithContext(<DebtCalculationHeader />, { isDirty: true })

    expect(screen.getByText('Незбережені зміни')).toBeInTheDocument()
  })

  it('без змін позначки немає', () => {
    renderWithContext(<DebtCalculationHeader />, { isDirty: false })

    expect(screen.queryByText('Незбережені зміни')).not.toBeInTheDocument()
  })

  it('кнопка зберігає новий розрахунок', async () => {
    const save = jest.fn()
    renderWithContext(<DebtCalculationHeader />, { save, name: 'Крошенська 8' })

    const button = screen.getByRole('button', { name: /Зберегти/ })
    await userEvent.click(button)

    expect(save).toHaveBeenCalled()
  })

  it('для відкритого розрахунку кнопка каже «Зберегти зміни»', () => {
    renderWithContext(<DebtCalculationHeader />, { currentId: 'calc-1' })

    expect(
      screen.getByRole('button', { name: /Зберегти зміни/ })
    ).toBeInTheDocument()
  })

  it('кнопки видалення немає, поки розрахунок не збережено', () => {
    renderWithContext(<DebtCalculationHeader />, { currentId: undefined })

    expect(screen.queryByLabelText('delete')).not.toBeInTheDocument()
  })
})

describe('DebtCalculationHeader — експорт', () => {
  it('показує кнопку експорту', () => {
    renderWithContext(<DebtCalculationHeader />)

    expect(
      screen.getByRole('button', { name: /Експорт в Excel/ })
    ).toBeInTheDocument()
  })

  it('кнопка вимкнена, поки домен не обрано', () => {
    renderWithContext(<DebtCalculationHeader />, { domainId: undefined })

    expect(
      screen.getByRole('button', { name: /Експорт в Excel/ })
    ).toBeDisabled()
  })

  it('без квартир попереджає замість формування файлу', async () => {
    renderWithContext(<DebtCalculationHeader />, {
      companies: [],
      results: {},
    })

    await userEvent.click(
      screen.getByRole('button', { name: /Експорт в Excel/ })
    )

    expect(await screen.findByText(/Немає що експортувати/)).toBeInTheDocument()
  })
})
