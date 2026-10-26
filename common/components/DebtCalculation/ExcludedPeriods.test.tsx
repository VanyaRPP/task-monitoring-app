import { calculateDebt } from '@utils/debt-calculation/calculate'
import type { IExcludedPeriod } from '@utils/debt-calculation/exclusions'
import { render, screen } from '@testing-library/react'
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

const Page: React.FC<{ initial?: IExcludedPeriod[] }> = ({ initial = [] }) => {
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

  it('adds the КМУ №206 preset with its dates and marks the months', async () => {
    render(<Page />)
    const before = screen.getByTestId('inflation').textContent

    await openSettings()
    await userEvent.click(
      await screen.findByRole('button', { name: '+ КМУ №206' })
    )

    expect(screen.getByDisplayValue('24.02.2022')).toBeInTheDocument()
    expect(screen.getByDisplayValue('29.12.2023')).toBeInTheDocument()
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
  })

  it('removes a period, and the calculation is as before', async () => {
    render(<Page />)
    const before = screen.getByTestId('inflation').textContent

    await openSettings()
    await userEvent.click(
      await screen.findByRole('button', { name: '+ КМУ №206' })
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Прибрати період' })
    )

    expect(screen.getByTestId('inflation').textContent).toBe(before)
    expect(screen.queryByLabelText('Нараховується')).not.toBeInTheDocument()
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
