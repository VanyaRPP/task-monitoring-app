import { useState } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PaymentDateRangeFilter from '@components/UI/PaymentDateRangeFilter'
import { PaymentDateRange } from '@utils/paymentDateRange'
import { DATE_RANGE_HISTORY_STORAGE_KEY } from '@utils/dateRangeHistory'

// Freeze only `Date` so the calendar opens on a known month; real timers keep
// antd animations and user-event working.
const freezeToday = (iso: string) => {
  jest.useFakeTimers({
    doNotFake: [
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'setImmediate',
      'clearImmediate',
      'nextTick',
      'queueMicrotask',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'requestIdleCallback',
      'cancelIdleCallback',
      'performance',
      'hrtime',
    ],
  })
  jest.setSystemTime(new Date(iso))
}

/** Mirrors the payments page: the range lives in parent (Redux) state. */
const Harness = ({
  initial = null,
  onChange,
  historyScope,
}: {
  initial?: PaymentDateRange | null
  onChange: jest.Mock
  historyScope?: string
}) => {
  const [range, setRange] = useState<PaymentDateRange | null>(initial)
  return (
    <PaymentDateRangeFilter
      value={range}
      historyScope={historyScope}
      onChange={(next) => {
        onChange(next)
        setRange(next)
      }}
    />
  )
}

const cell = (date: string) =>
  document.querySelector<HTMLElement>(
    `.ant-picker-dropdown td[title="${date}"]`
  )

const clickCell = async (date: string) => {
  await waitFor(() => expect(cell(date)).not.toBeNull())
  await userEvent.click(cell(date))
}

const openPicker = () => userEvent.click(screen.getByPlaceholderText('Від'))

const panelHeaders = () =>
  Array.from(
    document.querySelectorAll('.ant-picker-dropdown .ant-picker-header-view')
  ).map((el) => el.textContent)

describe('PaymentDateRangeFilter', () => {
  beforeEach(() => freezeToday('2026-08-15T12:00:00'))
  afterEach(() => jest.useRealTimers())

  it('показує два місяці поруч при відкритті', async () => {
    render(<Harness onChange={jest.fn()} />)
    await openPicker()

    await waitFor(() => expect(panelHeaders()).toHaveLength(2))
    expect(panelHeaders()[0]).toMatch(/2026/)
    expect(cell('2026-08-01')).not.toBeNull()
    expect(cell('2026-09-28')).not.toBeNull()
  })

  it('застосовує фільтр після вибору from і to', async () => {
    const onChange = jest.fn()
    render(<Harness onChange={onChange} />)
    await openPicker()

    await clickCell('2026-08-01')
    expect(onChange).not.toHaveBeenCalled()

    await clickCell('2026-09-28')
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({
      dateFrom: '2026-08-01',
      dateTo: '2026-09-28',
    })
    expect(screen.getByPlaceholderText('Від')).toHaveValue('01.08.2026')
    expect(screen.getByPlaceholderText('До')).toHaveValue('28.09.2026')
  })

  it('передає лише фінальний range, а не проміжні кліки', async () => {
    const onChange = jest.fn()
    render(<Harness onChange={onChange} />)
    await openPicker()

    await clickCell('2026-08-03')
    await clickCell('2026-09-28')

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({
      dateFrom: '2026-08-03',
      dateTo: '2026-09-28',
    })
  })

  it('відображає вже обраний проміжок зі стану/URL', async () => {
    render(
      <Harness
        initial={{ dateFrom: '2025-03-10', dateTo: '2025-04-20' }}
        onChange={jest.fn()}
      />
    )

    expect(screen.getByPlaceholderText('Від')).toHaveValue('10.03.2025')
    expect(screen.getByPlaceholderText('До')).toHaveValue('20.04.2025')

    await openPicker()
    await waitFor(() => expect(cell('2025-03-10')).not.toBeNull())
    expect(cell('2025-03-10')).toHaveClass('ant-picker-cell-range-start')
  })

  it('очищає обраний проміжок', async () => {
    const onChange = jest.fn()
    const { container } = render(
      <Harness
        initial={{ dateFrom: '2026-08-01', dateTo: '2026-09-28' }}
        onChange={onChange}
      />
    )

    await userEvent.hover(container.querySelector('.ant-picker'))
    await userEvent.click(container.querySelector('.ant-picker-clear'))

    expect(onChange).toHaveBeenCalledWith(null)
    expect(screen.getByPlaceholderText('Від')).toHaveValue('')
    expect(screen.getByPlaceholderText('До')).toHaveValue('')
  })

  it('дозволяє вибрати проміжок через кілька місяців', async () => {
    const onChange = jest.fn()
    render(<Harness onChange={onChange} />)
    await openPicker()

    await clickCell('2026-08-20')
    const [nextMonth] = screen.getAllByRole('button', {
      name: /Наступний місяць/,
    })
    await userEvent.click(nextMonth)
    await userEvent.click(nextMonth)

    await clickCell('2026-11-05')
    expect(onChange).toHaveBeenCalledWith({
      dateFrom: '2026-08-20',
      dateTo: '2026-11-05',
    })
  })

  it('дозволяє вибрати проміжок через межу року', async () => {
    const onChange = jest.fn()
    render(<Harness onChange={onChange} />)
    await openPicker()

    const [prevYear] = screen.getAllByRole('button', {
      name: /Попередній рік/,
    })
    await userEvent.click(prevYear)
    // Aug 2025 + Sep 2025 → walk forward to Dec 2025 / Jan 2026.
    const [nextMonth] = screen.getAllByRole('button', {
      name: /Наступний місяць/,
    })
    for (let i = 0; i < 4; i++) await userEvent.click(nextMonth)

    await clickCell('2025-12-29')
    await clickCell('2026-01-02')

    expect(onChange).toHaveBeenCalledWith({
      dateFrom: '2025-12-29',
      dateTo: '2026-01-02',
    })
  })
})

describe('PaymentDateRangeFilter — останні проміжки', () => {
  const recentPanel = () =>
    screen.findByRole('navigation', { name: 'Останні проміжки' })

  const recentLabels = async () =>
    within(await recentPanel())
      .queryAllByRole('button')
      .map((button) => button.textContent)

  const storedScopes = () =>
    JSON.parse(
      window.localStorage.getItem(DATE_RANGE_HISTORY_STORAGE_KEY) ?? 'null'
    )?.scopes

  const seed = (scopes: Record<string, [string, string][]>) =>
    window.localStorage.setItem(
      DATE_RANGE_HISTORY_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        scopes: Object.fromEntries(
          Object.entries(scopes).map(([scope, items]) => [
            scope,
            items.map(([from, to], i) => ({ from, to, usedAt: 100 - i })),
          ])
        ),
      })
    )

  beforeEach(() => {
    freezeToday('2026-08-15T12:00:00')
    window.localStorage.clear()
  })
  afterEach(() => jest.useRealTimers())

  it('не показує панель без historyScope', async () => {
    render(<Harness onChange={jest.fn()} />)
    await openPicker()
    await waitFor(() => expect(cell('2026-08-01')).not.toBeNull())

    expect(
      screen.queryByRole('navigation', { name: 'Останні проміжки' })
    ).not.toBeInTheDocument()
  })

  it('показує підказку, коли історії ще немає', async () => {
    render(<Harness onChange={jest.fn()} historyScope="global" />)
    await openPicker()

    expect(await recentPanel()).toHaveTextContent(
      "Тут з'являться застосовані проміжки"
    )
  })

  it('додає застосований проміжок у Recent і localStorage', async () => {
    render(<Harness onChange={jest.fn()} historyScope="domain:A" />)
    await openPicker()
    await clickCell('2026-08-01')
    await clickCell('2026-09-28')

    expect(storedScopes()).toEqual({
      'domain:A': [
        { from: '2026-08-01', to: '2026-09-28', usedAt: expect.any(Number) },
      ],
    })

    await openPicker()
    expect(await recentLabels()).toEqual(['01.08.2026 — 28.09.2026'])
  })

  it('записує лише фінальний проміжок, а не проміжні кліки', async () => {
    render(<Harness onChange={jest.fn()} historyScope="global" />)
    await openPicker()

    await clickCell('2026-08-03')
    expect(storedScopes()).toBeUndefined()

    const [nextMonth] = screen.getAllByRole('button', {
      name: /Наступний місяць/,
    })
    await userEvent.click(nextMonth)
    expect(storedScopes()).toBeUndefined()

    await clickCell('2026-10-05')
    expect(storedScopes().global).toEqual([
      { from: '2026-08-03', to: '2026-10-05', usedAt: expect.any(Number) },
    ])
  })

  it('клік по запису застосовує range, оновлює picker і закриває popup', async () => {
    seed({
      global: [
        ['2025-01-01', '2025-12-31'],
        ['2026-08-01', '2026-09-28'],
      ],
    })
    const onChange = jest.fn()
    render(<Harness onChange={onChange} historyScope="global" />)
    await openPicker()

    await userEvent.click(
      within(await recentPanel()).getByRole('button', {
        name: '01.08.2026 — 28.09.2026',
      })
    )

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({
      dateFrom: '2026-08-01',
      dateTo: '2026-09-28',
    })
    expect(screen.getByPlaceholderText('Від')).toHaveValue('01.08.2026')
    expect(screen.getByPlaceholderText('До')).toHaveValue('28.09.2026')
    await waitFor(() =>
      expect(
        document.querySelector('.ant-picker-dropdown-hidden')
      ).not.toBeNull()
    )
    // Re-applied entry moves to the top.
    expect(storedScopes().global.map((i) => i.from)).toEqual([
      '2026-08-01',
      '2025-01-01',
    ])
  })

  it('відновлює історію після reload', async () => {
    const { unmount } = render(
      <Harness onChange={jest.fn()} historyScope="company:X" />
    )
    await openPicker()
    await clickCell('2026-08-01')
    await clickCell('2026-08-31')
    unmount()

    render(<Harness onChange={jest.fn()} historyScope="company:X" />)
    await openPicker()

    expect(await recentLabels()).toEqual(['Серпень 2026'])
  })

  it('показує історію саме активного scope', async () => {
    seed({
      'domain:A': [['2025-01-01', '2025-12-31']],
      'domain:B': [
        ['2026-03-01', '2026-03-31'],
        ['2026-08-01', '2026-08-31'],
      ],
      'domain:A,B': [['2026-09-01', '2026-09-30']],
      'company:X': [['2026-08-01', '2026-09-28']],
    })
    const { rerender } = render(
      <Harness onChange={jest.fn()} historyScope="domain:A" />
    )
    await openPicker()
    expect(await recentLabels()).toEqual(['2025 рік'])

    rerender(<Harness onChange={jest.fn()} historyScope="domain:B" />)
    expect(await recentLabels()).toEqual(['Березень 2026', 'Серпень 2026'])

    rerender(<Harness onChange={jest.fn()} historyScope="domain:A,B" />)
    expect(await recentLabels()).toEqual(['Вересень 2026'])

    rerender(<Harness onChange={jest.fn()} historyScope="company:X" />)
    expect(await recentLabels()).toEqual(['01.08.2026 — 28.09.2026'])
  })

  it('пише в scope, активний на момент застосування', async () => {
    const { rerender } = render(
      <Harness onChange={jest.fn()} historyScope="global" />
    )
    rerender(<Harness onChange={jest.fn()} historyScope="company:X" />)
    await openPicker()
    await clickCell('2026-08-01')
    await clickCell('2026-09-28')

    expect(Object.keys(storedScopes())).toEqual(['company:X'])
  })

  it('очищення фільтра не очищає історію', async () => {
    seed({ global: [['2026-08-01', '2026-09-28']] })
    const onChange = jest.fn()
    const { container } = render(
      <Harness
        initial={{ dateFrom: '2026-08-01', dateTo: '2026-09-28' }}
        onChange={onChange}
        historyScope="global"
      />
    )

    await userEvent.hover(container.querySelector('.ant-picker'))
    await userEvent.click(container.querySelector('.ant-picker-clear'))

    expect(onChange).toHaveBeenCalledWith(null)
    expect(storedScopes().global).toHaveLength(1)
    await openPicker()
    expect(await recentLabels()).toEqual(['01.08.2026 — 28.09.2026'])
  })
})
