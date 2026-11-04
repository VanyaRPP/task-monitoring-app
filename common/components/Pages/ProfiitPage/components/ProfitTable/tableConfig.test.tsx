import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ProfitItemsCell } from './tableConfig'

jest.mock('i18next', () => ({
  t: (key: string, opts?: { count?: number }) =>
    opts?.count != null ? `${key}:${opts.count}` : key,
}))

const manyItems = Array.from({ length: 35 }, (_, i) => ({
  category: `Cat ${i + 1}`,
  amount: (i + 1) * 10,
}))

describe('ProfitItemsCell', () => {
  it('shows only the biggest lines of a long receipt until expanded', async () => {
    render(<ProfitItemsCell items={manyItems} currency="UAH" />)

    // 35 lines, 8 visible: the biggest ones (Cat 35 .. Cat 28).
    expect(screen.getByText('Cat 35')).toBeInTheDocument()
    expect(screen.getByText('Cat 28')).toBeInTheDocument()
    expect(screen.queryByText('Cat 27')).not.toBeInTheDocument()
    expect(screen.queryByText('Cat 1')).not.toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: 'table.child.showMore:27' })
    )
    expect(screen.getByText('Cat 1')).toBeInTheDocument()
    expect(screen.getByText('Cat 27')).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: 'table.child.showLess' })
    )
    expect(screen.queryByText('Cat 1')).not.toBeInTheDocument()
  })

  it('shows a short receipt in full with no toggle', () => {
    render(<ProfitItemsCell items={manyItems.slice(0, 5)} currency="UAH" />)

    expect(screen.getByText('Cat 1')).toBeInTheDocument()
    expect(screen.getByText('Cat 5')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
