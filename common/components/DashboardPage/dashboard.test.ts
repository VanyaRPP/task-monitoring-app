import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

const ALL_WIDGET_IDS = [
  'payments',
  'paymentsChart',
  'services',
  'streets',
  'domain',
  'realEstate',
  'profits',
  'companies',
]

function TestDashboard({ userId = 'user-123' }: { userId?: string }) {
  const [ordered, setOrdered] = React.useState<string[]>([...ALL_WIDGET_IDS])
  const [hidden, setHidden] = React.useState<string[]>([])

  React.useEffect(() => {
    const key = `dashboard-layout-${userId}`
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        setOrdered(parsed.layout ?? ALL_WIDGET_IDS)
        setHidden(parsed.hidden ?? [])
      } catch {}
    }
  }, [userId])

  const save = () => {
    const key = `dashboard-layout-${userId}`
    localStorage.setItem(key, JSON.stringify({ layout: ordered, hidden }))
  }

  const move = (id: string, toIndex: number) => {
    setOrdered((prev) => {
      const from = prev.indexOf(id)
      if (from === -1) return prev
      const copy = [...prev]
      copy.splice(from, 1)
      copy.splice(toIndex, 0, id)
      return copy
    })
  }

  const toggleHidden = (id: string) =>
    setHidden((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )

  return React.createElement(
    'div',
    null,
    React.createElement(
      'div',
      null,
      React.createElement(
        'button',
        { 'aria-label': 'save', onClick: save },
        'Зберегти'
      ),
      React.createElement(
        'button',
        { 'aria-label': 'visibility-menu' },
        'Приховати'
      ),
      React.createElement(
        'div',
        { 'data-testid': 'visibility-menu' },
        ...ALL_WIDGET_IDS.map((id) =>
          React.createElement(
            'button',
            {
              key: id,
              'data-testid': `toggle-${id}`,
              onClick: () => toggleHidden(id),
            },
            hidden.includes(id) ? `Показати ${id}` : `Сховати ${id}`
          )
        )
      )
    ),
    React.createElement(
      'div',
      null,
      ...ordered
        .filter((id) => !hidden.includes(id))
        .map((id, idx) =>
          React.createElement(
            'div',
            { key: id, id, 'data-testid': `widget-${id}` },
            React.createElement('span', null, id),
            React.createElement(
              'button',
              {
                'data-testid': `move-up-${id}`,
                onClick: () => move(id, Math.max(0, idx - 1)),
              },
              'up'
            ),
            React.createElement(
              'button',
              {
                'data-testid': `move-down-${id}`,
                onClick: () =>
                  move(id, Math.min(ALL_WIDGET_IDS.length - 1, idx + 1)),
              },
              'down'
            )
          )
        )
    )
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('Dashboard — basic behaviors', () => {
  it('Всі таблиці: рендерить усі 8 віджетів за замовчуванням', async () => {
    render(React.createElement(TestDashboard))
    await waitFor(() => {
      ALL_WIDGET_IDS.forEach((id) =>
        expect(screen.getByTestId(`widget-${id}`)).toBeInTheDocument()
      )
    })
  })

  it('Обробка переміщень таблиць: змінює порядок і зберігає його', async () => {
    const user = userEvent.setup()
    render(React.createElement(TestDashboard))
    await user.click(screen.getByTestId('move-down-payments'))
    await user.click(screen.getByRole('button', { name: 'save' }))

    const raw = localStorage.getItem('dashboard-layout-user-123')
    expect(raw).not.toBeNull()
    if (raw === null) throw new Error('localStorage value missing')
    const saved = JSON.parse(raw)
    expect(Array.isArray(saved.layout)).toBe(true)
    expect(saved.layout[0]).not.toBe('payments')
  })

  it('Збереження у local Storage: зберігає layout і hidden', async () => {
    const user = userEvent.setup()
    render(React.createElement(TestDashboard))
    await user.click(screen.getByTestId('toggle-streets'))
    await user.click(screen.getByRole('button', { name: 'save' }))

    const raw = localStorage.getItem('dashboard-layout-user-123')
    expect(raw).not.toBeNull()
    if (raw === null) throw new Error('localStorage value missing')
    const saved = JSON.parse(raw)
    expect(saved).toHaveProperty('layout')
    expect(saved).toHaveProperty('hidden')
    expect(saved.hidden).toContain('streets')
  })

  it('Приховання таблиць: ховає віджет після вибору у меню видимості', async () => {
    const user = userEvent.setup()
    render(React.createElement(TestDashboard))
    expect(screen.getByTestId('widget-payments')).toBeInTheDocument()
    await user.click(screen.getByTestId('toggle-payments'))
    await waitFor(() =>
      expect(screen.queryByTestId('widget-payments')).not.toBeInTheDocument()
    )
  })

  it('Відображення таблиць після приховання: показує віджет знову після повторного кліку', async () => {
    const user = userEvent.setup()
    render(React.createElement(TestDashboard))
    await user.click(screen.getByTestId('toggle-services'))
    await waitFor(() =>
      expect(screen.queryByTestId('widget-services')).not.toBeInTheDocument()
    )
    await user.click(screen.getByTestId('toggle-services'))
    await waitFor(() =>
      expect(screen.getByTestId('widget-services')).toBeInTheDocument()
    )
  })
})
