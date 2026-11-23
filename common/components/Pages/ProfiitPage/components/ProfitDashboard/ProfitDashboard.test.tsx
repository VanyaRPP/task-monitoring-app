import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { ProfitMonthRow } from '@common/api/profitsApi/profits.type'
import ProfitDashboard from './index'

jest.mock('next-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('@modules/hooks/useTheme', () => ({
  __esModule: true,
  default: () => ['light', jest.fn()],
}))

type PieSlice = { type: string; value: number }
type PieProps = {
  data: PieSlice[]
  scale: { color: { domain: string[]; range: string[] } }
  tooltip: { items: ((d: PieSlice) => { name: string; value: string })[] }
}

let pieProps: PieProps | null = null
jest.mock('@ant-design/plots', () => ({
  Column: () => <div data-testid="column-chart" />,
  Pie: (props: PieProps) => {
    pieProps = props
    return <div data-testid="pie-chart" />
  },
}))

const expense = (category: string, amount: number) => ({
  _id: category,
  type: 'debit' as const,
  date: '2026-10-05',
  amount,
  currency: 'UAH',
  items: [{ category, amount }],
})

const totals = {
  expected: 0,
  actual: 0,
  income: 0,
  expenses: 1000,
  outstanding: 0,
  net: -1000,
}

const dataSource: ProfitMonthRow[] = [
  {
    key: '2026-10',
    month: '2026-10',
    currencies: ['UAH'],
    byCurrency: { UAH: totals },
    invoiceCount: 0,
    paymentCount: 0,
    transactions: [
      expense('Косметика', 600),
      expense('Навчання', 300),
      expense('Доставка', 100),
    ],
  },
]

const legendItem = (name: RegExp) => screen.getByRole('button', { name })

const sliceNames = () => pieProps?.data.map((d) => d.type)

const tooltipFor = (type: string) => {
  const slice = pieProps?.data.find((d) => d.type === type) as PieSlice
  return pieProps?.tooltip.items[0](slice).value
}

describe('ProfitDashboard — категорії на графіку «Структура витрат»', () => {
  beforeEach(() => {
    pieProps = null
  })

  it('спочатку показує всі категорії', () => {
    render(<ProfitDashboard dataSource={dataSource} />)

    expect(sliceNames()).toEqual(['Косметика', 'Навчання', 'Доставка'])
    expect(legendItem(/Косметика/)).toHaveAttribute('aria-pressed', 'true')
  })

  it('приховує категорію по кліку та повертає по повторному кліку', async () => {
    render(<ProfitDashboard dataSource={dataSource} />)

    await userEvent.click(legendItem(/Доставка/))

    expect(sliceNames()).toEqual(['Косметика', 'Навчання'])
    expect(legendItem(/Доставка/)).toHaveAttribute('aria-pressed', 'false')
    // stays in the legend so it can be switched back on
    expect(legendItem(/Доставка/)).toHaveTextContent('—')

    await userEvent.click(legendItem(/Доставка/))

    expect(sliceNames()).toEqual(['Косметика', 'Навчання', 'Доставка'])
    expect(legendItem(/Доставка/)).toHaveAttribute('aria-pressed', 'true')
  })

  it('перераховує відсотки в легенді й Tooltip за видимими категоріями', async () => {
    render(<ProfitDashboard dataSource={dataSource} />)

    expect(legendItem(/Косметика/)).toHaveTextContent('60.0%')
    expect(tooltipFor('Косметика')).toContain('(60.0%)')

    await userEvent.click(legendItem(/Доставка/))

    expect(legendItem(/Косметика/)).toHaveTextContent('66.7%')
    expect(legendItem(/Навчання/)).toHaveTextContent('33.3%')
    expect(tooltipFor('Косметика')).toContain('600')
    expect(tooltipFor('Косметика')).toContain('(66.7%)')
  })

  it('дозволяє приховати кілька категорій одночасно', async () => {
    render(<ProfitDashboard dataSource={dataSource} />)

    await userEvent.click(legendItem(/Доставка/))
    await userEvent.click(legendItem(/Навчання/))

    expect(sliceNames()).toEqual(['Косметика'])
    expect(legendItem(/Косметика/)).toHaveTextContent('100.0%')
    expect(tooltipFor('Косметика')).toContain('(100.0%)')
  })

  it('показує порожній стан, коли приховано всі категорії', async () => {
    render(<ProfitDashboard dataSource={dataSource} />)

    await userEvent.click(legendItem(/Косметика/))
    await userEvent.click(legendItem(/Навчання/))
    await userEvent.click(legendItem(/Доставка/))

    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument()
    expect(
      screen.getByText('profitPage:dashboard.allCategoriesHidden')
    ).toBeInTheDocument()
    // the legend is still there to bring categories back
    await userEvent.click(legendItem(/Навчання/))
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    expect(sliceNames()).toEqual(['Навчання'])
  })

  describe('сторінки легенди', () => {
    // 9 categories: one full page of 8 and one of a single row.
    const manyCategories: ProfitMonthRow[] = [
      {
        ...dataSource[0],
        transactions: Array.from({ length: 9 }, (_, i) =>
          expense(`Категорія ${String(i + 1).padStart(2, '0')}`, 1300 - i * 100)
        ),
      },
    ]

    const legendRows = () =>
      screen.getAllByRole('button', { name: /Категорія/ })
    const prev = () =>
      screen.getByRole('button', {
        name: 'profitPage:dashboard.legendPrevPage',
      })
    const next = () =>
      screen.getByRole('button', {
        name: 'profitPage:dashboard.legendNextPage',
      })

    it('не показує стрілки, коли категорії вміщаються на одну сторінку', () => {
      render(<ProfitDashboard dataSource={dataSource} />)

      expect(
        screen.queryByRole('button', {
          name: 'profitPage:dashboard.legendNextPage',
        })
      ).not.toBeInTheDocument()
    })

    it('гортає легенду стрілками вперед і назад', async () => {
      render(<ProfitDashboard dataSource={manyCategories} />)

      expect(legendRows()).toHaveLength(8)
      expect(screen.getByText('1/2')).toBeInTheDocument()
      expect(prev()).toBeDisabled()

      await userEvent.click(next())

      expect(legendRows()).toHaveLength(1)
      expect(legendItem(/Категорія 09/)).toBeInTheDocument()
      expect(screen.getByText('2/2')).toBeInTheDocument()
      expect(next()).toBeDisabled()

      await userEvent.click(prev())

      expect(legendRows()).toHaveLength(8)
      expect(screen.getByText('1/2')).toBeInTheDocument()
    })

    it('гортання не змінює діаграму, а приховування працює на будь-якій сторінці', async () => {
      render(<ProfitDashboard dataSource={manyCategories} />)

      await userEvent.click(next())
      // paging the legend leaves every slice on the ring
      expect(sliceNames()).toHaveLength(9)

      await userEvent.click(legendItem(/Категорія 09/))

      expect(sliceNames()).toHaveLength(8)
      expect(sliceNames()).not.toContain('Категорія 09')
      expect(legendItem(/Категорія 09/)).toHaveAttribute(
        'aria-pressed',
        'false'
      )
    })
  })

  it('не змінює вихідні дані та кольори категорій', async () => {
    const snapshot = JSON.stringify(dataSource)
    render(<ProfitDashboard dataSource={dataSource} />)
    const colorsBefore = pieProps?.scale.color

    await userEvent.click(legendItem(/Косметика/))

    expect(JSON.stringify(dataSource)).toBe(snapshot)
    // hiding a slice must not shift the colours of the rest
    expect(pieProps?.scale.color).toEqual(colorsBefore)
  })
})
