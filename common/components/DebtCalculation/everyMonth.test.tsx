import {
  buildDebtCalculationInput,
  IApartmentOverrides,
  IMonthOverride,
} from '@utils/debt-calculation/build-input'
import { calculateDebt } from '@utils/debt-calculation/calculate'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { useState } from 'react'
import { DebtCalculationContext, IDebtCalculationContext } from './'
import DebtCalculationBody from './Body'
import { formatMoney } from './format'

const COMPANY = {
  _id: 'apt-1',
  companyName: 'Квартира №23',
  description: 'вул. Тестова 3',
  totalArea: 50,
  pricePerMeter: 0,
} as IExtendedRealestate

const FROM = { year: 2026, month: 1 }
const TO = { year: 2026, month: 3 }
const INDEXES = { '2026-01': 100.7, '2026-02': 101, '2026-03': 101.7 }

/** The page's own state: edits go through the same setters the page has. */
const Page: React.FC = () => {
  const [overrides, setOverrides] = useState<IApartmentOverrides>({})
  const result = calculateDebt(
    buildDebtCalculationInput({
      company: COMPANY,
      from: FROM,
      to: TO,
      indexByPeriod: INDEXES,
      overrides,
    })
  )

  return (
    <DebtCalculationContext.Provider
      value={
        {
          domainId: 'domain-1',
          companyId: 'apt-1',
          company: COMPANY,
          from: dayjs('2026-01-01'),
          to: dayjs('2026-03-01'),
          annualRatePercent: 3,
          inflationMethod: 'balance',
          result,
          overrides,
          prefillMonths: {},
          indexByPeriod: INDEXES,
          excludedPeriods: [],
          setApartmentOverride: (patch: Partial<IApartmentOverrides>) =>
            setOverrides((prev) => ({ ...prev, ...patch })),
          setMonthOverride: (period: string, patch: IMonthOverride) =>
            setOverrides((prev) => ({
              ...prev,
              months: {
                ...prev.months,
                [period]: { ...prev.months?.[period], ...patch },
              },
            })),
          setLegalFees: jest.fn(),
        } as unknown as IDebtCalculationContext
      }
    >
      <DebtCalculationBody />
      <output data-testid="body">{formatMoney(result.body)}</output>
      <output data-testid="interest">{formatMoney(result.interest)}</output>
      <output data-testid="days">{result.totals.days}</output>
    </DebtCalculationContext.Provider>
  )
}

const body = () => screen.getByTestId('body').textContent
const interest = () => Number(screen.getByTestId('interest').textContent)

describe('the same figures for every month, on the page', () => {
  it('one «Нараховано щомісяця» bills every month', async () => {
    render(<Page />)
    // No tariff and no charge anywhere: nothing is owed.
    expect(body()).toBe('0.00')

    await userEvent.type(screen.getByLabelText('Нараховано щомісяця'), '498.67')

    expect(body()).toBe(formatMoney(498.67 * 3))
  })

  it('«Сплачено щомісяця» takes the same off every month', async () => {
    render(<Page />)
    await userEvent.type(screen.getByLabelText('Нараховано щомісяця'), '500')
    await userEvent.type(screen.getByLabelText('Сплачено щомісяця'), '120')

    expect(body()).toBe(formatMoney(3 * (500 - 120)))
  })

  it('a month typed by hand keeps its own figure', async () => {
    render(<Page />)
    await userEvent.type(screen.getByLabelText('Нараховано щомісяця'), '500')

    // February billed nothing: a typed 0 stays 0, it is not refilled with 500.
    const february = screen.getByRole('row', { name: /Лютий 2026/ })
    const [, charged] = within(february).getAllByRole('spinbutton')
    await userEvent.type(charged, '0')

    expect(body()).toBe(formatMoney(2 * 500))
  })
})

describe('the day the debt starts on, and days per month', () => {
  const daysCell = (index: number) =>
    screen.getAllByRole('spinbutton', { name: /^Днів,/ })[index]

  it('shows the whole month until a start day is picked', () => {
    render(<Page />)
    expect(daysCell(0)).toHaveAttribute('placeholder', '31')
  })

  it('the selector of the day bills the first month for the days left', async () => {
    render(<Page />)
    await userEvent.type(screen.getByLabelText('Нараховано щомісяця'), '500')
    const before = interest()

    await userEvent.click(
      screen.getByRole('combobox', { name: 'Перший місяць — з числа' })
    )
    await userEvent.click(await screen.findByTitle('10'))

    // 10th to 31st January: 22 days.
    expect(daysCell(0)).toHaveAttribute('placeholder', '22')
    expect(daysCell(1)).toHaveAttribute('placeholder', '28')
    // The charge is for those days too: 500 × 22 / 31, then two full months.
    const january = screen.getByRole('row', { name: /Січень 2026/ })
    expect(within(january).getAllByRole('spinbutton')[1]).toHaveAttribute(
      'placeholder',
      '354.84'
    )
    expect(body()).toBe(formatMoney(354.84 + 500 + 500))
    expect(interest()).toBeLessThan(before)
  })

  it('a day count typed into a month replaces the calendar one, charge too', async () => {
    render(<Page />)
    await userEvent.type(screen.getByLabelText('Нараховано щомісяця'), '500')

    await userEvent.type(daysCell(1), '14')

    expect(daysCell(1)).toHaveValue('14')
    // 31 + 14 + 31
    expect(screen.getByTestId('days').textContent).toBe('76')
    // February has 28 days: half of 500.
    expect(body()).toBe(formatMoney(500 + 250 + 500))
  })

  it('cannot go past the days of the month', async () => {
    render(<Page />)
    expect(daysCell(1)).toHaveAttribute('aria-valuemax', '28')
  })
})
