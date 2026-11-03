import { calculateDebt } from '@utils/debt-calculation/calculate'
import type { IExcludedPeriod } from '@utils/debt-calculation/exclusions'
import { render, screen } from '@testing-library/react'
import dayjs from 'dayjs'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { DebtCalculationContext, IDebtCalculationContext } from './'
import ExcludedPeriods from './ExcludedPeriods'
import MonthsTable from './MonthsTable'

// Made-up months: November 2023 to February 2024, across the end of КМУ №206.
const MONTHS = [
  { year: 2023, month: 11, charged: 300, inflationIndex: 100.5 },
  { year: 2023, month: 12, charged: 300, inflationIndex: 100.7 },
  { year: 2024, month: 1, charged: 300, inflationIndex: 100.4 },
  { year: 2024, month: 2, charged: 300, inflationIndex: 100.3 },
]

const Page: React.FC<{
  initial?: IExcludedPeriod[]
  from?: string
  to?: string
}> = ({ initial = [], from = '2023-11-01', to = '2024-02-01' }) => {
  const [excludedPeriods, setExcludedPeriods] = useState(initial)
  const result = calculateDebt({
    months: MONTHS,
    inflationMethod: 'monthly',
    excludedPeriods,
  })
  return (
    <DebtCalculationContext.Provider
      value={
        {
          excludedPeriods,
          setExcludedPeriods,
          from: dayjs(from),
          to: dayjs(to),
          overrides: {},
          prefillMonths: {},
          indexByPeriod: {},
          setMonthOverride: jest.fn(),
          inflationMethod: 'monthly',
        } as unknown as IDebtCalculationContext
      }
    >
      <ExcludedPeriods />
      <MonthsTable result={result} />
      <output data-testid="inflation">{result.inflation.toFixed(2)}</output>
    </DebtCalculationContext.Provider>
  )
}

const openSettings = () =>
  userEvent.click(screen.getByRole('button', { name: 'Виключені періоди' }))

describe('excluded periods on the page', () => {
  it('has none until the user adds one, and shows no marks column then', async () => {
    render(<Page />)
    expect(screen.queryByLabelText('Нараховується')).not.toBeInTheDocument()

    await openSettings()
    expect(
      await screen.findByText(/Немає\. Додайте період/)
    ).toBeInTheDocument()
  })

  const cmuSwitch = () =>
    screen.getByRole('switch', { name: 'Мораторій КМУ №206' })

  it('the КМУ №206 switch adds the preset and marks the months', async () => {
    render(<Page />)
    const before = screen.getByTestId('inflation').textContent
    expect(cmuSwitch()).not.toBeChecked()

    await userEvent.click(cmuSwitch())

    expect(cmuSwitch()).toBeChecked()
    // November wholly out, December out until the 29th, 2024 counts again.
    expect(
      screen.getByLabelText(
        /^Не нараховується: КМУ №206: 24\.02\.2022—29\.12\.2023/
      )
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText(
        /^Виключено 29 з 31 днів .*індекс місяця не враховано/
      )
    ).toBeInTheDocument()
    expect(screen.getAllByLabelText('Нараховується')).toHaveLength(2)
    expect(screen.getByTestId('inflation').textContent).not.toBe(before)

    await openSettings()
    expect(await screen.findByDisplayValue('24.02.2022')).toBeInTheDocument()
    expect(screen.getByDisplayValue('29.12.2023')).toBeInTheDocument()
  })

  it('switching it off puts the calculation back as it was', async () => {
    render(<Page />)
    const before = screen.getByTestId('inflation').textContent

    await userEvent.click(cmuSwitch())
    await userEvent.click(cmuSwitch())

    expect(cmuSwitch()).not.toBeChecked()
    expect(screen.getByTestId('inflation').textContent).toBe(before)
    expect(screen.queryByLabelText('Нараховується')).not.toBeInTheDocument()
  })

  it('the switch is on when the calculation already has the preset', () => {
    render(
      <Page
        initial={[
          {
            id: 'x',
            type: 'cmu_206',
            startDate: '2022-02-24',
            endDate: '2023-12-29',
          },
        ]}
      />
    )
    expect(cmuSwitch()).toBeChecked()
  })

  it('has no switch when the moratorium does not touch the period', () => {
    render(<Page from="2025-03-01" to="2025-06-01" />)

    expect(
      screen.queryByRole('switch', { name: 'Мораторій КМУ №206' })
    ).not.toBeInTheDocument()
  })

  it('counts only the exclusions that fall in the period', async () => {
    const outside = {
      id: 'o',
      type: 'custom' as const,
      startDate: '2019-01-01',
      endDate: '2019-03-31',
    }
    render(<Page initial={[outside]} />)

    const button = screen.getByRole('button', { name: 'Виключені періоди' })
    expect(button.closest('.ant-badge')?.querySelector('sup')).toBeNull()

    await userEvent.click(cmuSwitch())

    expect(
      button.closest('.ant-badge')?.querySelector('sup')?.textContent
    ).toBe('1')
  })

  it('removes a period from the list, and the calculation is as before', async () => {
    render(<Page />)
    const before = screen.getByTestId('inflation').textContent

    await userEvent.click(cmuSwitch())
    await openSettings()
    await userEvent.click(
      await screen.findByRole('button', { name: 'Прибрати період' })
    )

    expect(screen.getByTestId('inflation').textContent).toBe(before)
    expect(screen.queryByLabelText('Нараховується')).not.toBeInTheDocument()
    expect(cmuSwitch()).not.toBeChecked()
  })

  it('turns a preset into a custom period once its type is changed', async () => {
    render(
      <Page
        initial={[
          {
            id: 'x',
            type: 'cmu_206',
            startDate: '2022-02-24',
            endDate: '2023-12-29',
          },
        ]}
      />
    )
    await openSettings()

    await userEvent.click(
      await screen.findByRole('combobox', { name: 'Тип виключення' })
    )
    await userEvent.click(await screen.findByTitle('Довільний'))

    // A custom period starts without dates, so nothing is excluded any more.
    expect(screen.queryByLabelText(/^Не нараховується/)).not.toBeInTheDocument()
  })
})
