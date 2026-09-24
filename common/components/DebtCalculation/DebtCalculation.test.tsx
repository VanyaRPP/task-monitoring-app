import { useGetDomainIdsByServiceTypeQuery } from '@common/api/domainApi/domain.api'
import {
  useGetDebtCalculationQuery,
  useSaveDebtCalculationMutation,
} from '@common/api/debtCalculationApi/debtCalculation.api'
import { useGetInflationIndexesQuery } from '@common/api/inflationIndexApi/inflationIndex.api'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { buildDebtCalculationInput } from '@utils/debt-calculation/build-input'
import { calculateDebt } from '@utils/debt-calculation/calculate'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import DebtCalculationBlock, {
  DebtCalculationContext,
  IDebtCalculationContext,
} from './'
import { asOfDate } from './ActSummary'
import DebtActSummary from './ActSummary'
import DebtCalculationBody from './Body'
import DebtCalculationHeader from './Header'
import MonthsTable from './MonthsTable'

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
  useGetDebtCalculationQuery: jest.fn(),
  useSaveDebtCalculationMutation: jest.fn(),
}))

const COMPANY: IExtendedRealestate = {
  _id: 'apt-1',
  companyName: 'Квартира №18, вул. Крошенська 8',
  description: 'о/р 123456',
  totalArea: 67.08,
  pricePerMeter: 5.25,
} as IExtendedRealestate

const result = calculateDebt(
  buildDebtCalculationInput({
    company: COMPANY,
    from: { year: 2026, month: 1 },
    to: { year: 2026, month: 3 },
    indexByPeriod: { '2026-01': 100.7, '2026-02': 101, '2026-03': 101.7 },
    overrides: { openingDebt: 8371.52, legalFees: 3000, courtFee: 1211.2 },
  })
)

const makeContext = (
  patch: Partial<IDebtCalculationContext> = {}
): IDebtCalculationContext =>
  ({
    allowedDomainIds: ['domain-1'],
    domainId: 'domain-1',
    setDomainId: jest.fn(),
    companies: [COMPANY],
    companyId: 'apt-1',
    setCompanyId: jest.fn(),
    company: COMPANY,
    from: dayjs('2026-01-01'),
    to: dayjs('2026-03-01'),
    setFrom: jest.fn(),
    setTo: jest.fn(),
    annualRatePercent: 3,
    setAnnualRatePercent: jest.fn(),
    inflationMethod: 'balance',
    setInflationMethod: jest.fn(),
    result,
    overrides: { openingDebt: 8371.52, legalFees: 3000, courtFee: 1211.2 },
    prefillMonths: {},
    indexByPeriod: { '2026-01': 100.7, '2026-02': 101, '2026-03': 101.7 },
    setApartmentOverride: jest.fn(),
    setMonthOverride: jest.fn(),
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
  ;(useGetDebtCalculationQuery as jest.Mock).mockReturnValue({
    data: null,
    isFetching: false,
  })
  ;(useSaveDebtCalculationMutation as jest.Mock).mockReturnValue([
    jest.fn(),
    { isLoading: false },
  ])
})

describe('DebtCalculationBlock — гейт доступу', () => {
  it('пояснює, коли жоден домен не має послуги «Квартплата»', () => {
    ;(useGetDomainIdsByServiceTypeQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    })

    render(<DebtCalculationBlock />)

    expect(
      screen.getByText('Розрахунок заборгованості недоступний')
    ).toBeInTheDocument()
  })

  it('пускає, щойно хоч один домен має послугу', () => {
    render(<DebtCalculationBlock />)

    expect(
      screen.getByText('Оберіть домен у фільтрі згори')
    ).toBeInTheDocument()
  })
})

describe('Body — порожні стани', () => {
  it('просить обрати домен', () => {
    renderWithContext(<DebtCalculationBody />, { domainId: undefined })

    expect(
      screen.getByText('Оберіть домен у фільтрі згори')
    ).toBeInTheDocument()
  })

  it('просить обрати компанію', () => {
    renderWithContext(<DebtCalculationBody />, {
      companyId: undefined,
      result: undefined,
    })

    expect(
      screen.getByText('Оберіть компанію, щоб побачити розрахунок')
    ).toBeInTheDocument()
  })
})

describe('Body — обрана квартира', () => {
  it('показує назву й опис квартири', () => {
    renderWithContext(<DebtCalculationBody />)

    expect(
      screen.getByText('Квартира №18, вул. Крошенська 8')
    ).toBeInTheDocument()
    expect(screen.getByText('о/р 123456')).toBeInTheDocument()
  })

  it('підказує площу й тариф компанії плейсхолдерами', () => {
    renderWithContext(<DebtCalculationBody />, { overrides: {} })

    // The company parameter fields, not the same-named monthly table columns.
    expect(screen.getByLabelText('Площа, м²')).toHaveAttribute(
      'placeholder',
      '67.08'
    )
    expect(screen.getByLabelText('Тариф, грн/м²')).toHaveAttribute(
      'placeholder',
      '5.25'
    )
    expect(screen.getByLabelText('Борг на початок періоду')).toBeInTheDocument()
  })
})

describe('ActSummary — підсумок у стилі Акта', () => {
  it('рахує дату «станом на» як перше число наступного місяця', () => {
    expect(asOfDate(dayjs('2025-06-01'))).toBe('01.07.2025')
    expect(asOfDate(dayjs('2025-12-01'))).toBe('01.01.2026')
    expect(asOfDate(undefined)).toBe('—')
  })

  it('виводить загальну суму заборгованості', () => {
    renderWithContext(<DebtActSummary result={result} />)

    expect(
      screen.getByText(/Заборгованість станом на 01\.04\.2026 року/)
    ).toBeInTheDocument()
    expect(screen.getByText(result.total.toFixed(2))).toBeInTheDocument()
  })

  it('розбиває на внесок, річні та інфляційні', () => {
    renderWithContext(<DebtActSummary result={result} />)

    expect(screen.getByText('внесок')).toBeInTheDocument()
    expect(screen.getByText('3% річних')).toBeInTheDocument()
    expect(screen.getByText('Інфляційні витрати')).toBeInTheDocument()
    expect(screen.getByText(result.body.toFixed(2))).toBeInTheDocument()
    expect(screen.getByText(result.interest.toFixed(2))).toBeInTheDocument()
  })

  it('називає фактичну ставку, а не захардкожені 3%', () => {
    renderWithContext(<DebtActSummary result={result} />, {
      annualRatePercent: 6,
    })

    expect(screen.getByText('6% річних')).toBeInTheDocument()
    expect(screen.queryByText('3% річних')).not.toBeInTheDocument()
  })

  it('юридичні послуги й держмито редагуються тут', async () => {
    const setApartmentOverride = jest.fn()
    renderWithContext(<DebtActSummary result={result} />, {
      setApartmentOverride,
      overrides: {},
    })

    expect(screen.getByText('Юридичні послуги')).toBeInTheDocument()
    expect(screen.getByText('Держмито')).toBeInTheDocument()

    const [legalFees] = screen.getAllByPlaceholderText('0.00')
    await userEvent.type(legalFees, '5')

    expect(setApartmentOverride).toHaveBeenCalledWith({ legalFees: 5 })
  })

  it('має місце для підпису голови правління', () => {
    renderWithContext(<DebtActSummary result={result} />)

    expect(screen.getByText('Голова правління')).toBeInTheDocument()
  })
})

describe('MonthsTable', () => {
  it('рендерить рядок на кожен місяць', () => {
    renderWithContext(<MonthsTable result={result} />)

    expect(screen.getByText('Січень 2026')).toBeInTheDocument()
    expect(screen.getByText('Березень 2026')).toBeInTheDocument()
  })

  it('у підсумку показує суму днів і підсумкові інфляційні', () => {
    renderWithContext(<MonthsTable result={result} />)

    const totals = screen.getByText('Всього').closest('tr')
    expect(
      within(totals).getByText(String(result.totals.days))
    ).toBeInTheDocument()
  })
})

describe('Header', () => {
  it('кнопка експорту стоїть окремо і вимкнена без квартири', () => {
    renderWithContext(<DebtCalculationHeader />, {
      companyId: undefined,
      result: undefined,
    })

    expect(
      screen.getByRole('button', { name: /Експорт в Excel/ })
    ).toBeDisabled()
  })

  it('селект компанії вимкнений, поки не обрано домен', () => {
    renderWithContext(<DebtCalculationHeader />, { domainId: undefined })

    expect(screen.getByRole('combobox', { name: 'Компанія' })).toBeDisabled()
  })

  it('з обраним доменом селект компанії доступний', () => {
    renderWithContext(<DebtCalculationHeader />)

    expect(
      screen.getByRole('combobox', { name: 'Компанія' })
    ).not.toBeDisabled()
  })

  it('кнопок збереження більше немає', () => {
    renderWithContext(<DebtCalculationHeader />)

    expect(screen.queryByRole('button', { name: /Зберегти/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Новий/ })).toBeNull()
  })
})

describe('MonthsTable — позначка відсутнього індексу', () => {
  const statusOf = (month: string): string =>
    screen
      .getByRole('spinbutton', { name: `Індекс інфляції за ${month}` })
      .closest('.ant-input-number').className

  it('не чіпає місяць, індекс якого є в довіднику', () => {
    renderWithContext(<MonthsTable result={result} />)

    expect(statusOf('Січень 2026')).not.toContain('status-error')
  })

  it('рівно 100 у довіднику — це справжнє значення, не помилка', () => {
    // Липень 2024 і липень 2026 у засіяному довіднику саме такі: 100.0.
    // Рядок теж має нести 100, інакше перевірка не відтворює баг.
    const flat = { '2026-01': 100, '2026-02': 100, '2026-03': 100 }
    const flatResult = calculateDebt(
      buildDebtCalculationInput({
        company: COMPANY,
        from: { year: 2026, month: 1 },
        to: { year: 2026, month: 3 },
        indexByPeriod: flat,
        overrides: { openingDebt: 8371.52 },
      })
    )
    expect(flatResult.rows[0].inflationIndex).toBe(100)

    renderWithContext(<MonthsTable result={flatResult} />, {
      indexByPeriod: flat,
    })

    expect(statusOf('Січень 2026')).not.toContain('status-error')
  })

  it('червонить місяць, якого в довіднику немає', () => {
    renderWithContext(<MonthsTable result={result} />, {
      indexByPeriod: { '2026-02': 101, '2026-03': 101.7 },
    })

    expect(statusOf('Січень 2026')).toContain('status-error')
  })

  it('ручна правка знімає позначку навіть без довідника', () => {
    renderWithContext(<MonthsTable result={result} />, {
      indexByPeriod: {},
      overrides: { months: { '2026-01': { inflationIndex: 101.2 } } },
    })

    expect(statusOf('Січень 2026')).not.toContain('status-error')
  })
})
