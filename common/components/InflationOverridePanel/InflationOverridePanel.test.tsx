import { useGetInflationIndexesQuery } from '@common/api/inflationIndexApi/inflationIndex.api'
import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InflationOverridePanel from './index'
import type { IIndexChartRow } from './IndexChart'

jest.mock('@common/api/inflationIndexApi/inflationIndex.api', () => ({
  useGetInflationIndexesQuery: jest.fn(),
}))

jest.mock('@modules/hooks/useTheme', () => ({
  __esModule: true,
  default: () => ['light', jest.fn()],
}))

let mockChartRows: IIndexChartRow[] = []

// The canvas chart itself does not render in jsdom: its input is what matters.
jest.mock(
  'next/dynamic',
  () => () =>
    function LineStub({ data }: { data: IIndexChartRow[] }) {
      mockChartRows = data
      return <div data-testid="index-chart" />
    }
)

const OFFICIAL = [
  { year: 2025, month: 12, value: 100.2 },
  { year: 2026, month: 1, value: 100.7 },
  { year: 2026, month: 2, value: 101 },
]

const query = useGetInflationIndexesQuery as jest.Mock

const openPanel = (official = OFFICIAL) => {
  query.mockReturnValue({ data: official, isFetching: false })
  render(
    <InflationOverridePanel domains={[{ text: 'ОСББ А', value: 'domain-a' }]} />
  )
  return userEvent.click(screen.getByText('Індекс інфляції'))
}

const openTable = async (official = OFFICIAL) => {
  await openPanel(official)
  await userEvent.click(screen.getByText('Таблиця'))
}

const cellsOf = (year: string) =>
  within(screen.getByText(year).closest('tr') as HTMLElement)
    .getAllByRole('cell')
    .map((cell) => cell.textContent)

describe('InflationOverridePanel', () => {
  beforeEach(() => {
    jest.useFakeTimers({
      now: new Date('2026-03-15T12:00:00Z'),
      advanceTimers: true,
    })
    query.mockReset()
    mockChartRows = []
  })

  afterEach(() => jest.useRealTimers())

  it('відкривається графіком за останні 12 місяців, пропуски як null', async () => {
    await openPanel()

    expect(screen.getByTestId('index-chart')).toBeInTheDocument()
    expect(query).toHaveBeenLastCalledWith({ from: '2025-03', to: '2026-02' })
    expect(mockChartRows).toHaveLength(12)
    expect(mockChartRows.slice(-4)).toEqual([
      { month: '11.2025', value: null },
      { month: '12.2025', value: 100.2 },
      { month: '01.2026', value: 100.7 },
      { month: '02.2026', value: 101 },
    ])
  })

  it('каже, що за період немає індексів', async () => {
    await openPanel([])

    expect(
      screen.getByText('Немає індексів за обраний період')
    ).toBeInTheDocument()
  })

  it('таблиця має роки в рядках, місяці в колонках і підсумок за рік', async () => {
    await openTable()

    expect(query).toHaveBeenLastCalledWith(undefined)
    expect(
      screen.getByText(/споживчих цін з 2025 по 2026 рр/)
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('columnheader').map((cell) => cell.textContent)
    ).toEqual(expect.arrayContaining(['Рік', 'Січ', 'Чер', 'Гру', 'За рік']))
    // 100.7% × 101.0% = 101.7% for the two months of 2026
    expect(cellsOf('2026')).toEqual([
      '2026',
      '100,7',
      '101,0',
      ...Array(10).fill(''),
      '101,7',
    ])
    // Without January to November there is nothing to compound.
    expect(cellsOf('2025').slice(-2)).toEqual(['100,2', '—'])
  })

  it('не показує індекс домену та його редагування', async () => {
    await openTable()

    expect(screen.queryByText(/домен/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Змінити' })).toBeNull()
  })

  it('період графіка не обмежує таблицю', async () => {
    await openPanel()

    await userEvent.click(screen.getByPlaceholderText('Від місяця'))
    await userEvent.click(screen.getByTitle('2025-01'))
    await userEvent.click(screen.getByTitle('2025-06'))

    expect(query).toHaveBeenLastCalledWith({ from: '2025-01', to: '2025-06' })

    await userEvent.click(screen.getByText('Таблиця'))

    expect(query).toHaveBeenLastCalledWith(undefined)
    expect(screen.queryByPlaceholderText('Від місяця')).not.toBeInTheDocument()
  })
})
