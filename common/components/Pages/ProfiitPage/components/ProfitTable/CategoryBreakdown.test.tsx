import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { Profit } from '@common/api/profitsApi/profits.type'
import CategoryBreakdown from './CategoryBreakdown'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('i18next', () => ({ t: (key: string) => key }))

const expense = (
  id: string,
  date: string,
  category: string,
  amount: number,
  description?: string
): Profit => ({
  _id: id,
  type: 'debit',
  date,
  amount,
  currency: 'UAH',
  items: [{ category, amount, description }],
})

const renderBreakdown = (transactions: Profit[], onPreview = jest.fn()) =>
  render(
    <CategoryBreakdown
      transactions={transactions}
      onPreview={onPreview}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
      isDeleting={false}
    />
  )

describe('CategoryBreakdown', () => {
  it('shows one row per category and opens its individual expenses', async () => {
    renderBreakdown([
      expense('a', '2026-04-01', 'Електрика', 100, 'Лампи'),
      expense('b', '2026-04-10', 'електрика', 50, 'Кабель'),
      expense('c', '2026-04-05', 'Вода', 30),
    ])

    expect(screen.getAllByText(/^(Електрика|електрика|Вода)$/)).toHaveLength(2)
    expect(screen.queryByText('Лампи')).not.toBeInTheDocument()

    await userEvent.click(screen.getByText('Електрика'))

    expect(screen.getByText('Лампи')).toBeInTheDocument()
    expect(screen.getByText('Кабель')).toBeInTheDocument()
  })

  it('opens the whole receipt when a line is previewed', async () => {
    const onPreview = jest.fn()
    const record = expense('a', '2026-04-01', 'Вода', 30, 'Лічильник')
    renderBreakdown([record], onPreview)

    await userEvent.click(screen.getByText('Вода'))
    await userEvent.click(
      within(screen.getByText('Лічильник').closest('tr')).getByRole('button', {
        name: 'actions.preview',
      })
    )

    // the line's position lets the modal open on that line, not the whole receipt
    expect(onPreview).toHaveBeenCalledWith(record, 0)
  })

  it('lists income among the records but keeps it out of the category shares', async () => {
    renderBreakdown([
      expense('a', '2026-04-01', 'Вода', 30),
      { _id: 'i', type: 'credit', date: '2026-04-02', amount: 500 },
    ])

    await userEvent.click(
      screen.getByText('profitPage:table.child.recordsTitle')
    )

    expect(screen.getByText(/500,00/)).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '100'
    )
  })

  it('deletes a whole record from the records table', async () => {
    const onDelete = jest.fn()
    render(
      <CategoryBreakdown
        transactions={[expense('a', '2026-04-01', 'Вода', 30)]}
        onPreview={jest.fn()}
        onEdit={jest.fn()}
        onDelete={onDelete}
        isDeleting={false}
      />
    )

    await userEvent.click(
      screen.getByText('profitPage:table.child.recordsTitle')
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'actions.delete' })
    )
    await userEvent.click(
      document.querySelector('.ant-popover .ant-btn-primary') as HTMLElement
    )

    expect(onDelete).toHaveBeenCalledWith('a')
  })
})
