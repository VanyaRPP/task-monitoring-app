import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import DebtBadge from '.'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

const badgeCount = () => document.querySelector('.ant-badge-count')?.textContent

const badgeColor = () => {
  const el = document.querySelector('.ant-badge-count') as HTMLElement
  if (!el) return undefined
  const preset = Array.from(el.classList).find((c) =>
    c.startsWith('ant-badge-color-')
  )
  return preset ? preset.replace('ant-badge-color-', '') : el.style.background
}

describe('DebtBadge', () => {
  it('shows the debt amount and color when the company owes', () => {
    render(<DebtBadge companyName="Company A" totalDebt={1500} />)

    expect(badgeCount()).toBe('1500.00')
    expect(badgeColor()).toBe('gray')
  })

  it('shows a signed amount when the domain owes the company', () => {
    render(<DebtBadge companyName="Company A" totalDebt={-1500} />)

    expect(badgeCount()).toBe('-1500.00')
    expect(badgeColor()).toBe('cyan')
  })

  it('renders no badge for zero debt', () => {
    render(<DebtBadge companyName="Company A" totalDebt={0} />)

    expect(document.querySelector('.ant-badge-count')).toBeNull()
  })

  it('renders only children for zero debt', () => {
    render(
      <DebtBadge companyName="Company A" totalDebt={0}>
        <span>Label</span>
      </DebtBadge>
    )

    expect(screen.getByText('Label')).toBeInTheDocument()
    expect(document.querySelector('.ant-badge-count')).toBeNull()
  })

  it('wraps children with the badge', () => {
    render(
      <DebtBadge companyName="Company A" totalDebt={1500}>
        <span>Label</span>
      </DebtBadge>
    )

    expect(screen.getByText('Label')).toBeInTheDocument()
    expect(badgeCount()).toBe('1500.00')
  })

  it('shows debt tooltip with dynamic company name and amount', async () => {
    render(<DebtBadge companyName="Solana" totalDebt={1819.73} />)

    await userEvent.hover(document.querySelector('.ant-badge') as Element)

    expect(await screen.findByText('Компанія боржник')).toBeInTheDocument()
    expect(screen.getByText('Назва компанії: Solana')).toBeInTheDocument()
    expect(screen.getByText(/Сума боргу: 1819.73/)).toBeInTheDocument()
  })

  it('shows overpayment tooltip when the debt is negative', async () => {
    render(<DebtBadge companyName="Solana" totalDebt={-500} />)

    await userEvent.hover(document.querySelector('.ant-badge') as Element)

    expect(await screen.findByText('Переплата компанії')).toBeInTheDocument()
    expect(screen.getByText(/Сума переплати: 500.00/)).toBeInTheDocument()
    expect(screen.queryByText('Компанія боржник')).not.toBeInTheDocument()
  })

  it('shows inflation losses for a debtor when provided', async () => {
    render(
      <DebtBadge
        companyName="Solana"
        totalDebt={1500}
        inflation={{
          loss: 120,
          from: '01.2026',
          to: '10.2026',
          method: 'balance',
        }}
      />
    )

    await userEvent.hover(document.querySelector('.ant-badge') as Element)

    expect(
      await screen.findByText(/Інфляційні втрати: 120.00/)
    ).toBeInTheDocument()
    expect(screen.getByText(/за залишком/)).toBeInTheDocument()
  })
})
